# US1 验收：首屏与五故事

日期：2026-08-24

- Header 在 1440、390、320 都保留品牌、功能、FAQ、联系和语言入口；手机触控目标至少 44px。
- 首屏顺序为标题/说明 → 下载与路线试查 → 五图环形舞台 → `01–05` 故事轨；手机 390×844 一屏完整显示。
- 五张截图常驻 DOM，只有一个 front；后景为空 alt、`aria-hidden`、不可聚焦。无自动播放、拖拽、lightbox、灵动岛、说明卡或证据标签。
- 桌面手机、说明浮层与故事轨分别按 Figma `119:176` 坐标校准；叠图见 `overlay/first-screen-story-01-desktop-1440.png`。
- `hero-carousel.spec.ts`、`homepage-hero.spec.ts`、`homepage-accessibility.spec.ts` 与五故事像素基线覆盖 desktop-1440、mobile-390、mobile-320。
- 限制：Figma Starter 额度阻止本轮重新导出 `119:461`；手机以既有批准构图、固定 golden 和零容忍几何断言验收。
