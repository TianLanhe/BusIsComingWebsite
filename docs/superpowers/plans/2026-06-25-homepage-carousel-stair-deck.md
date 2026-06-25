# Homepage Carousel Stair Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [X]`) syntax for tracking.

**Goal:** Replace the current faint side-rail screenshot preview with the approved bottom-aligned low-rotation stair deck interaction.

**Architecture:** Keep `AppPreviewCarousel` as the scene-level carousel controller and `ScreenshotStack` as the same-scene screenshot deck renderer. Scene changes remain automatic, dot-driven, keyboard-accessible, and drag/swipe-driven; same-scene image changes happen only through clicking/focusing deck image buttons.

**Tech Stack:** React 18, TypeScript, CSS Modules, Vitest + Testing Library, Playwright, existing Vite asset imports.

---

### Task 1: Unit Test the New Interaction Contract

**Files:**
- Modify: `frontend/src/tests/feature-gallery.test.tsx`
- Modify: `frontend/src/tests/hero-carousel.test.tsx`

- [X] **Step 1: Replace the old drag-to-image test with deck click behavior**

Use this behavior in `feature-gallery.test.tsx`: render `AppPreviewCarousel`, assert `data-visual-mode="stair-card-deck"`, assert back cards are visible and exposed same-scene hit areas are real buttons, click the second same-scene image button, and assert the active image changes without changing the active scene.

```tsx
expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-1");
expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-visual-mode", "stair-card-deck");
expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");

fireEvent.click(screen.getByRole("button", { name: "Show same-scene screenshot 2" }));

expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-2");
expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
```

- [X] **Step 2: Add a test that drag/swipe changes scenes, not same-scene images**

In `feature-gallery.test.tsx`, dispatch pointer down/up on `feature-showcase`, then assert the active scene changes to `route-comparison` and the previous scene's image stays remembered after returning.

```tsx
fireEvent.click(screen.getByRole("button", { name: "Show same-scene screenshot 2" }));
fireEvent(screen.getByTestId("feature-showcase"), dragEvent("pointerdown", 240));
fireEvent(screen.getByTestId("feature-showcase"), dragEvent("pointerup", 120));
expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "route-comparison");

fireEvent.keyDown(screen.getByTestId("feature-showcase"), { key: "ArrowLeft" });
expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "favorite-citybus-routes");
expect(screen.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-2");
```

- [X] **Step 3: Add clickable scene dots coverage**

In `hero-carousel.test.tsx`, assert the dots are buttons and clicking the ETA scene dot switches to `eta-details`.

```tsx
fireEvent.click(screen.getByRole("button", { name: "Feature Multiple ETAs and route details" }));
expect(screen.getByTestId("active-slide")).toHaveAttribute("data-slide-id", "eta-details");
```

- [X] **Step 4: Run tests and verify RED**

Run: `npm --prefix frontend run test -- feature-gallery hero-carousel`

Expected: FAIL because `ScreenshotStack` still exposes `cinematic-phone-rail`, back cards are not buttons, and scene dots are spans.

### Task 2: Implement Scene-Level Navigation and Deck Image Selection

**Files:**
- Modify: `frontend/src/components/hero/AppPreviewCarousel.tsx`
- Modify: `frontend/src/components/hero/ScreenshotStack.tsx`
- Modify: `frontend/src/content/carouselSlides.ts`

- [X] **Step 1: Stop drag/swipe from changing same-scene images**

Remove `moveGalleryImage()` and make `navigateDrag()` call only `moveFeature(direction)`.

```tsx
function navigateDrag(direction: 1 | -1) {
  setIsPaused(true);
  moveFeature(direction);
}
```

- [X] **Step 2: Pass an image select handler into `ScreenshotStack`**

Add this function in `AppPreviewCarousel` and pass it to the child.

```tsx
function selectGalleryImage(imageId: string) {
  setIsPaused(true);
  setActiveImages((current) => ({ ...current, [activeSlide.id]: imageId }));
}
```

- [X] **Step 3: Make scene dots clickable buttons**

Replace each dot `span` with a `button type="button"` that calls `setActiveIndex(index)` and pauses autoplay.

```tsx
<button
  type="button"
  key={slide.id}
  className={index === activeIndex ? styles.activeDot : styles.dot}
  aria-label={`${text(uiCopy.slideLabelPrefix)} ${text(slide.title)}`}
  aria-current={index === activeIndex}
  onClick={() => {
    setIsPaused(true);
    setActiveIndex(index);
  }}
/>
```

- [X] **Step 4: Render same-scene screenshots as deck cards with exposed hit buttons**

In `ScreenshotStack`, sort images so the active image renders visually as the main card, with up to two inactive images behind it. Each inactive image must have an exposed transparent button aligned with its visible edge, with a localized `Show same-scene screenshot N` aria label and `onSelectImage(image.id)`.

