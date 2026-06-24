# Homepage Experience Polish Design

**Date**: 2026-06-24
**Status**: Approved for Spec Kit specification
**Feature**: Homepage brand, carousel, contact, and Hong Kong Traditional Chinese copy polish

## Context

The BusIsCommingWebsite homepage already has a first-screen feature carousel, real sanitized app screenshots, tri-lingual content, download entry, online query entry, and footer contact area. The current carousel still visually reads as a large image with small stacked thumbnails at the bottom, which does not match the desired polished interaction. The header/footer brand mark also uses a generic line icon instead of the Android app's real logo.

Product facts remain sourced from the Android project:

- `/Users/jianglijie/AndroidStudioProjects/BusIsComming/AGENTS.md`
- `/Users/jianglijie/AndroidStudioProjects/BusIsComming/README.md`
- Android icon source: `/Users/jianglijie/AndroidStudioProjects/BusIsComming/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png`

Public wording references for Hong Kong Traditional Chinese tone include Citybus, HKeMobility, Transport Department, and GovHK transport pages. These are copywriting references only, not App capability sources.

## Chosen Approach

Use a focused experience specification rather than a narrow patch or full homepage redesign.

This keeps the work scoped to:

- First-screen carousel timing, gesture support, and screenshot presentation
- Header/footer contact wording and real email
- Real app logo usage
- Full-site user-visible copy review for `zh-Hant`, with synchronized `zh-Hans` and `en`
- Visual and automated verification guardrails

No service-side HTTP API changes are in scope.

## Carousel Design

The selected visual direction is a cinematic phone rail:

- Auto-advance every 3 seconds.
- Auto-advance moves between the 4 feature pages: saved routes, route comparison, arrival time / route detail, and pre-departure monitoring.
- The visual focus is one main phone screenshot.
- Adjacent screenshots may appear only as low-emphasis, cropped side previews to imply swipeability.
- Multiple screenshots within the same feature are viewed through horizontal swipe or drag, not through thumbnail buttons.
- No `01`, `02`, `03`, `04` display text.
- No persistent left/right arrows.
- Touch swipe is required on mobile; mouse or trackpad drag is required on desktop.
- Hover, focus, drag, and touch interaction pause automatic advance.
- Reduced motion preference reduces or stops automatic motion while preserving manual access.

Explicitly forbidden shapes:

- Bottom thumbnail stack
- Filmstrip
- Thumbnail button group
- Vertical or card-like screenshot pile
- Traditional arrow-driven carousel
- Numeric slide labels as visual decoration

Visual acceptance must include desktop 1440px and mobile 390px screenshots proving that the bottom thumbnail stack is absent.

## Copy Design

All user-visible text is in scope: navigation, hero, carousel, features, online query, download area, FAQ, footer, buttons, status messages, errors, image alt text, and accessibility labels.

`zh-Hant` must be rewritten as Hong Kong practical written Chinese:

- Clear, natural, product-like, and trustworthy
- Not a direct conversion from Simplified Chinese
- Close to Hong Kong transport product vocabulary such as `抵站時間`, `行程時間`, `交通費用`, `一按查詢`, and `聯絡我們`
- Not overly colloquial or overly government-like

`zh-Hans` and `en` keep the same product facts and feature scope but use natural Simplified Chinese and English expressions.

## Logo And Contact

The website logo uses the Android app's real foreground launcher artwork. The exported website asset must show only the central bus character on a transparent background; the launcher background plate is not used.

Navigation and footer contact copy changes:

- `支援我們 / 支持我们 / Support` becomes `聯絡我們 / 联系我们 / Contact Us`
- Footer email becomes `hezhenyu966@gmail.com`
- Footer `mailto:` target uses the same address
- Placeholder `feedback@busiscoming.local` must disappear from user-visible UI

## Verification Design

The implementation plan must require:

- Tri-lingual content completeness checks
- `zh-Hant` review evidence
- Carousel timer, pause, gesture, and no-thumbnail behavior checks
- Desktop and mobile visual screenshots
- Logo source traceability and transparent-background crop check
- Contact email and navigation copy checks
- Confirmation that no service-side HTTP API changed

## Open Questions

None. The user approved the selected approach and section designs on 2026-06-24.
