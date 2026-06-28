# Homepage UI Polish Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修正首页截图大图查看、路线比较/车费文案分工，以及路线查询结果卡片长站名换行问题。

**Architecture:** 沿用现有 React + CSS Modules 组件结构。`ScreenshotLightbox` 继续由 hero 轮播持有状态，但视觉改为图片优先浮层；内容改动集中在 `content/*`；路线卡截断只调整 `RouteCard` 结构属性和 CSS。

**Tech Stack:** React 18、TypeScript、CSS Modules、Vitest、Playwright、Redocly OpenAPI lint。

---

## File Structure

- Modify `frontend/src/components/hero/ScreenshotLightbox.tsx`: 去掉工具栏按钮式 UI，保留极简关闭按钮、页码、键盘关闭/左右切图、滚轮缩放和拖动平移。
- Modify `frontend/src/components/hero/ScreenshotLightbox.module.css`: 改为暗色遮罩中的圆角截图浮层，隐藏 toolbar/dialog 观感。
- Modify `frontend/src/content/carouselSlides.ts`: 第二个 hero 功能展示模块改为“路线比较”主题。
- Modify `frontend/src/content/homepageContent.ts`: hero 第二 bullet 和 `homepageUiPolish.fareCopy` 同步新文案。
- Modify `frontend/src/content/sectionsContent.ts`: 中间第 6 项“车费一眼看清”说明改为“候选路线直接显示车费”。
- Modify `frontend/src/components/online-demo/OnlineQueryDemo.tsx`: 给起点/终点站名添加 `title` 和稳定测试属性。
- Modify `frontend/src/components/online-demo/OnlineQueryDemo.module.css`: 站点名单行截断，禁止换成两行。
- Modify tests under `frontend/src/tests/` and `frontend/playwright/`: 更新文案断言、lightbox 极简 UI 断言和路线卡截断断言。

---

### Task 1: Update Content Copy

**Files:**
- Modify: `frontend/src/content/carouselSlides.ts`
- Modify: `frontend/src/content/homepageContent.ts`
- Modify: `frontend/src/content/sectionsContent.ts`
- Test: `frontend/src/tests/hero-content.test.ts`
- Test: `frontend/src/tests/sections-content.test.ts`
- Test: `frontend/src/tests/i18n-completeness.test.tsx`

- [ ] **Step 1: Write failing content assertions**

Update tests to expect route-comparison copy:

```ts
expect(fareSlide?.title["zh-Hant"]).toBe("路線比較更清楚");
expect(fareSlide?.title["zh-Hans"]).toBe("路线比较更清楚");
expect(fareSlide?.title.en).toBe("Clearer route comparison");
expect(fareSlide?.description["zh-Hans"]).toBe("同页查看候选城巴路线的车费、行程时间和步行距离，选择路线前先比较清楚。");
```

Update fare feature tests:

```ts
expect(fareFeature?.description["zh-Hant"]).toBe("每條候選路線直接顯示車費，毋須點入詳情才知道大約花費。");
expect(fareFeature?.description["zh-Hans"]).toBe("每条候选路线直接显示车费，不用点进详情才知道大致花费。");
expect(fareFeature?.description.en).toBe("See the fare on each route option without opening details first.");
```

- [ ] **Step 2: Run failing tests**

Run:

```bash
cd frontend
npm run test -- --run src/tests/hero-content.test.ts src/tests/sections-content.test.ts src/tests/i18n-completeness.test.tsx
```

Expected: FAIL because current copy still uses `车费一眼看清` for the hero route-comparison slide and overlapping fare descriptions.

- [ ] **Step 3: Implement content copy**

Set `carouselSlides.ts` route-comparison:

```ts
title: {
  "zh-Hant": "路線比較更清楚",
  "zh-Hans": "路线比较更清楚",
  en: "Clearer route comparison",
},
description: {
  "zh-Hant": "同頁查看候選城巴路線的車費、行程時間和步行距離，揀路線前先比較清楚。",
  "zh-Hans": "同页查看候选城巴路线的车费、行程时间和步行距离，选择路线前先比较清楚。",
  en: "Compare candidate Citybus routes by fare, journey time, and walking distance before choosing.",
},
```

