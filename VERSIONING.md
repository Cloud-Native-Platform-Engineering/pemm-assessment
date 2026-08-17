# Versioning

This project tracks **two independent version numbers**. Knowing which one to change is usually the only thing you need from this document.

| Version | Where it lives | What it describes |
| --- | --- | --- |
| **Release version** | git tag, e.g. `v0.9.0`, plus [CHANGELOG.md](CHANGELOG.md) | The repository as a whole: application code, styling, docs, content |
| **Content version** | `metadata.content_version` in every `data/questions-*.yaml` | The assessment question set itself |

They are allowed to differ, and usually will.

## Why the content is versioned separately

Answers are serialized straight into the URL:

```text
?investment_1=1&adoption_2=2&interfaces_3=3&v=0.9.0
```

Those `field_name` keys and their `1` to `4` values are a **public contract**. The README encourages people to share these links, and they turn up in screenshots, blog posts and conference slides.

If a question is renamed, removed, or renumbered, every previously shared link silently starts meaning something different. No error, no warning; the same URL just produces a different result. That is a compatibility surface the application code does not have: a fix to the spider chart cannot invalidate anyone's saved link, but adding one question can.

So the question set gets a version of its own, stamped into every shared link as `v`, and the app compares that stamp against the version it is running.

## When to bump `content_version`

The tiers are defined by what happens to links that were shared before the change.

| Bump | Change | Effect on existing shared links |
| --- | --- | --- |
| **MAJOR** | Remove or rename a `field_name`; change the option `value` scale; add or remove a category | Old links now mean something **different**, and are actively misleading |
| **MINOR** | Add a question with a new `field_name`, adjust scoring | Old links remain valid but **incomplete** |
| **PATCH** | Reword a question, option, or description; fix a typo, translation, or link | Old links remain **fully valid** |

`data/questions-en.yaml` is the source of truth. Bump it there first, then bring the translations up to the same number as they are updated.

## `model_version` and `model_url`

`model_version` records which release of the upstream [CNCF Platform Engineering Maturity Model](https://cloudnativeplatforms.com/whitepapers/platform-eng-maturity-model/) the questions are derived from. `model_url` is the link to exactly that version.

They sit next to each other deliberately. The whitepaper URL also appears inside the translated `intro` prose, and CI checks that both point at the same document. Otherwise it is easy to bump `model_version` to `2.0` while the intro quietly keeps sending readers to v1.

### Linking a translated maturity model

The maturity model and whitepapers are published in several languages. A translation **should** point at its own locale rather than the English original. For example, a reader working through the assessment in Japanese is better served by the Japanese source material.

```yaml
# data/questions-ja.yaml
model_version: "1.0"
model_url: "https://cloudnativeplatforms.com/ja/whitepapers/platform-eng-maturity-model/v1/?..."
```

Two rules apply:

- `model_version` **must** be identical across every language. They all describe the same upstream release, and CI blocks a mismatch.
- `model_url` **may** differ per language, but must point at the same release, and must agree with the whitepaper link inside that file's own `intro`.

**Use the locale whenever it exists, even if that page is not translated yet.** The whitepaper site handles this itself: a locale that exists but has no translation for a given page renders a "Translation Needed" banner above the English text, with a link explaining how to contribute. Linking it keeps the reader in their own language context, tells them the truth, and starts serving the translation automatically the moment one lands, with no change needed here.

So the test is whether the **locale** exists, not whether that particular page has been translated:

```sh
curl -o /dev/null -w '%{http_code}\n' -L \
  https://cloudnativeplatforms.com/<lang>/whitepapers/platform-eng-maturity-model/v1/
```

`200` means use it. `404` means the locale does not exist at all, so use the English URL. Portuguese is currently in this position.

## Translations

Every language file carries the same `content_version` as `data/questions-en.yaml` once it is in sync. A file still showing an older number is, by definition, behind. CI reports this as a warning rather than an error, because a lagging translation is acceptable while a broken one is not.

What is **not** optional is structural parity. Every published language must have identical category ids and order, question ids, `field_name` values, and option values. A translation that renames a field breaks scoring and shared links for everyone using that language. CI blocks on this.

Files under `data/quarantine/` are excluded from publication and never block CI. A file lives there when it is incomplete or unreviewed. To bring one out: reach full structural parity, set its `content_version` to match the source, and move it into `data/`.

## Cutting a release

`main` is protected and requires pull requests, so releases are never tagged from a local branch.

1. Branch, and make the change.
2. Bump `content_version` if the question set changed. Add a `CHANGELOG.md` entry under `## [Unreleased]`.
3. Open a pull request. The `validate-content` check must pass.
4. Merge.
5. Move the `## [Unreleased]` entries under a new version heading with the date.
6. Tag the merge commit on `main` (`git tag v0.9.1`) and publish a GitHub Release pointing at that entry.

There is no build step and no artifact (GitHub Pages serves `main` directly), so a tag is a marker of a known-good state rather than something that produces a deliverable.

## What CI enforces

`.github/workflows/validate-content.yml` runs `scripts/validate_content.py` on every pull request. Run it locally the same way:

```sh
python3 scripts/validate_content.py                    # structural checks
python3 scripts/validate_content.py --base origin/main # also the version-bump gate
```

**Blocking:** files parse as YAML; every published language is at structural parity with the source; `content_version`, `model_version` and `model_url` are present and well formed; the intro whitepaper link agrees with `model_url`; and `data/questions-en.yaml` cannot change without its `content_version` changing too.

**Warning only:** a translation behind the source version, and anything wrong in `data/quarantine/`.
