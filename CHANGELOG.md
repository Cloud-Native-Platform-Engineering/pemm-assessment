# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This project tracks two version numbers, explained in [VERSIONING.md](VERSIONING.md): the **release version** below, applied as a git tag, and the **content version** of the assessment question set, recorded in `data/questions-*.yaml`. Each release notes the content version it ships.

## [Unreleased]

## [0.9.0] - 2026-08-06

Ships `content_version` **0.9.0**, tracking CNCF Platform Engineering Maturity Model **v1.0**.

First tagged release. The assessment has been publicly available since July 2025; this release introduces version tracking rather than new functionality, so that future changes to the question set are visible and shareable links can be traced back to the content that produced them.

### Added

- `content_version` and `model_version` metadata in every content file, plus `model_url` linking to the exact upstream whitepaper release. Each translation points at its own locale of the whitepaper where that locale exists — Japanese, Chinese, Spanish and German do. Portuguese has no locale and uses the English original.
- A version stamp (`v`) on shareable result URLs, so a shared link records which question set produced it. Bare visits are left unstamped.
- Detection of stale shared links. A link built against an older question set is reported to the browser console; the user-facing notice follows in a later release. Answers are never discarded.
- A page footer showing the assessment version and linking to the maturity model whitepaper it is based on.
- `scripts/validate_content.py` and the `validate-content` GitHub Actions workflow — the repository's first CI. Blocks on structural drift between languages, malformed or missing version metadata, a mismatch between the intro link and `model_url`, and any change to the English question set that does not bump `content_version`.
- [VERSIONING.md](VERSIONING.md) documenting the two-track scheme, the bump rules, and the release process.
- This changelog.

### Changed

- Whitepaper links now point at the versioned `/v1/` URL rather than the unversioned canonical URL, so readers see the edition the questions were written against.
- Whitepaper links carry campaign parameters, distinguishing the intro link from the footer link.
- `loadStateFromURL()` now recognises a defined set of reserved query parameters instead of excluding `lang` and `view` individually — previously any unrecognised parameter was treated as an answer.

### Fixed

- `README.md` listed the option scale as 1-5 (it is 1-4) and described Spanish as an available translation, when the live set is English, Japanese, Brazilian Portuguese and Chinese.

### Known issues

The Japanese footer strings (`version_label`, `model_version_label`, `version_mismatch_notice`) were written as part of this release rather than by the translation's author, and would benefit from a native-speaker review.

`.github/instructions/instructions.md` is substantially out of date — it documents a dynamic language-discovery system, a language `<select>` dropdown, and five functions that are not present in `assets/app.js`. It is left untouched by this release and tracked separately.

Tracked for the `0.9.1` content patch:

- The English intro reads `nd Measurement` instead of `and Measurement`.
- The Chinese intro ends mid-sentence, with an unclosed tag and no feedback link.
- The Chinese translation has no `page_indicator_text`, so pagination falls back to English.

Not scheduled:

- `data/quarantine/questions-es.yaml` is missing the fourth question of every category (15 of 20) and has a truncated intro. It is excluded from publication until it reaches parity.
- `data/quarantine/questions-de.yaml` is at full structural parity but has not been reviewed for publication.

## Prior to 0.9.0

The assessment was developed between July 2025 and July 2026 across 84 commits and 9 merged pull requests, without tagged releases. This section summarises that work so the first release has a baseline to build on. It is grouped by theme rather than replayed commit by commit.

### Assessment content and scoring model

