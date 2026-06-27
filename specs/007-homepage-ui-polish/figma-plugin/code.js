const TARGET_FILE_URL = "https://www.figma.com/design/LAm6RjzFuFHsHFlcipx8pU/BusIsComing-Website---Homepage-v1-Spec";
const PAGE_NAME = "Homepage UI Polish - 007";

const colors = {
  page: "#F6FBFA",
  surface: "#FFFFFF",
  surfaceSoft: "#F5FBFA",
  line: "#DBE9E7",
  ink: "#17373A",
  muted: "#506765",
  brand: "#006870",
  brandDark: "#073F43",
  brandSoft: "#E7F5F2",
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
  return { type: "SOLID", color: hexToRgb(hex), opacity };
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

function frame(name, width, height, fill = colors.surface) {
  const node = figma.createFrame();
  node.name = name;
  node.resize(width, height);
  node.fills = [solid(fill)];
  node.clipsContent = false;
  return node;
}

function card(name, width, height) {
  const node = frame(name, width, height, colors.surface);
  node.cornerRadius = 10;
  node.strokes = [solid(colors.line)];
  node.strokeWeight = 1;
  node.effects = shadow(0.08, 12, 28);
  return node;
}

function phone(name, width, height, x, y, rotation = 0, opacity = 1) {
  const node = frame(name, width, height, "#F8FCFB");
  node.x = x;
  node.y = y;
  node.rotation = rotation;
  node.opacity = opacity;
  node.cornerRadius = 30;
  node.strokes = [solid("#C9DAD4")];
  node.strokeWeight = 1;
  node.effects = shadow(0.18, 24, 52);

  const header = figma.createRectangle();
  header.name = `${name} / Header area`;
  header.resize(width - 28, 82);
  header.x = 14;
  header.y = 14;
  header.cornerRadius = 20;
  header.fills = [solid("#D7E0EE")];
  node.appendChild(header);

  for (let i = 0; i < 5; i += 1) {
    const row = figma.createRectangle();
    row.name = `${name} / App content row ${i + 1}`;
    row.resize(width - 36, 34);
    row.x = 18;
    row.y = 116 + i * 52;
    row.cornerRadius = 8;
    row.fills = [solid(i % 2 === 0 ? colors.surface : colors.brandSoft)];
    row.strokes = [solid(colors.line)];
    row.strokeWeight = 1;
    node.appendChild(row);
  }
  return node;
}

function addHeroNode(page, x, y) {
  const root = frame("Desktop 1440 / Hero Medium Screenshot Deck", 1180, 620, colors.page);
  root.x = x;
  root.y = y;
  root.cornerRadius = 18;

  const deck = frame("Screenshot zone / Drag switches same-feature image", 500, 500, colors.page);
  deck.x = 40;
  deck.y = 60;
  deck.cornerRadius = 16;
  deck.strokes = [solid(colors.line)];
  deck.strokeWeight = 1;
  root.appendChild(deck);
  deck.appendChild(phone("Back deck card left", 210, 420, 100, 54, -5, 0.72));
  deck.appendChild(phone("Back deck card right", 210, 420, 190, 60, 5, 0.62));
  deck.appendChild(phone("Main screenshot / Click opens lightbox", 210, 420, 145, 42, 0, 1));

  const copy = frame("Copy zone / Drag switches feature", 500, 360, colors.surface);
  copy.x = 610;
  copy.y = 130;
  copy.cornerRadius = 14;
  copy.strokes = [solid(colors.line)];
  copy.strokeWeight = 1;
  root.appendChild(copy);
  const title = text("Feature title", "出門前監測\n與語音提醒", 44, 52, colors.brandDark, fonts.bold);
  title.x = 34;
  title.y = 36;
  copy.appendChild(title);
  const desc = text("Feature description", "臨出門前短時間監測程城巴抵站時間，配合通知與語音提示，少一點趕車壓力。", 18, 30, colors.ink, fonts.regular);
  desc.x = 34;
  desc.y = 168;
  desc.resize(410, desc.height);
  copy.appendChild(desc);
  const note = text("No zoom indicator note", "不显示放大提示器；主截图本身可点击打开大图。", 13, 20, colors.muted, fonts.medium);
  note.x = 34;
  note.y = 278;
  copy.appendChild(note);

  page.appendChild(root);
  return root;
}

function addLightboxNode(page, x, y) {
  const root = frame("Desktop 1440 / Screenshot Lightbox", 960, 620, "#102326");
  root.x = x;
  root.y = y;
  root.cornerRadius = 18;
  root.appendChild(phone("Lightbox active screenshot", 260, 520, 350, 54, 0, 1));
  const title = text("Lightbox title", "查看截图细节", 22, 30, colors.surface, fonts.bold);
  title.x = 36;
  title.y = 34;
  root.appendChild(title);
  const rules = text("Lightbox rules", "支持缩放、平移、Esc 关闭；左右切换只在同一功能截图组内进行。", 15, 24, "#D5E6E3", fonts.regular);
  rules.x = 36;
  rules.y = 78;
  rules.resize(280, rules.height);
  root.appendChild(rules);
  const close = card("Close button", 88, 38);
  close.x = 820;
  close.y = 36;
  close.fills = [solid("#19383C")];
  root.appendChild(close);
  const closeText = text("Close label", "关闭", 14, 20, colors.surface, fonts.medium);
  closeText.x = 848;
  closeText.y = 45;
  root.appendChild(closeText);
  page.appendChild(root);
  return root;
}

function addFeatureGridNode(page, x, y) {
  const root = frame("Mobile 390 / Compact Feature Grid", 390, 620, colors.page);
  root.x = x;
  root.y = y;
  root.cornerRadius = 28;
  const heading = text("Section title", "為每日城巴通勤，節省時間", 28, 36, colors.brandDark, fonts.bold);
  heading.x = 24;
  heading.y = 28;
  heading.resize(330, heading.height);
  root.appendChild(heading);
  const items = ["常用路線", "車費一眼看清", "多班抵站時間", "路線詳情", "出門前監測", "快速切換方向"];
  items.forEach((label, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const box = card(`Feature card / ${label}`, 160, 94);
    box.x = 24 + col * 174;
    box.y = 122 + row * 106;
    root.appendChild(box);
    const icon = text(`Feature icon / ${label}`, index === 1 ? "$" : "□", 20, 22, colors.brand, fonts.bold);
    icon.x = box.x + 12;
    icon.y = box.y + 10;
    root.appendChild(icon);
    const title = text(`Feature title / ${label}`, label, 14, 18, colors.ink, fonts.bold);
    title.x = box.x + 12;
    title.y = box.y + 38;
    title.resize(132, title.height);
    root.appendChild(title);
    const desc = text(`Feature desc / ${label}`, index === 1 ? "車費、耗時、步行一起比較" : "一句短說明", 11, 15, colors.muted, fonts.regular);
    desc.x = box.x + 12;
    desc.y = box.y + 62;
    desc.resize(134, desc.height);
    root.appendChild(desc);
  });
  page.appendChild(root);
  return root;
}

function addRouteCardNode(page, x, y) {
  const root = frame("Mobile 390 / Compact Route Result Card", 390, 620, colors.page);
  root.x = x;
  root.y = y;
  root.cornerRadius = 28;
  const heading = text("Result header", "可選路線        12 條結果", 22, 30, colors.ink, fonts.bold);
  heading.x = 24;
  heading.y = 28;
  root.appendChild(heading);
  const routes = [
    ["82", "候車暫不可用", "站點資料暫未返回", "$4.90", "9 分鐘", "269 米"],
    ["8X", "等候 1 分鐘", "興華邨興翠樓 → 漁灣邨", "$4.30", "7 分鐘", "180 米"],
    ["780", "等候 4 分鐘", "柴灣站 → 灣仔碼頭", "$6.50", "18 分鐘", "320 米"]
  ];
  routes.forEach((route, index) => {
    const box = card(`Route card / ${route[0]}`, 342, 128);
    box.x = 24;
    box.y = 86 + index * 144;
    root.appendChild(box);
    const num = text(`Route number / ${route[0]}`, route[0], 24, 28, colors.ink, fonts.bold);
    num.x = box.x + 14;
    num.y = box.y + 13;
    root.appendChild(num);
    const eta = text(`ETA pill / ${route[0]}`, route[1], 13, 18, colors.brand, fonts.medium);
    eta.x = box.x + 204;
    eta.y = box.y + 18;
    root.appendChild(eta);
    const path = text(`Stops / ${route[0]}`, route[2], 13, 18, colors.muted, fonts.regular);
    path.x = box.x + 14;
    path.y = box.y + 54;
    path.resize(314, path.height);
    root.appendChild(path);
    ["車費", "耗時", "步行"].forEach((label, metricIndex) => {
      const labelNode = text(`Metric label / ${route[0]} / ${label}`, label, 11, 14, "#7A8D8B", fonts.medium);
      labelNode.x = box.x + 14 + metricIndex * 106;
      labelNode.y = box.y + 92;
      root.appendChild(labelNode);
      const valueNode = text(`Metric value / ${route[0]} / ${label}`, route[3 + metricIndex], 14, 16, colors.ink, fonts.bold);
      valueNode.x = labelNode.x + 28;
      valueNode.y = box.y + 91;
      root.appendChild(valueNode);
    });
  });
  page.appendChild(root);
  return root;
}

function addInteractionNode(page, x, y) {
  const root = frame("Interaction States / Split Gesture Zones", 960, 360, colors.surface);
  root.x = x;
  root.y = y;
  root.cornerRadius = 16;
  root.strokes = [solid(colors.line)];
  root.strokeWeight = 1;
  const title = text("Interaction title", "交互规则", 30, 38, colors.brandDark, fonts.bold);
  title.x = 32;
  title.y = 28;
  root.appendChild(title);
  const rules = [
    ["截图区", "拖动或滑动只切换同功能截图；点击后排图也只切同功能主图。"],
    ["文字区", "拖动或滑动切换整个功能；圆点继续跳到指定功能场景。"],
    ["大图模式", "缩放和平移查看细节；左右切换只在同一功能截图组内进行。"]
  ];
  rules.forEach((rule, index) => {
    const box = card(`Rule card / ${rule[0]}`, 280, 172);
    box.x = 32 + index * 306;
    box.y = 118;
    root.appendChild(box);
    const ruleTitle = text(`Rule title / ${rule[0]}`, rule[0], 20, 28, colors.brand, fonts.bold);
    ruleTitle.x = box.x + 18;
    ruleTitle.y = box.y + 18;
    root.appendChild(ruleTitle);
    const body = text(`Rule body / ${rule[0]}`, rule[1], 14, 23, colors.ink, fonts.regular);
    body.x = box.x + 18;
    body.y = box.y + 60;
    body.resize(238, body.height);
    root.appendChild(body);
  });
  page.appendChild(root);
  return root;
}

function addNotesNode(page, x, y) {
  const root = frame("Spec Notes", 960, 300, colors.surfaceSoft);
  root.x = x;
  root.y = y;
  root.cornerRadius = 16;
  root.strokes = [solid(colors.line)];
  root.strokeWeight = 1;
  const title = text("Notes title", "规格说明", 28, 36, colors.brandDark, fonts.bold);
  title.x = 32;
  title.y = 28;
  root.appendChild(title);
  const body = text(
    "Notes body",
    "不新增服务端 HTTP API；手机功能介绍只改手机端；路线结果卡桌面端保持现状；费用标题使用「車費一眼看清 / 车费一眼看清 / Fare at a glance」；后续实现需补充桌面与手机截图验收。",
    15,
    26,
    colors.ink,
    fonts.regular
  );
  body.x = 32;
  body.y = 84;
  body.resize(840, body.height);
  root.appendChild(body);
  page.appendChild(root);
  return root;
}

async function main() {
  try {
    figma.showUI(__html__, { width: 520, height: 440 });
    await setupFonts();

    let page = figma.root.children.find((candidate) => candidate.name === PAGE_NAME);
    if (!page) {
      page = figma.createPage();
      page.name = PAGE_NAME;
    }
    await figma.setCurrentPageAsync(page);
    page.children.slice().forEach((child) => child.remove());

    const nodes = [
      addHeroNode(page, 0, 0),
      addLightboxNode(page, 0, 700),
      addFeatureGridNode(page, 1020, 0),
      addRouteCardNode(page, 1450, 0),
      addInteractionNode(page, 1020, 700),
      addNotesNode(page, 1020, 1120)
    ];

    figma.viewport.scrollAndZoomIntoView(nodes);
    const report = [
      `Figma file: ${TARGET_FILE_URL}`,
      `Page: ${PAGE_NAME}`,
      ...nodes.map((node) => `- ${node.name}: ${node.id}`)
    ].join("\n");
    figma.ui.postMessage({ type: "complete", report });
  } catch (error) {
    figma.ui.postMessage({ type: "error", error: error && error.stack ? error.stack : String(error) });
  }
}

figma.ui.onmessage = (message) => {
  if (message && message.type === "close") {
    figma.closePlugin();
  }
};

main();