Set `sectionsContent.ts` `hkd-display.description`:

```ts
description: {
  "zh-Hant": "每條候選路線直接顯示車費，毋須點入詳情才知道大約花費。",
  "zh-Hans": "每条候选路线直接显示车费，不用点进详情才知道大致花费。",
  en: "See the fare on each route option without opening details first.",
},
```

Mirror matching hero bullet and `homepageUiPolish.fareCopy` values in `homepageContent.ts`.

- [ ] **Step 4: Verify content tests pass**

Run the same Vitest command. Expected: PASS.

---

### Task 2: Replace Toolbar Dialog With Minimal Image Overlay

**Files:**
- Modify: `frontend/src/components/hero/ScreenshotLightbox.tsx`
- Modify: `frontend/src/components/hero/ScreenshotLightbox.module.css`
- Test: `frontend/src/tests/feature-gallery.test.tsx`
- Test: `frontend/playwright/feature-gallery.spec.ts`

- [ ] **Step 1: Write failing lightbox tests**

Update unit expectations:

```ts
const overlay = screen.getByTestId("screenshot-lightbox");
expect(overlay).toHaveAttribute("data-ui-mode", "minimal-image-overlay");
expect(within(overlay).queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
expect(within(overlay).queryByRole("button", { name: "Zoom out" })).not.toBeInTheDocument();
expect(within(overlay).queryByRole("button", { name: "Reset zoom" })).not.toBeInTheDocument();
expect(screen.getByTestId("lightbox-page-indicator")).toHaveTextContent("1 / 2");
```

Update Playwright expectations:

```ts
await expect(page.getByTestId("screenshot-lightbox")).toHaveAttribute("data-ui-mode", "minimal-image-overlay");
await expect(page.getByRole("button", { name: "Zoom in" })).toHaveCount(0);
await expect(page.getByTestId("lightbox-page-indicator")).toContainText("1 / 2");
```

- [ ] **Step 2: Run failing lightbox tests**

Run:

```bash
cd frontend
npm run test -- --run src/tests/feature-gallery.test.tsx
```

Expected: FAIL because current lightbox renders toolbar buttons.

- [ ] **Step 3: Implement minimal overlay**

In `ScreenshotLightbox.tsx` keep state and handlers, but render:

```tsx
<div className={styles.backdrop} role="presentation" onMouseDown={handleBackdropClose}>
  <div
    ref={dialogRef}
    className={styles.overlay}
    role="dialog"
    aria-modal="true"
    aria-label={text(uiCopy.screenshotLightboxTitle)}
    data-testid="screenshot-lightbox"
    data-ui-mode="minimal-image-overlay"
    tabIndex={-1}
    onKeyDown={handleKeyDown}
  >
    <button type="button" className={styles.closeButton} onClick={onClose}>
      {text(uiCopy.closeLightbox)}
    </button>
    <div className={styles.viewport} data-zoomed={zoom > minZoom} onWheel={handleWheel} ...>
      <img ... />
    </div>
    {hasImageSwitching ? (
      <span className={styles.pageIndicator} data-testid="lightbox-page-indicator">
        {activeIndex + 1} / {orderedImages.length}
      </span>
    ) : null}
  </div>
</div>
```

Keep wheel zoom and pointer pan. Keep ArrowLeft/ArrowRight same-feature switching. Remove visible zoom/reset/prev/next buttons.

- [ ] **Step 4: Restyle overlay**

In CSS:

```css
.overlay {
  position: relative;
  display: grid;
  place-items: center;
  width: min(100%, 1040px);
  height: min(100%, 860px);
  background: transparent;
}

.viewport img {
  max-width: min(88vw, 430px);
  max-height: min(82vh, 760px);
  border-radius: 30px;
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.46);
}
```

- [ ] **Step 5: Verify lightbox tests pass**

Run:

```bash
cd frontend
npm run test -- --run src/tests/feature-gallery.test.tsx
```

