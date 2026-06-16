const TARGET_FILE_KEY = "LAm6RjzFuFHsHFlcipx8pU";
const TARGET_FILE_URL = "https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec";
const PAGE_NAME = "Online Query v2";
const DESKTOP_FRAME_NAME = "Online Query v2 / Desktop 1440";
const MOBILE_FRAME_NAME = "Online Query v2 / Mobile 390";
const NOTE_FRAME_NAME = "Online Query v2 / Spec Notes";
let uiReady = false;
let currentStage = "startup";

const colors = {
  page: "#F6F8F6",
  surface: "#FFFFFF",
  surfaceSoft: "#F1F5F2",
  line: "#DDE4DF",
  lineStrong: "#C7D2CC",
  ink: "#15211D",
  muted: "#5C6862",
  faint: "#7D8983",
  brand: "#175247",
  brandSoft: "#DCEDE7",
  brandPale: "#EFF8F4",
  blue: "#315F86",
  blueSoft: "#E6F0F8",
  amber: "#9A6418",
  amberSoft: "#FFF2DA",
  red: "#8A2F24",
  redSoft: "#FBE6E2",
  shadow: "#000000"
};

let fonts = null;

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const int = parseInt(value, 16);
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255
  };
}

function solid(hex, opacity = 1) {
  return {
    type: "SOLID",
    color: hexToRgb(hex),
    opacity
  };
}

function shadow(opacity = 0.08, y = 18, radius = 36) {
  const shadowColor = hexToRgb(colors.shadow);
  return [{
    type: "DROP_SHADOW",
    color: { r: shadowColor.r, g: shadowColor.g, b: shadowColor.b, a: opacity },
    offset: { x: 0, y },
    radius,
    spread: -8,
    visible: true,
    blendMode: "NORMAL"
  }];
}

function autoFrame(name, width, direction = "VERTICAL", fill = colors.surface) {
  const node = figma.createFrame();
  node.name = name;
  node.resize(width, 100);
  node.layoutMode = direction;
  node.primaryAxisSizingMode = "AUTO";
  node.counterAxisSizingMode = "FIXED";
  node.fills = [solid(fill)];
  node.clipsContent = false;
  return node;
}

function fixedFrame(name, width, height, fill = colors.surface) {
  const node = figma.createFrame();
  node.name = name;
  node.resize(width, height);
  node.fills = [solid(fill)];
  node.clipsContent = false;
  return node;
}

function figmaAlign(value, fallback) {
  if (value === "START") return "MIN";
  if (value === "END") return "MAX";
  if (value === "BETWEEN") return "SPACE_BETWEEN";
  return value || fallback;
}

function configureAuto(node, options = {}) {
  node.layoutMode = options.direction || node.layoutMode || "VERTICAL";
  if (options.primary) node.primaryAxisSizingMode = options.primary;
  if (options.counter) node.counterAxisSizingMode = options.counter;
  node.primaryAxisAlignItems = figmaAlign(options.primaryAlign, "MIN");
  node.counterAxisAlignItems = figmaAlign(options.counterAlign, "MIN");
  node.itemSpacing = options.gap || 0;
  node.paddingTop = options.pt || options.p || 0;
  node.paddingRight = options.pr || options.p || 0;
  node.paddingBottom = options.pb || options.p || 0;
  node.paddingLeft = options.pl || options.p || 0;
}

function append(parent, child, sizing = {}) {
  parent.appendChild(child);
  if (sizing.horizontal) child.layoutSizingHorizontal = sizing.horizontal;
  if (sizing.vertical) child.layoutSizingVertical = sizing.vertical;
  if (sizing.grow !== undefined) child.layoutGrow = sizing.grow;
  if (sizing.align) child.layoutAlign = sizing.align;
  return child;
}

function stroke(node, color = colors.line, weight = 1) {
  node.strokes = [solid(color)];
  node.strokeWeight = weight;
}

function radius(node, value) {
  node.cornerRadius = value;
}

function pickFontStyle(styles, preferred) {
  for (const style of preferred) {
    if (styles.includes(style)) return style;
  }
  return styles[0] || "Regular";
}

