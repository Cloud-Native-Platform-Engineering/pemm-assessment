#!/usr/bin/env python3
"""Validate the assessment content files in data/.

Checks that every language file stays structurally identical to the English source,
that version metadata is present and well formed, and that a change to the English
question set is accompanied by a content_version bump.

Why structural parity matters: field_name values and option values are serialized
straight into shareable result URLs, so they are a public contract. If one language
renames a field or drops an option, links shared from that language stop meaning the
same thing as links shared from another.

Usage:
    python3 scripts/validate_content.py                  # structural checks only
    python3 scripts/validate_content.py --base origin/main   # also gate version bumps

Exits non-zero if any blocking check fails. Files under data/quarantine/ are reported
on but never block, since they are known to be incomplete.
"""

import argparse
import glob
import html
import os
import re
import subprocess
import sys
from urllib.parse import urlparse

try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required: pip install pyyaml")

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_FILE = "data/questions-en.yaml"
PUBLISHED_GLOB = "data/questions-*.yaml"
QUARANTINE_GLOB = "data/quarantine/questions-*.yaml"

SEMVER = re.compile(r"^\d+\.\d+\.\d+$")
WHITEPAPER_HOST = "cloudnativeplatforms.com"

errors = []
warnings = []


def error(where, message):
    errors.append(f"{where}: {message}")


def warn(where, message):
    warnings.append(f"{where}: {message}")


def load(path):
    """Parse a content file, recording a blocking error if it is not valid YAML."""
    try:
        with open(os.path.join(REPO_ROOT, path), encoding="utf-8") as handle:
            return yaml.safe_load(handle)
    except (yaml.YAMLError, OSError) as exc:
        error(path, f"could not be parsed: {exc}")
        return None


def structure(doc):
    """Reduce a document to the parts that form the shareable-URL contract."""
    return [
        {
            "id": category.get("id"),
            "order": category.get("order"),
            "questions": [
                {
                    "id": question.get("id"),
                    "field_name": question.get("field_name"),
                    "values": [opt.get("value") for opt in (question.get("options") or [])],
                }
                for question in (category.get("questions") or [])
            ],
        }
        for category in (doc.get("categories") or [])
    ]


def base_url(url):
    parts = urlparse(url)
    return f"{parts.scheme}://{parts.netloc}{parts.path}"


def check_metadata(path, doc, report, source_model=None):
    """Version fields must be present, well formed, and internally consistent."""
    metadata = (doc or {}).get("metadata") or {}

    for field in ("content_version", "model_version", "model_url"):
        if not metadata.get(field):
            report(path, f"metadata.{field} is missing")

    version = metadata.get("content_version")
    if version and not SEMVER.match(str(version)):
        report(path, f"content_version {version!r} is not major.minor.patch")

    # Every language must describe the same upstream model release. model_url may differ --
    # a translation is encouraged to link its own localisation of the whitepaper -- but the
    # release it points at has to be the same one.
    model = metadata.get("model_version")
    if source_model and model and model != source_model:
        report(
            path,
            f"model_version {model!r} does not match the source {source_model!r}; every "
            f"language must track the same upstream model release",
        )

    # The intro prose links to the whitepaper, and model_url points at the same document.
    # They live in different places and are easy to update independently, so pin them
    # together here rather than discovering the mismatch in production.
    model_url = metadata.get("model_url")
    intro = metadata.get("intro") or ""
    intro_links = [
        html.unescape(href)
        for href in re.findall(r'href="([^"]+)"', intro)
        if WHITEPAPER_HOST in href
    ]

    if not intro_links:
        warn(path, "intro does not link to the maturity model whitepaper")
    elif model_url:
        for link in intro_links:
            if base_url(link) != base_url(model_url):
                report(
                    path,
                    f"intro links to {base_url(link)} but model_url points at "
                    f"{base_url(model_url)}",
                )

    return metadata


