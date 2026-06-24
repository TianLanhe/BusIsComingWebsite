const TARGET_FILE_URL = "https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec";
const PAGE_NAME = "Homepage Experience Polish - 005";

const colors = {
  page: "#F6F8F6",
  surface: "#FFFFFF",
  surfaceSoft: "#EFF7F4",
  line: "#DDE4DF",
  ink: "#15211D",
  muted: "#5C6862",
  brand: "#175247",
  brandSoft: "#DCEDE7",
  red: "#8A2F24",
  redSoft: "#FBE6E2",
  amber: "#9A6418",
  amberSoft: "#FFF2DA",
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

function shadow(opacity = 0.1, y = 18, radius = 36) {
  const color = hexToRgb(colors.shadow);
  return [{
    type: "DROP_SHADOW",
    color: { r: color.r, g: color.g, b: color.b, a: opacity },
    offset: { x: 0, y },
    radius,
    spread: -8,
    visible: true,
    blendMode: "NORMAL"
  }];
}

function radius(node, value) {
  node.cornerRadius = value;
}

function stroke(node, color = colors.line, weight = 1) {
  node.strokes = [solid(color)];
  node.strokeWeight = weight;
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

function configureAuto(node, options = {}) {
  node.layoutMode = options.direction || node.layoutMode || "VERTICAL";
  node.primaryAxisSizingMode = options.primary || node.primaryAxisSizingMode || "AUTO";
  node.counterAxisSizingMode = options.counter || node.counterAxisSizingMode || "FIXED";
  node.primaryAxisAlignItems = options.primaryAlign || "MIN";
  node.counterAxisAlignItems = options.counterAlign || "MIN";
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
  return child;
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
    ["Inter", "PingFang SC", "Noto Sans SC", "Noto Sans CJK SC", "Source Han Sans SC", "Arial"]
      .find((candidate) => byFamily.has(candidate)) ||
    (available[0] && available[0].fontName.family) ||
    "Inter";

  const styles = byFamily.get(family) || ["Regular"];
  fonts = {
    regular: { family, style: pickFontStyle(styles, ["Regular", "Book", "Normal"]) },
    medium: { family, style: pickFontStyle(styles, ["Medium", "Semi Bold", "Semibold", "Regular"]) },
    bold: { family, style: pickFontStyle(styles, ["Bold", "Semi Bold", "Semibold", "Medium", "Regular"]) }
  };

  const unique = [fonts.regular, fonts.medium, fonts.bold]
    .filter((font, index, list) => list.findIndex((item) => item.family === font.family && item.style === font.style) === index);
  await Promise.all(unique.map((font) => figma.loadFontAsync(font)));
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

function chip(name, content, tone = "brand") {
  const palette = tone === "red" ? [colors.redSoft, colors.red] : tone === "amber" ? [colors.amberSoft, colors.amber] : [colors.brandSoft, colors.brand];
  const node = autoFrame(name, 10, "HORIZONTAL", palette[0]);
  configureAuto(node, { direction: "HORIZONTAL", p: 8, pt: 5, pb: 5, gap: 6, counterAlign: "CENTER" });
  node.counterAxisSizingMode = "AUTO";
  radius(node, 999);
  append(node, text(`${name} / Text`, content, 12, 16, palette[1], fonts.medium));
  return node;
}

function brandMark(name, size = 42) {
  const node = fixedFrame(name, size, size, colors.surface);
  node.fills = [];

  const body = figma.createRectangle();
  body.name = `${name} / Transparent bus body`;
  body.resize(size * 0.72, size * 0.72);
  body.x = size * 0.14;
  body.y = size * 0.14;
  body.cornerRadius = size * 0.16;
  body.fills = [solid("#7E68D6")];
  node.appendChild(body);

  const face = figma.createRectangle();
  face.name = `${name} / Face`;
  face.resize(size * 0.52, size * 0.28);
  face.x = size * 0.24;
  face.y = size * 0.46;
  face.cornerRadius = size * 0.1;
  face.fills = [solid("#C5C1FF")];
  node.appendChild(face);

  append(node, text(`${name} / Heart`, "♥", size * 0.28, size * 0.3, "#FF5B9B", fonts.bold));
  node.children[node.children.length - 1].x = size * 0.39;
  node.children[node.children.length - 1].y = size * 0.22;
  return node;
}

function phoneScreen(name, width, height, variant = "routes") {
  const phone = fixedFrame(name, width, height, colors.surface);
  radius(phone, 28);
  stroke(phone, "#C9DAD4");
  phone.effects = shadow(0.16, 24, 52);

  const top = figma.createRectangle();
  top.name = `${name} / Speaker`;
  top.resize(width * 0.24, 5);
  top.x = width * 0.38;
  top.y = 14;
  top.cornerRadius = 999;
  top.fills = [solid(colors.ink, 0.18)];
  phone.appendChild(top);

  const screen = fixedFrame(`${name} / Screen`, width - 28, height - 48, "#F8FBFA");
  screen.x = 14;
  screen.y = 32;
  radius(screen, 18);
  phone.appendChild(screen);

  const heading = text(`${name} / App heading`, variant === "monitor" ? "出門前監測" : variant === "eta" ? "抵站時間" : "城巴查詢", 18, 24, colors.ink, fonts.bold);
  heading.x = 18;
  heading.y = 18;
  screen.appendChild(heading);

  const button = figma.createRectangle();
  button.name = `${name} / Primary action`;
  button.resize(width - 64, 26);
  button.x = 18;
  button.y = 86;
  button.cornerRadius = 6;
  button.fills = [solid(colors.brand)];
  screen.appendChild(button);

  for (let i = 0; i < 4; i += 1) {
    const card = figma.createRectangle();
    card.name = `${name} / Result card ${i + 1}`;
    card.resize(width - 64, 46);
    card.x = 18;
    card.y = 132 + i * 58;
    card.cornerRadius = 9;
    card.fills = [solid(colors.surface)];
    card.strokes = [solid(colors.line)];
    card.strokeWeight = 1;
    screen.appendChild(card);
  }

  return phone;
}

function carouselRail(name, width, height, mobile = false) {
  const rail = fixedFrame(name, width, height, colors.page);
  rail.clipsContent = false;
  radius(rail, 24);

  const backLeft = phoneScreen(`${name} / Previous low-emphasis preview`, mobile ? 92 : 124, mobile ? 178 : 238, "routes");
  backLeft.opacity = 0.32;
  backLeft.x = mobile ? 12 : 42;
  backLeft.y = mobile ? 42 : 62;
  backLeft.rotation = -4;
  rail.appendChild(backLeft);

  const backRight = phoneScreen(`${name} / Next low-emphasis preview`, mobile ? 92 : 124, mobile ? 178 : 238, "eta");
  backRight.opacity = 0.32;
  backRight.x = width - backRight.width - (mobile ? 12 : 42);
  backRight.y = mobile ? 42 : 62;
  backRight.rotation = 4;
  rail.appendChild(backRight);

  const main = phoneScreen(`${name} / Main phone screenshot`, mobile ? 184 : 244, mobile ? 350 : 462, mobile ? "eta" : "routes");
  main.x = (width - main.width) / 2;
  main.y = mobile ? 18 : 24;
  rail.appendChild(main);

  const hint = chip(`${name} / Swipe hint`, mobile ? "左右滑動" : "drag / swipe", "brand");
  hint.x = (width - 90) / 2;
  hint.y = height - 42;
  rail.appendChild(hint);

  return rail;
}

function desktopFrame() {
  const frame = fixedFrame("Desktop 1440 / Cinematic Rail", 1440, 960, colors.page);

  const header = fixedFrame("Desktop / Header", 1440, 78, colors.surface);
  stroke(header, colors.line);
  frame.appendChild(header);
  const mark = brandMark("Desktop / Real app logo foreground", 34);
  mark.x = 68;
  mark.y = 22;
  header.appendChild(mark);
  const brand = text("Desktop / Brand", "BusIsComing", 22, 28, colors.brand, fonts.bold);
  brand.x = 112;
  brand.y = 26;
  header.appendChild(brand);
  const contact = text("Desktop / Contact nav", "聯絡我們", 15, 20, colors.ink, fonts.medium);
  contact.x = 1160;
  contact.y = 30;
  header.appendChild(contact);

  const heroTitle = text("Desktop / Hero title", "城巴查詢，出門前心中有數", 62, 68, colors.ink, fonts.bold);
  heroTitle.x = 90;
  heroTitle.y = 176;
  heroTitle.resize(560, 150);
  frame.appendChild(heroTitle);
  const heroBody = text("Desktop / Hero body", "保存常用起終點，一按比較 Citybus 路線、交通費用、行程時間與首程抵站時間。", 21, 32, colors.muted);
  heroBody.x = 92;
  heroBody.y = 342;
  heroBody.resize(560, 88);
  frame.appendChild(heroBody);

  const rail = carouselRail("Desktop / Rail visual", 520, 560, false);
  rail.x = 730;
  rail.y = 188;
  frame.appendChild(rail);

  const copy = text("Desktop / Carousel copy", "抵站時間與路線詳情\n一個主畫面，左右滑動查看相鄰內容。", 34, 44, colors.ink, fonts.bold);
  copy.x = 1080;
  copy.y = 410;
  copy.resize(260, 120);
  frame.appendChild(copy);

  return frame;
}

function mobileFrame() {
  const frame = fixedFrame("Mobile 390 / Swipe Rail", 390, 844, colors.page);

  const header = fixedFrame("Mobile / Header", 390, 66, colors.surface);
  stroke(header, colors.line);
  frame.appendChild(header);
  const mark = brandMark("Mobile / Real app logo foreground", 30);
  mark.x = 22;
  mark.y = 18;
  header.appendChild(mark);
  const brand = text("Mobile / Brand", "BusIsComing", 20, 25, colors.brand, fonts.bold);
  brand.x = 60;
  brand.y = 23;
  header.appendChild(brand);

  const rail = carouselRail("Mobile / Rail visual", 344, 430, true);
  rail.x = 23;
  rail.y = 92;
  frame.appendChild(rail);

  const title = text("Mobile / Carousel title", "抵站時間與路線詳情", 29, 36, colors.ink, fonts.bold);
  title.x = 32;
  title.y = 548;
  title.resize(326, 78);
  frame.appendChild(title);

  const body = text("Mobile / Carousel body", "左右滑動查看相鄰截圖，不顯示底部縮略圖。", 17, 27, colors.muted);
  body.x = 34;
  body.y = 642;
  body.resize(322, 70);
  frame.appendChild(body);

  return frame;
}

function statesFrame() {
  const frame = fixedFrame("Carousel States / No Thumbnail Stack", 760, 440, colors.surface);
  radius(frame, 18);
  stroke(frame, colors.line);
  frame.effects = shadow(0.08, 18, 34);

  const title = text("States / Title", "輪播狀態與禁止形態", 30, 38, colors.ink, fonts.bold);
  title.x = 36;
  title.y = 34;
  frame.appendChild(title);

  const ok = [
    "3 秒自動切換 4 個功能頁",
    "手機左右滑動，桌面拖動",
    "hover / focus / drag / touch 暫停",
    "只允許左右低強調預覽"
  ];
  ok.forEach((item, index) => {
    const t = chip(`States / Allowed ${index + 1}`, item, "brand");
    t.x = 38;
    t.y = 96 + index * 48;
    frame.appendChild(t);
  });

  const forbidden = [
    "禁止底部小圖堆疊",
    "禁止膠片條",
    "禁止縮略圖按鈕組",
    "禁止 01 / 02 / 03 / 04"
  ];
  forbidden.forEach((item, index) => {
    const t = chip(`States / Forbidden ${index + 1}`, item, "red");
    t.x = 388;
    t.y = 96 + index * 48;
    frame.appendChild(t);
  });

  return frame;
}

function brandContactFrame() {
  const frame = fixedFrame("Brand Contact States", 760, 360, colors.surface);
  radius(frame, 18);
  stroke(frame, colors.line);
  frame.effects = shadow(0.08, 18, 34);

  const title = text("Brand Contact / Title", "真實 Logo 與聯絡入口", 30, 38, colors.ink, fonts.bold);
  title.x = 36;
  title.y = 34;
  frame.appendChild(title);

  const mark = brandMark("Brand Contact / Foreground logo only", 88);
  mark.x = 48;
  mark.y = 118;
  frame.appendChild(mark);

  const copy = text("Brand Contact / Copy", "來源：Android ic_launcher_foreground.png\n只保留中間巴士主體，透明背景。\n導覽：聯絡我們 / 联系我们 / Contact Us\nEmail：hezhenyu966@gmail.com", 19, 30, colors.muted);
  copy.x = 172;
  copy.y = 114;
  copy.resize(520, 150);
  frame.appendChild(copy);

  return frame;
}

function notesFrame() {
  const frame = fixedFrame("Spec Notes", 760, 420, colors.surface);
  radius(frame, 18);
  stroke(frame, colors.line);
  frame.effects = shadow(0.08, 18, 34);

  const title = text("Notes / Title", "實作與驗收注意事項", 30, 38, colors.ink, fonts.bold);
  title.x = 36;
  title.y = 34;
  frame.appendChild(title);

  const body = text(
    "Notes / Body",
    [
      "1. 不得把相鄰預覽做成可點擊縮略圖列表。",
      "2. visual-review 必須保存桌面與手機截圖。",
      "3. zh-Hant 採香港實用書面語，不直接轉換簡體。",
      "4. 不新增或修改服務端 HTTP API。",
      `5. Figma 來源：${TARGET_FILE_URL}`
    ].join("\n"),
    18,
    30,
    colors.muted
  );
  body.x = 42;
  body.y = 104;
  body.resize(660, 240);
  frame.appendChild(body);

  return frame;
}

async function main() {
  figma.showUI(__html__, { width: 460, height: 420 });
  figma.ui.onmessage = (message) => {
    if (message && message.type === "close") figma.closePlugin();
  };
  await setupFonts();

  let page = figma.root.children.find((item) => item.name === PAGE_NAME);
  if (!page) {
    page = figma.createPage();
    page.name = PAGE_NAME;
  }
  await figma.setCurrentPageAsync(page);

  for (const child of [...page.children]) {
    child.remove();
  }

  const nodes = [desktopFrame(), mobileFrame(), statesFrame(), brandContactFrame(), notesFrame()];
  let x = 0;
  for (const node of nodes) {
    node.x = x;
    node.y = 0;
    page.appendChild(node);
    x += node.width + 160;
  }
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);

  const report = [
    `Figma file: ${TARGET_FILE_URL}`,
    `Page: ${PAGE_NAME}`,
    ...nodes.map((node) => `- ${node.name}: ${node.id}`)
  ].join("\n");

  figma.ui.postMessage({ type: "complete", report });
}

main().catch((error) => {
  figma.ui.postMessage({ type: "error", error: error && error.stack ? error.stack : String(error) });
});