async function setupFonts() {
  const available = await figma.listAvailableFontsAsync();
  const byFamily = new Map();
  for (const item of available) {
    if (!byFamily.has(item.fontName.family)) byFamily.set(item.fontName.family, []);
    byFamily.get(item.fontName.family).push(item.fontName.style);
  }

  const family =
    ["Inter", "PingFang SC", "Noto Sans SC", "Noto Sans CJK SC", "Source Han Sans SC", "Microsoft YaHei", "Arial"]
      .find((candidate) => byFamily.has(candidate)) ||
    (available[0] && available[0].fontName && available[0].fontName.family) ||
    "Inter";

  const styles = byFamily.get(family) || ["Regular"];
  fonts = {
    regular: { family, style: pickFontStyle(styles, ["Regular", "Book", "Normal"]) },
    medium: { family, style: pickFontStyle(styles, ["Medium", "Semi Bold", "Semibold", "Regular"]) },
    bold: { family, style: pickFontStyle(styles, ["Bold", "Semi Bold", "Semibold", "Medium", "Regular"]) }
  };

  const uniqueFonts = [fonts.regular, fonts.medium, fonts.bold]
    .filter((font, index, list) => list.findIndex((item) => item.family === font.family && item.style === font.style) === index);
  await Promise.all(uniqueFonts.map((font) => figma.loadFontAsync(font)));
}

function text(name, characters, size, lineHeight, color = colors.ink, fontName = fonts.regular) {
  const node = figma.createText();
  node.name = name;
  node.fontName = fontName;
  node.characters = characters;
  node.fontSize = size;
  node.lineHeight = { unit: "PIXELS", value: lineHeight };
  node.letterSpacing = { unit: "PERCENT", value: 0 };
  node.fills = [solid(color)];
  node.textAutoResize = "HEIGHT";
  return node;
}

function label(name, content) {
  return text(name, content, 13, 18, colors.faint, fonts.medium);
}

function chip(name, content, tone = "brand") {
  const palette = {
    brand: [colors.brandSoft, colors.brand],
    blue: [colors.blueSoft, colors.blue],
    amber: [colors.amberSoft, colors.amber],
    red: [colors.redSoft, colors.red]
  }[tone];
  const node = autoFrame(name, 10, "HORIZONTAL", palette[0]);
  configureAuto(node, { direction: "HORIZONTAL", p: 8, pt: 5, pb: 5, gap: 6, counterAlign: "CENTER" });
  node.counterAxisSizingMode = "AUTO";
  radius(node, 999);
  append(node, text(`${name} / Text`, content, 12, 16, palette[1], fonts.medium));
  return node;
}

function button(name, content, width, variant = "primary") {
  const node = autoFrame(name, width, "HORIZONTAL", variant === "primary" ? colors.brand : colors.surface);
  node.resize(width, 44);
  node.primaryAxisSizingMode = "FIXED";
  node.counterAxisSizingMode = "FIXED";
  configureAuto(node, { direction: "HORIZONTAL", p: 14, gap: 8, primaryAlign: "CENTER", counterAlign: "CENTER" });
  radius(node, 8);
  if (variant !== "primary") stroke(node, colors.lineStrong);
  append(node, text(`${name} / Label`, content, 15, 20, variant === "primary" ? colors.surface : colors.ink, fonts.medium));
  return node;
}

function inputField(name, labelText, value, width, state = "default") {
  const wrapper = autoFrame(name, width, "VERTICAL", colors.page);
  wrapper.fills = [];
  configureAuto(wrapper, { direction: "VERTICAL", gap: 8 });
  append(wrapper, label(`${name} / Label`, labelText), { horizontal: "FILL" });

  const field = autoFrame(`${name} / Field`, width, "HORIZONTAL", colors.surface);
  field.resize(width, 48);
  field.primaryAxisSizingMode = "FIXED";
  field.counterAxisSizingMode = "FIXED";
  configureAuto(field, { direction: "HORIZONTAL", pl: 14, pr: 12, pt: 12, pb: 12, gap: 10, counterAlign: "CENTER" });
  radius(field, 8);
  stroke(field, state === "active" ? colors.brand : colors.lineStrong, state === "active" ? 1.5 : 1);
  append(field, text(`${name} / Value`, value, 15, 22, value ? colors.ink : colors.faint), { horizontal: "FILL", grow: 1 });
  append(field, text(`${name} / Icon`, "⌄", 16, 20, colors.faint, fonts.medium));
  append(wrapper, field, { horizontal: "FILL" });
  return wrapper;
}