Expected: PASS.

---

### Task 3: Truncate Long Route Stop Names

**Files:**
- Modify: `frontend/src/components/online-demo/OnlineQueryDemo.tsx`
- Modify: `frontend/src/components/online-demo/OnlineQueryDemo.module.css`
- Test: `frontend/src/tests/online-query-demo.test.tsx`
- Test: `frontend/playwright/online-query-demo.spec.ts`

- [ ] **Step 1: Write failing stop truncation tests**

In unit tests, return long stop names and assert stable attributes:

```ts
expect(screen.getByTestId("route-origin-stop")).toHaveTextContent("Very Long Origin Stop Name");
expect(screen.getByTestId("route-origin-stop")).toHaveAttribute("title", "Very Long Origin Stop Name");
expect(screen.getByTestId("route-destination-stop")).toHaveAttribute("title", "Very Long Destination Stop Name");
```

In Playwright, assert one-line geometry:

```ts
const originBox = await page.getByTestId("route-origin-stop").boundingBox();
const destinationBox = await page.getByTestId("route-destination-stop").boundingBox();
expect(originBox!.height).toBeLessThan(24);
expect(destinationBox!.height).toBeLessThan(24);
```

- [ ] **Step 2: Run failing route-card tests**

Run:

```bash
cd frontend
npm run test -- --run src/tests/online-query-demo.test.tsx
```

Expected: FAIL until test IDs and title attributes are added.

- [ ] **Step 3: Implement truncation structure**

Update `RouteCard`:

```tsx
<span className={styles.stopName} data-testid="route-origin-stop" title={route.boardingStop.name}>
  {route.boardingStop.name}
</span>
<span aria-hidden="true">→</span>
<span className={styles.stopName} data-testid="route-destination-stop" title={route.alightingStop.name}>
  {route.alightingStop.name}
</span>
```

Update CSS:

```css
.stopName {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

Remove `overflow-wrap: anywhere` from stop names.

- [ ] **Step 4: Verify route-card tests pass**

Run:

```bash
cd frontend
npm run test -- --run src/tests/online-query-demo.test.tsx
```

Expected: PASS.

---

### Task 4: Full Validation And Commit

**Files:**
- Update visual review screenshots under `specs/007-homepage-ui-polish/visual-review/`

- [ ] **Step 1: Run full unit tests**

```bash
cd frontend
npm run test
```

Expected: 10 test files pass.

- [ ] **Step 2: Run production build**

```bash
cd frontend
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 3: Run OpenAPI lint**

```bash
cd frontend
npm run openapi:lint && npm run openapi:routes:lint
```

Expected: both OpenAPI documents valid; no service API changed.

- [ ] **Step 4: Run targeted Playwright**

```bash
cd frontend
BUS_HTTP_HOST=127.0.0.1 FRONTEND_HOST=127.0.0.1 PLAYWRIGHT_HOST=127.0.0.1 PORT=18081 BACKEND_PORT=18081 FRONTEND_PORT=5185 npm run test:e2e -- playwright/hero-carousel.spec.ts playwright/feature-gallery.spec.ts playwright/homepage-sections.spec.ts playwright/online-query-demo.spec.ts
```

Expected: 8 Playwright tests pass and visual screenshots refresh.

- [ ] **Step 5: Check diff and commit**

```bash
git diff --check
git status --short
git add frontend/src frontend/playwright specs/007-homepage-ui-polish/visual-review docs/superpowers/plans/2026-06-28-homepage-ui-polish-corrections.md
git commit -m "fix: refine homepage polish corrections"
```

Expected: commit succeeds with only planned UI/content/test/visual evidence changes.

---

## Self-Review

- Spec coverage: Task 1 covers route-comparison and fare-copy wording; Task 2 covers desktop/mobile unified minimal image overlay; Task 3 covers long origin/destination truncation; Task 4 covers screenshots and validation.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: existing component names and test IDs match current code; new test IDs are `route-origin-stop`, `route-destination-stop`, and `lightbox-page-indicator`.
