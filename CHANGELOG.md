# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This project tracks two version numbers, explained in [VERSIONING.md](VERSIONING.md): the **release version** below, applied as a git tag, and the **content version** of the assessment question set, recorded in `data/questions-*.yaml`. Each release notes the content version it ships.

## [Unreleased]

## [0.9.0] - 2026-08-06

First tagged release. Ships `content_version` **0.9.0**, tracking CNCF Platform Engineering Maturity Model **v1.0**.

### Added

- Version metadata (`content_version`, `model_version`, `model_url`) in every content file.
- Version stamp on shareable result URLs, so a link records which question set produced it.
- Detection of links built against an older question set.
- Page footer showing the assessment version and a link to the maturity model whitepaper.
- Content validation in CI.
- [VERSIONING.md](VERSIONING.md) describing the versioning scheme and release process.
- This changelog.

### Changed

- Whitepaper links point at the versioned `/v1/` URL, localised per language where available.
- Whitepaper links carry campaign parameters.

### Fixed

- Answers were lost when switching language after arriving from a URL that already contained them.
- Switching language reset the assessment to the first page.
- The browser back button did not step between assessment pages.
- `README.md` listed the wrong option scale and language set.

## Prior to 0.9.0

Unversioned changes are summarised here so the first release has a baseline.

- Assessment of 20 questions across five categories (Investment, Adoption, Interfaces, Operations, Measurement)
- All content moved out of hand-written HTML into per-language YAML files.
- Translations added for Chinese, Brazilian Portuguese and Japanese.
- Multi-page wizard flow, one category per page.
- Results shown as a spider chart, heat-map matrix and per-category scores.
- Assessment state held entirely in the URL, making results shareable.
- CNCF styling and branding applied to the assessment.
- Docker Compose development environment mirroring the GitHub Pages layout.
- Spanish and German translations were added, then quarantined as incomplete.
- An automatic language-discovery mechanism was added, then replaced by a fixed list of links.

[Unreleased]: https://github.com/Cloud-Native-Platform-Engineering/pemm-assessment/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/Cloud-Native-Platform-Engineering/pemm-assessment/releases/tag/v0.9.0