function candidateRow(name, primary, meta, selected = false) {
  const row = autoFrame(name, 100, "VERTICAL", selected ? colors.brandPale : colors.surface);
  configureAuto(row, { direction: "VERTICAL", pl: 12, pr: 12, pt: 9, pb: 9, gap: 2 });
  append(row, text(`${name} / Primary`, primary, 14, 19, colors.ink, fonts.medium), { horizontal: "FILL" });
  append(row, text(`${name} / Meta`, meta, 12, 16, colors.faint), { horizontal: "FILL" });
  return row;
}

function dropdown(name, width) {
  const node = autoFrame(name, width, "VERTICAL", colors.surface);
  configureAuto(node, { direction: "VERTICAL", p: 6, gap: 2 });
  radius(node, 8);
  stroke(node, colors.lineStrong);
  node.effects = shadow(0.12, 16, 32);
  append(node, candidateRow(`${name} / Candidate 1`, "兴华邨兴翠楼", "柴湾 · 约 80 米", true), { horizontal: "FILL" });
  append(node, candidateRow(`${name} / Candidate 2`, "兴华邨丰兴楼", "柴湾 · 约 130 米"), { horizontal: "FILL" });
  append(node, candidateRow(`${name} / Candidate 3`, "兴华商场", "柴湾道 · 约 180 米"), { horizontal: "FILL" });
  append(node, candidateRow(`${name} / Candidate 4`, "兴民邨", "柴湾 · 约 360 米"), { horizontal: "FILL" });
  append(node, text(`${name} / Scroll hint`, "最多返回 100 个地点，列表在此区域内滚动", 11, 15, colors.faint), { horizontal: "FILL" });
  return node;
}

function metric(name, content) {
  return text(name, content, 15, 22, colors.muted, fonts.regular);
}

function routeCard(name, route, stops, wait, meta, tone = "brand") {
  const node = autoFrame(name, 100, "VERTICAL", colors.surface);
  configureAuto(node, { direction: "VERTICAL", p: 18, gap: 14 });
  radius(node, 8);
  stroke(node, colors.line);

  const top = autoFrame(`${name} / Top`, 100, "HORIZONTAL", colors.surface);
  top.fills = [];
  configureAuto(top, { direction: "HORIZONTAL", gap: 18, counterAlign: "CENTER" });
  append(top, text(`${name} / Route`, route, 35, 40, colors.ink, fonts.medium), { horizontal: "FILL", grow: 1 });
  append(top, chip(`${name} / Wait`, wait, tone));
  append(node, top, { horizontal: "FILL" });

  append(node, text(`${name} / Stops`, stops, 18, 26, colors.muted, fonts.regular), { horizontal: "FILL" });
  const divider = fixedFrame(`${name} / Divider`, 100, 1, colors.line);
  append(node, divider, { horizontal: "FILL" });
  append(node, metric(`${name} / Meta`, meta), { horizontal: "FILL" });
  return node;
}

function skeleton(name, width) {
  const node = autoFrame(name, width, "VERTICAL", colors.surface);
  configureAuto(node, { direction: "VERTICAL", p: 18, gap: 12 });
  radius(node, 8);
  stroke(node, colors.line);
  for (const [index, rowWidth] of [160, 280, 420, 240].entries()) {
    const row = fixedFrame(`${name} / Skeleton ${index + 1}`, rowWidth, index === 0 ? 34 : 16, colors.surfaceSoft);
    radius(row, 999);
    append(node, row);
  }
  return node;
}

function statePanel(name, title, description, tone = "blue") {
  const node = autoFrame(name, 100, "VERTICAL", colors.surface);
  configureAuto(node, { direction: "VERTICAL", p: 16, gap: 10 });
  radius(node, 8);
  stroke(node, colors.line);
  append(node, chip(`${name} / State`, title, tone));
  append(node, text(`${name} / Description`, description, 13, 19, colors.muted), { horizontal: "FILL" });
  return node;
}