- Initial assessment tool (Jul 2025): 20 questions across five categories — Investment, Adoption, Interfaces, Operations, Measurement — each with four maturity levels.
- Category score defined as the mean of answered questions in that category, rounded to two decimal places (#1, Aug 2025).
- Question wording refinements: the Investment "who builds your platform" options widened to "team or group", and Adoption tool-selection gained a "compulsory platform" reading (#4, Sep 2025).
- Title settled on "Platform Engineering Maturity Model Assessment", and the intro grew into an explainer of platform engineering and the five aspects.
- All content — categories, questions, options, and every UI string — moved out of hand-written HTML into per-language YAML files under `data/` (#11, Sep–Oct 2025), making content edits and translation independent of markup.

### Internationalization and translations

- Chinese contributed as the first non-English language (#3, Sep 2025), initially as a separate `zh/index.html` page, together with the first language switcher.
- Translation architecture reworked to a single `index.html` plus one `data/questions-<lang>.yaml` per language; the per-language HTML folders were deleted (#11, #13, Oct 2025).
- Brazilian Portuguese translation added (#13, #16, Oct 2025), first as a separate page and then converted to the YAML pattern.
- Japanese translation added (#18, Aug 2026), merged shortly before this release and brought up to the versioning conventions as part of it.
- UI chrome made translatable through YAML `metadata` keys bound to `data-text` attributes: buttons, the page indicator, clipboard messages, and the feedback text.
- Language links carry the current answer state, and from Oct 2025 keep you on the results view and re-render results in the newly selected language (#16).

### User interface and navigation

- Feedback affordances on the results panel: a "Share Feedback" link beside "Copy Shareable Link", plus a thank-you message block (#8, Sep 2025).
- Multi-page wizard flow: one category per page with Previous / Next / Submit controls, a page indicator, and answers preserved between pages (#11, Sep–Oct 2025).
- "Back to Assessment" control on the results view, and scroll-to-top on page change and submit.
- Semantic HTML pass replacing generic `div`s with `main` / `article` / `header` / `nav`.

### Results and visualization

- Results present from the first commit: a canvas spider chart, a per-level heat-map matrix, and a per-category score list.
- Layout moved from a two-column form-plus-sidebar grid to a single column with results below the form; results were later hidden until Submit as part of the wizard work.
- Spider chart given two-line wrapping for long category labels, so longer translations stay legible (#13, Oct 2025).
- Results view made addressable through a `view=results` parameter, so it can be shared directly and survives a language switch.

### URL state and sharing

- Answers encoded in the query string from the first commit, with a "Copy Shareable Link" button.
- Share-link fix so links capture answers from every page of the wizard, not only the page on screen (Sep 2025).
- `localStorage` persistence was introduced alongside pagination and then deliberately removed in favour of URL-only state (Oct 2025), leaving the URL as the single source of truth for answers, language, and view.

### Styling

- A CSS custom-property system was present from the start: colours, spacing scale, radii, font sizes, and the heat-map colour ramp.
- CNCF restyle (Oct 2025): CNCF palette, Clarity City font stack, and a flat light background replacing the original gradient.
- Migration to CSS logical properties (`margin-block-end`, `padding-block-end`).

### Developer experience and tooling

- Docker Compose and nginx local development environment mirroring the GitHub Pages path layout, documented in `README-docker.md` (#11, Sep 2025).
- Repository layout tidied: CSS and JS moved into `assets/`, and asset paths changed from absolute to relative so the app works at any base path.
- A substantial `app.js` refactor (Oct 2025) roughly halved the file.
- GitHub issue templates for bug reports and feature requests (Aug 2025).
- No test suite, build step, or CI existed before 0.9.0. The only runtime dependency is `js-yaml`, loaded from a CDN.

### Added and later withdrawn

Present in the history but deliberately **not** part of the shipped baseline:

- **Spanish** — added Sep 2025, removed from the language navigation in Oct 2025 because the file did not contain the full question set, and moved to `data/quarantine/`. A Spanish-speaking contributor is still wanted.
- **German** — added Oct 2025 as an explicit experiment in adding a language, never listed in the navigation, and moved to `data/quarantine/` as incomplete.
- **Automatic language discovery** — a dropdown probing ~70 language codes was added in Oct 2025 and replaced three days later by a hardcoded list of links in `index.html`.
- **Per-language HTML pages** and **nginx language redirects** — both removed during the YAML refactor in Oct 2025.

### Contributors

Steve Fenton, Corey McGalliard, Chris (Gentle) Yang, Eduardo Munari, Stéphane Di Cesare, Colin Griffin, Genki Matsuda, and Atulpriya Sharma.

[Unreleased]: https://github.com/Cloud-Native-Platform-Engineering/pemm-assessment/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/Cloud-Native-Platform-Engineering/pemm-assessment/releases/tag/v0.9.0