```tsx
interface ScreenshotStackProps {
  gallery: ScreenshotGallery;
  activeImageId: string;
  onSelectImage: (imageId: string) => void;
}
```

- [X] **Step 5: Set the gallery visual mode to `stair-card-deck`**

Update the content model for feature galleries so the rendered rail exposes `data-visual-mode="stair-card-deck"`.

- [X] **Step 6: Run tests and verify GREEN**

Run: `npm --prefix frontend run test -- feature-gallery hero-carousel`

Expected: PASS.

### Task 3: Implement Bottom-Aligned Stair Deck Styling

**Files:**
- Modify: `frontend/src/components/hero/ScreenshotStack.module.css`
- Modify: `frontend/src/components/hero/AppPreviewCarousel.module.css`

- [X] **Step 1: Replace side rail styling with the approved deck**

Use the approved prototype as the CSS source of truth:

```css
.rail {
  position: relative;
  display: grid;
  place-items: center;
  width: min(100%, 390px);
  min-width: 0;
  min-height: 540px;
}

.card {
  position: absolute;
  left: 50%;
  width: min(100%, 236px);
  aspect-ratio: 9 / 18;
  transform-origin: 50% 100%;
}

.main {
  z-index: 5;
  bottom: 68px;
  opacity: 1;
  transform: translateX(-50%) scale(1) rotate(0deg);
}

.backLeft {
  z-index: 3;
  bottom: 82px;
  opacity: 0.78;
  transform: translateX(calc(-50% - 44px)) scale(0.92) rotate(-5deg);
}

.backRight {
  z-index: 2;
  bottom: 84px;
  opacity: 0.70;
  transform: translateX(calc(-50% + 50px)) scale(0.86) rotate(5deg);
}
```

- [X] **Step 2: Add hover/focus styles for back cards**

Back cards must become clearer on hover/focus without showing visible arrows or thumbnails.

- [X] **Step 3: Add mobile rules**

At `max-width: 520px`, reduce width and rotate to `4deg`, with enough visible back-card hit area.

- [X] **Step 4: Run build**

Run: `npm --prefix frontend run build`

Expected: PASS.

### Task 4: Browser Regression and Visual Evidence

**Files:**
- Modify: `frontend/playwright/hero-carousel.spec.ts`
- Modify: `frontend/playwright/homepage-experience-polish.spec.ts`
- Modify: `specs/005-homepage-experience-polish/visual-review/README.md`

- [X] **Step 1: Update Playwright expectations**

Update browser tests to assert:

```ts
await expect(page.getByTestId("screenshot-rail")).toHaveAttribute("data-visual-mode", "stair-card-deck");
await page.locator('button[data-image-id="favorite-citybus-routes-2"]').click();
await expect(page.getByTestId("screenshot-rail")).toHaveAttribute("data-active-image-id", "favorite-citybus-routes-2");
```

- [X] **Step 2: Assert bottom alignment**

Use bounding boxes for the main card and back cards. Expected: each back card bottom is not greater than main card bottom plus 2px.

- [X] **Step 3: Regenerate visual screenshots**

Run: `npm --prefix frontend run test:e2e -- hero-carousel.spec.ts homepage-experience-polish.spec.ts homepage-hero.spec.ts homepage-sections.spec.ts`

Expected: PASS and refreshed images in `specs/005-homepage-experience-polish/visual-review/`.

- [X] **Step 4: Update visual-review README**

Record that the deck prototype is the visual standard and note the new stair deck screenshots.

### Task 5: Final Verification and Commit

**Files:**
- Modify: implementation and tests from previous tasks

- [X] **Step 1: Run complete test suite**

Run: `npm --prefix frontend run test`

Expected: PASS.

- [X] **Step 2: Run production build**

Run: `npm --prefix frontend run build`

Expected: PASS.

- [X] **Step 3: Run Playwright coverage**

Run: `npm --prefix frontend run test:e2e -- hero-carousel.spec.ts homepage-hero.spec.ts homepage-sections.spec.ts homepage-experience-polish.spec.ts`

Expected: PASS.

- [X] **Step 4: Check docs and worktree**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only planned files modified.

- [X] **Step 5: Commit**

```bash
git add frontend/src/components/hero frontend/src/content frontend/src/tests frontend/playwright specs/005-homepage-experience-polish/visual-review docs/superpowers/plans/2026-06-25-homepage-carousel-stair-deck.md
git commit -m "feat: implement carousel stair deck interaction"
```

## Self-Review

- Spec coverage: all approved deck requirements map to Tasks 1-4, including scene-only navigation, dot scene switching, same-scene image click switching, bottom alignment, desktop/mobile rotation, and visual evidence.
- Placeholder scan: no TODO/TBD placeholders are present.
- Type consistency: `ScreenshotStack` receives `onSelectImage(imageId: string)`, tests refer to `data-testid="screenshot-rail"` and `data-visual-mode="stair-card-deck"` consistently.