function buildDesktop() {
  const root = autoFrame(DESKTOP_FRAME_NAME, 1440, "VERTICAL", colors.page);
  configureAuto(root, { direction: "VERTICAL", pl: 92, pr: 92, pt: 76, pb: 76, gap: 36, counterAlign: "CENTER" });

  const titleRow = autoFrame("Desktop / Header", 1256, "HORIZONTAL", colors.page);
  titleRow.fills = [];
  configureAuto(titleRow, { direction: "HORIZONTAL", gap: 24, counterAlign: "END" });
  const titleCopy = autoFrame("Desktop / Header Copy", 730, "VERTICAL", colors.page);
  titleCopy.fills = [];
  configureAuto(titleCopy, { direction: "VERTICAL", gap: 10 });
  append(titleCopy, chip("Desktop / Eyebrow", "网页试用 · 香港巴士查询", "brand"));
  append(titleCopy, text("Desktop / Title", "选择起点和终点，查看真实巴士路线", 36, 44, colors.ink, fonts.bold), { horizontal: "FILL" });
  append(titleCopy, text("Desktop / Subtitle", "网页提供基础查询体验；保存路线、监控、多班 ETA 和更多详情请继续使用 App。", 17, 26, colors.muted), { horizontal: "FILL" });
  append(titleRow, titleCopy, { grow: 1 });
  append(titleRow, chip("Desktop / Scope", "仅香港巴士 · 不含港铁/渡轮", "blue"));
  append(root, titleRow, { horizontal: "FILL" });

  const section = autoFrame("Desktop / Online Query Section", 1256, "HORIZONTAL", colors.page);
  section.fills = [];
  configureAuto(section, { direction: "HORIZONTAL", gap: 44, counterAlign: "MIN" });

  const left = autoFrame("Desktop / Left Explanation", 430, "VERTICAL", colors.surface);
  configureAuto(left, { direction: "VERTICAL", p: 28, gap: 22 });
  radius(left, 8);
  stroke(left, colors.line);
  append(left, text("Desktop / Left Title", "网页试用范围", 24, 31, colors.ink, fonts.bold), { horizontal: "FILL" });
  append(left, text("Desktop / Left Body", "输入地点后必须从候选列表选择。查询结果按耗时排序，最多展示 20 条路线。换乘路线会以路线号链展示。", 15, 24, colors.muted), { horizontal: "FILL" });
  append(left, statePanel("Desktop / Left Notice", "默认不显示旧结果", "起点和终点初始为空，交换地点后清空当前结果，需要重新查询。", "amber"), { horizontal: "FILL" });
  append(left, statePanel("Desktop / Left No Bell", "不含监控入口", "结果卡不显示铃铛，不提供路线监控、排序、详情展开或多班 ETA。", "red"), { horizontal: "FILL" });
  append(section, left);

  const tool = autoFrame("Desktop / Query Tool", 782, "VERTICAL", colors.surface);
  configureAuto(tool, { direction: "VERTICAL", p: 28, gap: 22 });
  radius(tool, 8);
  stroke(tool, colors.line);
  tool.effects = shadow(0.08, 18, 36);

  const fields = autoFrame("Desktop / Fields", 100, "HORIZONTAL", colors.surface);
  fields.fills = [];
  configureAuto(fields, { direction: "HORIZONTAL", gap: 12, counterAlign: "END" });
  append(fields, inputField("Desktop / Origin", "起点", "兴华邨兴翠楼", 292, "active"));
  append(fields, button("Desktop / Swap", "⇅", 48, "secondary"));
  append(fields, inputField("Desktop / Destination", "终点", "渔湾邨", 292));
  append(fields, button("Desktop / Search Button", "查询", 92, "primary"));
  append(tool, fields, { horizontal: "FILL" });
  append(tool, dropdown("Desktop / Origin Dropdown", 292));

  const summary = autoFrame("Desktop / Result Summary", 100, "HORIZONTAL", colors.brandPale);
  configureAuto(summary, { direction: "HORIZONTAL", p: 14, gap: 12, counterAlign: "CENTER" });
  radius(summary, 8);
  append(summary, text("Desktop / Result Summary Text", "资料仅供参考 · 12:41 更新 · ETA 正在批量刷新", 14, 20, colors.brand, fonts.medium), { horizontal: "FILL", grow: 1 });
  append(summary, chip("Desktop / Result Count", "20 条以内", "brand"));
  append(tool, summary, { horizontal: "FILL" });

  append(tool, routeCard("Desktop / Route Card 1", "606", "兴华邨兴翠楼 → 渔湾邨", "等候 49 分钟", "HK$ 6.1 · 耗时 10 分钟 · 步行 266 米", "brand"), { horizontal: "FILL" });
  append(tool, routeCard("Desktop / Route Card 2", "694 → 307", "兴华邨兴翠楼 → 海富中心", "即将到站", "HK$ 16.8 · 耗时 38 分钟 · 步行 420 米", "blue"), { horizontal: "FILL" });
  append(tool, routeCard("Desktop / Route Card 3", "82", "兴华邨丰兴楼 → 北角码头", "候车暂不可用", "HK$ 5.2 · 耗时 24 分钟 · 步行 310 米", "amber"), { horizontal: "FILL" });
  append(section, tool);
  append(root, section, { horizontal: "FILL" });

  const states = autoFrame("Desktop / State Coverage", 1256, "HORIZONTAL", colors.page);
  states.fills = [];
  configureAuto(states, { direction: "HORIZONTAL", gap: 16 });
  append(states, skeleton("Desktop / Loading State", 300));
  append(states, statePanel("Desktop / Empty State", "没有可用路线", "提示用户尝试附近地点或调整起点和终点。", "blue"), { grow: 1 });
  append(states, statePanel("Desktop / Failure State", "查询失败", "起终点变更后的失败不展示旧路线，只展示可重试错误。", "red"), { grow: 1 });
  append(states, statePanel("Desktop / Retained State", "仍显示上次结果", "语言切换重查失败时保留旧结果，并显示轻量状态提示。", "amber"), { grow: 1 });
  append(root, states, { horizontal: "FILL" });

  return root;
}