def check_parity(path, doc, source_structure, report):
    """Compare a translation against the English source, field by field."""
    found = structure(doc)

    source_ids = [c["id"] for c in source_structure]
    found_ids = [c["id"] for c in found]
    if source_ids != found_ids:
        report(path, f"category ids differ: expected {source_ids}, found {found_ids}")
        return

    for expected, actual in zip(source_structure, found):
        where = f"{path} [{expected['id']}]"

        if expected["order"] != actual["order"]:
            report(where, f"order differs: expected {expected['order']}, found {actual['order']}")

        expected_fields = [q["field_name"] for q in expected["questions"]]
        actual_fields = [q["field_name"] for q in actual["questions"]]
        if expected_fields != actual_fields:
            missing = [f for f in expected_fields if f not in actual_fields]
            extra = [f for f in actual_fields if f not in expected_fields]
            detail = []
            if missing:
                detail.append(f"missing {missing}")
            if extra:
                detail.append(f"unexpected {extra}")
            if not detail:
                detail.append(f"order differs: expected {expected_fields}, found {actual_fields}")
            report(where, "field_name mismatch: " + "; ".join(detail))
            continue

        for exp_q, act_q in zip(expected["questions"], actual["questions"]):
            if exp_q["id"] != act_q["id"]:
                report(
                    f"{where} {exp_q['field_name']}",
                    f"question id differs: expected {exp_q['id']}, found {act_q['id']}",
                )
            if exp_q["values"] != act_q["values"]:
                report(
                    f"{where} {exp_q['field_name']}",
                    f"option values differ: expected {exp_q['values']}, found {act_q['values']}",
                )


def git(*args):
    result = subprocess.run(
        ["git", *args], cwd=REPO_ROOT, capture_output=True, text=True, check=False
    )
    return result.stdout.strip() if result.returncode == 0 else None


def check_version_bump(base):
    """A change to the English question set must come with a content_version bump.

    Only questions-en.yaml is gated. It is the source of truth, so a translation-only
    fix does not redefine the question set and needs no bump -- the staleness warning
    below is what tracks translations catching up.
    """
    changed = git("diff", "--name-only", f"{base}...HEAD", "--", SOURCE_FILE)
    if changed is None:
        warn("version gate", f"could not diff against {base}; skipping bump check")
        return
    if not changed:
        return

    previous = git("show", f"{base}:{SOURCE_FILE}")
    if previous is None:
        return  # new file, nothing to compare against

    try:
        before = (yaml.safe_load(previous) or {}).get("metadata", {}).get("content_version")
    except yaml.YAMLError:
        return

    current = (load(SOURCE_FILE) or {}).get("metadata", {}).get("content_version")

    if before and before == current:
        error(
            SOURCE_FILE,
            f"content changed but content_version is still {current!r}. "
            f"Bump it per the rules in VERSIONING.md",
        )


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="git ref to diff against for the version-bump gate")
    args = parser.parse_args()

    source = load(SOURCE_FILE)
    if source is None:
        print(f"✗ {SOURCE_FILE} could not be read; cannot validate anything else")
        return 1

    source_structure = structure(source)
    source_version = (source.get("metadata") or {}).get("content_version")
    source_model = (source.get("metadata") or {}).get("model_version")

    published = sorted(
        p for p in glob.glob(os.path.join(REPO_ROOT, PUBLISHED_GLOB))
    )
    print(f"Source: {SOURCE_FILE} (content_version {source_version})")
    print(
        f"Question set: {len(source_structure)} categories, "
        f"{sum(len(c['questions']) for c in source_structure)} questions\n"
    )

    print("Published languages (blocking):")
    for path in published:
        rel = os.path.relpath(path, REPO_ROOT)
        doc = load(rel)
        if doc is None:
            continue

        metadata = check_metadata(rel, doc, error, source_model)
        if rel != SOURCE_FILE:
            check_parity(rel, doc, source_structure, error)

            version = metadata.get("content_version")
            if version and source_version and version != source_version:
                warn(
                    rel,
                    f"content_version {version} is behind the source {source_version}; "
                    f"translation may be out of date",
                )
        print(f"  - {rel} ({metadata.get('content_version', '?')})")

    print("\nQuarantined (report only, never blocks):")
    for path in sorted(glob.glob(os.path.join(REPO_ROOT, QUARANTINE_GLOB))):
        rel = os.path.relpath(path, REPO_ROOT)
        doc = load(rel)
        if doc is None:
            continue
        before = len(warnings)
        check_metadata(rel, doc, warn, source_model)
        check_parity(rel, doc, source_structure, warn)
        status = "not at parity" if len(warnings) > before else "at parity"
        print(f"  - {rel} ({(doc.get('metadata') or {}).get('content_version', '?')}) - {status}")

    if args.base:
        print(f"\nVersion gate: diffing {SOURCE_FILE} against {args.base}")
        check_version_bump(args.base)

    if warnings:
        print(f"\n⚠ {len(warnings)} warning(s):")
        for item in warnings:
            print(f"  ⚠ {item}")

    if errors:
        print(f"\n✗ {len(errors)} error(s):")
        for item in errors:
            print(f"  ✗ {item}")
        return 1

    print("\n✓ All blocking checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