function buildMobile() {
  const root = autoFrame(MOBILE_FRAME_NAME, 390, "VERTICAL", colors.page);
  configureAuto(root, { direction: "VERTICAL", pl: 24, pr: 24, pt: 36, pb: 36, gap: 22, counterAlign: "CENTER" });

  append(root, chip("Mobile / Eyebrow", "网页试用", "brand"));
  append(root, text("Mobile / Title", "香港巴士路线查询", 28, 35, colors.ink, fonts.bold), { horizontal: "FILL" });
  append(root, text("Mobile / Subtitle", "输入起点和终点，从地点列表选择后查询。完整监控和保存路线请使用 App。", 15, 23, colors.muted), { horizontal: "FILL" });

  const tool = autoFrame("Mobile / Query Tool", 342, "VERTICAL", colors.surface);
  configureAuto(tool, { direction: "VERTICAL", p: 18, gap: 18 });
  radius(tool, 8);
  stroke(tool, colors.line);
  tool.effects = shadow(0.08, 14, 28);
  append(tool, inputField("Mobile / Origin", "起点", "兴华邨兴翠楼", 306, "active"), { horizontal: "FILL" });
  append(tool, dropdown("Mobile / Origin Dropdown", 306), { horizontal: "FILL" });
  append(tool, button("Mobile / Swap", "交换起终点 ⇅", 306, "secondary"), { horizontal: "FILL" });
  append(tool, inputField("Mobile / Destination", "终点", "渔湾邨", 306), { horizontal: "FILL" });
  append(tool, button("Mobile / Search Button", "查询路线", 306, "primary"), { horizontal: "FILL" });
  append(tool, statePanel("Mobile / Updating", "候车查询中", "路线摘要先展示，批量 ETA 返回后更新右侧候车状态。", "brand"), { horizontal: "FILL" });
  append(tool, routeCard("Mobile / Route Card 1", "606", "兴华邨兴翠楼 → 渔湾邨", "等候 49 分钟", "HK$ 6.1 · 耗时 10 分钟 · 步行 266 米", "brand"), { horizontal: "FILL" });
  append(tool, routeCard("Mobile / Route Card 2", "694 → 307", "兴华邨兴翠楼 → 海富中心", "候车暂不可用", "HK$ 16.8 · 耗时 38 分钟 · 步行 420 米", "amber"), { horizontal: "FILL" });
  append(root, tool);

  append(root, statePanel("Mobile / Empty State", "没有可用路线", "0 条路线是正常空态，不视为外部服务失败。", "blue"), { horizontal: "FILL" });
  append(root, statePanel("Mobile / Failure State", "查询失败", "当前起终点查询失败时展示可重试提示；如果只是语言切换失败，保留上次结果。", "red"), { horizontal: "FILL" });
  return root;
}

function buildNotes(desktopId, mobileId) {
  const note = autoFrame(NOTE_FRAME_NAME, 760, "VERTICAL", colors.surface);
  configureAuto(note, { direction: "VERTICAL", p: 24, gap: 14 });
  radius(note, 8);
  stroke(note, colors.line);
  append(note, text("Spec Notes / Title", "Online Query v2 Figma 设计说明", 22, 30, colors.ink, fonts.bold), { horizontal: "FILL" });
  append(note, text("Spec Notes / Body", [
    "覆盖状态：地点下拉、loading、结果卡、ETA 更新、0 结果空态、查询失败、语言切换失败保留旧结果。",
    "结果卡约束：不显示铃铛、不提供监控入口、不做排序、不展开详情、不展示多班 ETA。",
    "动态地点和站名只展示当前语言一种；此稿以简体中文作为内容样例。",
    `Desktop node: ${desktopId}`,
    `Mobile node: ${mobileId}`
  ].join("\n"), 14, 22, colors.muted), { horizontal: "FILL" });
  return note;
}

function nodeUrl(nodeId) {
  return `${TARGET_FILE_URL}?node-id=${nodeId.replace(":", "-")}`;
}

async function main() {
  currentStage = "show-ui";
  const fallbackHtml = [
    "<!doctype html>",
    "<html><body style=\"font-family: Inter, sans-serif; padding: 16px; color: #17211d;\">",
    "<h2 style=\"font-size: 16px; margin: 0 0 8px;\">Online Query v2 Builder</h2>",
    "<p style=\"font-size: 13px; line-height: 1.5; color: #5f6863;\">插件正在运行。如果生成失败，错误会显示在下方。</p>",
    "<textarea id=\"report\" style=\"box-sizing: border-box; width: 100%; height: 360px; font: 12px monospace;\"></textarea>",
    "<script>",
    "onmessage=function(event){var message=event.data.pluginMessage;if(!message)return;var report=document.getElementById('report');if(message.type==='complete'){report.value=message.report;}if(message.type==='error'){report.value=message.error;}};",
    "</script>",
    "</body></html>"
  ].join("");

  const html = typeof __html__ === "string" ? __html__ : fallbackHtml;
  figma.showUI(html, { width: 520, height: 560 });
  uiReady = true;
  figma.ui.onmessage = (message) => {
    if (message.type === "close") figma.closePlugin();
  };

  currentStage = "load-fonts";
  await setupFonts();
  currentStage = "load-pages";
  if (figma.loadAllPagesAsync) await figma.loadAllPagesAsync();

  currentStage = "prepare-page";
  let page = figma.root.children.find((child) => child.name === PAGE_NAME);
  if (!page) page = figma.createPage();
  page.name = PAGE_NAME;
  await figma.setCurrentPageAsync(page);

  currentStage = "clean-existing-nodes";
  const existingChildren = page.children.slice();
  for (const child of existingChildren) {
    if ([DESKTOP_FRAME_NAME, MOBILE_FRAME_NAME, NOTE_FRAME_NAME].includes(child.name)) {
      child.remove();
    }
  }

  currentStage = "build-desktop";
  const desktop = buildDesktop();
  desktop.x = 0;
  desktop.y = 0;
  page.appendChild(desktop);

  currentStage = "build-mobile";
  const mobile = buildMobile();
  mobile.x = desktop.width + 140;
  mobile.y = 0;
  page.appendChild(mobile);

  currentStage = "build-notes";
  const note = buildNotes(desktop.id, mobile.id);
  note.x = 0;
  note.y = Math.max(desktop.height, mobile.height) + 90;
  page.appendChild(note);

  currentStage = "select-and-report";
  figma.currentPage.selection = [desktop, mobile];
  figma.viewport.scrollAndZoomIntoView([desktop, mobile]);

  const report = [
    "Figma Online Query v2 nodes",
    `File: ${TARGET_FILE_URL}`,
    `Page: ${PAGE_NAME} (${page.id})`,
    `Desktop: ${DESKTOP_FRAME_NAME} (${desktop.id})`,
    `Desktop URL: ${nodeUrl(desktop.id)}`,
    `Mobile: ${MOBILE_FRAME_NAME} (${mobile.id})`,
    `Mobile URL: ${nodeUrl(mobile.id)}`,
    `Spec notes: ${NOTE_FRAME_NAME} (${note.id})`,
    `Generated at: ${new Date().toISOString()}`,
    `Plugin font family: ${fonts.regular.family}`,
    "",
    "请把 Desktop URL 和 Mobile URL 发给 Codex。"
  ].join("\n");

  figma.ui.postMessage({ type: "complete", report });
}

main().catch((error) => {
  const message = `Stage: ${currentStage}\n\n${error && error.stack ? error.stack : String(error)}`;
  if (!uiReady) {
    try {
      const escapedMessage = message.replace(/[&<>]/g, function (char) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char];
      });
      figma.showUI("<textarea style=\"width:100%;height:100%;font:12px monospace;\">" + escapedMessage + "</textarea>", { width: 520, height: 560 });
      uiReady = true;
    } catch (uiError) {
      figma.closePlugin(message);
      return;
    }
  }
  figma.ui.postMessage({ type: "error", error: message });
});
