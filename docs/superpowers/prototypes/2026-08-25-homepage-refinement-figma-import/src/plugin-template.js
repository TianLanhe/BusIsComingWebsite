const DESIGN = __DESIGN_CONTRACT__;
const IMAGE_BASE64 = __IMAGE_BASE64__;

figma.showUI(__html__, { width: 430, height: 560, themeColors: true });

const FINAL_SECTION = DESIGN.finalSectionName;
const BUILDING_SECTION = FINAL_SECTION.replace(" — FINAL", " — BUILDING");
const COLORS = DESIGN.tokens.colors;
let FONT = null;
let ASSETS = null;

function post(stage, message, detail) {
  figma.ui.postMessage({ type: "progress", stage, message, detail: detail || "" });
}

function rgb(hexValue, alpha) {
  const clean = hexValue.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
    a: alpha === undefined ? 1 : alpha,
  };
}

function solid(color, opacity) {
  const value = rgb(color, opacity);
  return { type: "SOLID", color: { r: value.r, g: value.g, b: value.b }, opacity: value.a };
}

function gradient(stops, rotation) {
  const angle = ((rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(angle) / 2;
  const sin = Math.sin(angle) / 2;
  return {
    type: "GRADIENT_LINEAR",
    gradientTransform: [
      [cos, sin, 0.5 - cos / 2 - sin / 2],
      [-sin, cos, 0.5 + sin / 2 - cos / 2],
    ],
    gradientStops: stops.map((stop) => ({ position: stop.position, color: rgb(stop.color, stop.opacity) })),
  };
}

function add(parent, node, x, y) {
  parent.appendChild(node);
  node.x = x;
  node.y = y;
  return node;
}

function frame(parent, name, x, y, width, height, fill, radius) {
  const node = figma.createFrame();
  node.name = name;
  node.resize(width, height);
  node.clipsContent = false;
  node.fills = fill ? (Array.isArray(fill) ? fill : [fill]) : [];
  if (radius !== undefined) node.cornerRadius = radius;
  return add(parent, node, x, y);
}

function rectangle(parent, name, x, y, width, height, fill, radius) {
  const node = figma.createRectangle();
  node.name = name;
  node.resize(width, height);
  node.fills = fill ? (Array.isArray(fill) ? fill : [fill]) : [];
  if (radius !== undefined) node.cornerRadius = radius;
  return add(parent, node, x, y);
}

function ellipse(parent, name, x, y, width, height, fill, opacity) {
  const node = figma.createEllipse();
  node.name = name;
  node.resize(width, height);
  node.fills = fill ? [fill] : [];
  node.opacity = opacity === undefined ? 1 : opacity;
  return add(parent, node, x, y);
}

function line(parent, name, x, y, width, color, opacity, weight) {
  const node = figma.createLine();
  node.name = name;
  node.resize(width, 0);
  node.strokes = [solid(color, opacity === undefined ? 1 : opacity)];
  node.strokeWeight = weight || 1;
  return add(parent, node, x, y);
}

function text(parent, name, characters, x, y, width, size, weight, color, options) {
  const settings = options || {};
  const node = figma.createText();
  node.name = name;
  node.fontName = weight === "bold" ? FONT.bold : weight === "medium" ? FONT.medium : FONT.regular;
  node.fontSize = size;
  node.characters = characters;
  node.textAutoResize = "HEIGHT";
  node.resize(width, Math.max(size * (settings.lineHeight || 1.3), node.height));
  node.lineHeight = { value: (settings.lineHeight || 1.3) * size, unit: "PIXELS" };
  node.letterSpacing = { value: settings.letterSpacing || 0, unit: "PERCENT" };
  node.textAlignHorizontal = settings.align || "LEFT";
  node.fills = [solid(color || COLORS.ink, settings.opacity)];
  return add(parent, node, x, y);
}

function label(parent, characters, x, y, width) {
  return text(parent, "Documentation Label", characters, x, y, width, 12, "bold", COLORS.teal, {
    lineHeight: 1.2,
    letterSpacing: 12,
  });
}

function applyShadow(node, kind) {
  const spec = kind === "phone"
    ? { y: 25, blur: 56, alpha: 0.22 }
    : kind === "float"
      ? { y: 18, blur: 42, alpha: 0.14 }
      : { y: 9, blur: 24, alpha: 0.07 };
  node.effects = [{
    type: "DROP_SHADOW",
    color: { r: 0.03, g: 0.18, b: 0.17, a: spec.alpha },
    offset: { x: 0, y: spec.y },
    radius: spec.blur,
    spread: 0,
    visible: true,
    blendMode: "NORMAL",
  }];
}

function setFrameBackground(node) {
  node.fills = [gradient([
    { position: 0, color: "#d5eae5", opacity: 1 },
    { position: 0.5, color: "#edf6f2", opacity: 1 },
    { position: 1, color: "#cfe7e1", opacity: 1 },
  ], 145)];
}

function addWind(parent, width, height, quiet) {
  const strength = quiet ? 0.5 : 1;
  const far = ellipse(parent, "Wind / Far", -width * 0.2, -height * 0.18, width * 1.38, height * 0.46, null, 0.52 * strength);
  far.fills = [];
  far.strokes = [solid(COLORS.white, 0.56 * strength)];
  far.strokeWeight = Math.max(26, width * 0.055);
  const back = ellipse(parent, "Wind / Back", width * 0.44, height * 0.08, width * 0.88, height * 0.42, null, 0.28 * strength);
  back.fills = [];
  back.strokes = [solid(COLORS.teal, 0.11 * strength)];
  back.strokeWeight = Math.max(20, width * 0.04);
  ellipse(parent, "Wind / Mid", -width * 0.12, height * 0.37, width * 1.3, height * 0.2, solid(COLORS.white, 0.66), 0.75 * strength);
  ellipse(parent, "Wind / Near", -width * 0.08, height * 0.79, width * 1.22, height * 0.24, solid(COLORS.white, 0.72), 0.68 * strength);
  ellipse(parent, "Wind / Glow", width * 0.44, height * 0.55, width * 0.72, height * 0.3, solid(COLORS.pale, 0.45), 0.72 * strength);
}

function imageFill(imageName, scaleMode) {
  return { type: "IMAGE", imageHash: ASSETS[imageName].hash, scaleMode: scaleMode || "FILL" };
}

function createBrandRow(parent, width, compact, locale) {
  const pad = compact ? 18 : 72;
  const logoSize = compact ? 32 : 44;
  const y = compact ? 18 : 36;
  rectangle(parent, "Brand / Real App Logo", pad, y, logoSize, logoSize, imageFill(DESIGN.brand.image), compact ? 9 : 12);
  text(parent, "Brand / Name", DESIGN.brand.name, pad + logoSize + (compact ? 8 : 12), y + (compact ? 7 : 9), compact ? 152 : 230, compact ? 16 : 24, "bold", COLORS.ink, { lineHeight: 1 });
  const display = DESIGN.languageOptions.map((option) => option.label).join("  ·  ");
  const langWidth = compact ? 112 : 150;
  const node = text(parent, "Language / Direct Options", display, width - pad - langWidth, y + (compact ? 8 : 11), langWidth, compact ? 12 : 14, "bold", COLORS.muted, { lineHeight: 1.1, align: "RIGHT" });
  node.setPluginData("activeLocale", locale);
  node.setPluginData("hitTargets", "44×44 each");
  line(parent, "Language / Active Underline", width - pad - (locale === "en" ? 23 : locale === "zh-Hans" ? 69 : 111), y + logoSize + 5, compact ? 19 : 23, COLORS.teal, 1, 2);
}

function createButton(parent, name, labelValue, x, y, width, height, primary) {
  const button = frame(parent, name, x, y, width, height, solid(primary ? COLORS.teal : COLORS.white, primary ? 1 : 0.58), Math.min(18, height / 2.7));
  button.strokes = primary ? [] : [solid(COLORS.teal, 0.9)];
  button.strokeWeight = primary ? 0 : 1.5;
  applyShadow(button, "card");
  text(button, "Label", labelValue, 12, height / 2 - 10, width - 24, Math.min(16, height * 0.28), "bold", primary ? COLORS.white : COLORS.tealDark, { lineHeight: 1.2, align: "CENTER" });
  return button;
}

function createPhone(parent, story, locale, x, y, width, options) {
  const settings = options || {};
  const height = width * 16 / 9;
  const shell = frame(parent, settings.name || `Phone / ${story.number} / ${locale}`, x, y, width, height, gradient([
    { position: 0, color: "#91a6a2", opacity: 1 },
    { position: 0.17, color: "#244846", opacity: 1 },
    { position: 0.5, color: "#0b2928", opacity: 1 },
    { position: 0.8, color: "#163a38", opacity: 1 },
    { position: 1, color: "#9eb0ad", opacity: 1 },
  ], 145), settings.radius || Math.max(20, width * 0.14));
  shell.clipsContent = true;
  shell.opacity = settings.opacity === undefined ? 1 : settings.opacity;
  shell.rotation = settings.rotation || 0;
  if (settings.blur) shell.effects = [{ type: "LAYER_BLUR", radius: settings.blur, visible: true }];
  else if (!settings.noShadow) applyShadow(shell, "phone");
  const inset = Math.max(5, width * 0.026);
  const variant = locale === "en" ? story.screenshots.en : story.screenshots.zh;
  const screen = rectangle(shell, "App Screenshot", inset, inset, width - inset * 2, height - inset * 2, imageFill(variant.image), Math.max(16, (settings.radius || width * 0.14) - inset));
  screen.setPluginData("alt", story.alt[locale] || story.alt["zh-Hant"]);
  shell.setPluginData("localeVariant", locale === "en" ? "en" : "zh");
  shell.setPluginData("screenshotSha256", variant.sha256);
  return shell;
}

function createStoryRail(parent, activeIndex, x, y, width, compact, locale) {
  const height = compact ? 82 : 92;
  const rail = frame(parent, "Story Rail", x, y, width, height, solid(COLORS.white, compact ? 0.82 : 0.66), compact ? 18 : 22);
  rail.strokes = [solid(COLORS.teal, 0.14)];
  rail.strokeWeight = 1;
  applyShadow(rail, "card");
  const slotWidth = width / 5;
  line(rail, "Story Track", slotWidth * 0.5, compact ? 27 : 31, width - slotWidth, COLORS.teal, 0.15, 1);
  DESIGN.stories.forEach((story, index) => {
    const active = index === activeIndex;
    const dotWidth = active ? (compact ? 56 : 72) : (compact ? 38 : 42);
    const dotX = slotWidth * index + (slotWidth - dotWidth) / 2;
    const dot = frame(rail, `Story ${story.number} / ${active ? "Active" : "Default"}`, dotX, compact ? 8 : 10, dotWidth, compact ? 38 : 42, active ? solid(COLORS.teal) : solid(COLORS.white, 0.7), 21);
    dot.strokes = active ? [] : [solid(COLORS.teal, 0.24)];
    dot.strokeWeight = active ? 0 : 1;
    text(dot, "Number", story.number, 0, compact ? 11 : 12, dotWidth, compact ? 11 : 12, "bold", active ? COLORS.white : COLORS.muted, { lineHeight: 1.1, align: "CENTER" });
    text(rail, "Story Label", story.label[locale] || story.label["zh-Hant"], slotWidth * index, compact ? 57 : 64, slotWidth, compact ? 9.5 : 11, "bold", active ? COLORS.teal : COLORS.muted, { lineHeight: 1.1, align: "CENTER" });
  });
  rail.setPluginData("interaction", "manual selection resets 10s dwell");
  return rail;
}

function createHero(parent, storyIndex, x, y, viewportName, locale) {
  const viewport = DESIGN.viewports[viewportName];
  const mobile = viewportName !== "desktop";
  const narrow = viewportName === "narrow";
  const story = DESIGN.stories[storyIndex];
  const hero = frame(parent, `01 Hero / ${viewport.width}×${viewport.height} / ${locale} / Story ${story.number}`, x, y, viewport.width, viewport.height, solid(COLORS.wind), 0);
  hero.clipsContent = true;
  hero.setPluginData("viewport", `${viewport.width}×${viewport.height}`);
  hero.setPluginData("storyId", story.id);
  hero.setPluginData("locale", locale);
  hero.setPluginData("desktopDownload", "scroll-to-#download");
  hero.setPluginData("mobileDownload", "direct-metadata.downloadUrl");
  setFrameBackground(hero);
  addWind(hero, viewport.width, viewport.height, false);
  createBrandRow(hero, viewport.width, mobile, locale);
  const titleLines = story.titleLines[locale] || story.titleLines["zh-Hant"];
  const description = story.description[locale] || story.description["zh-Hant"];
  if (mobile) {
    const pad = narrow ? 14 : 20;
    label(hero, locale === "en" ? "HONG KONG BUS APP" : "香港巴士出行 APP", pad, 72, viewport.width - pad * 2);
    const titleSize = locale === "en" ? (narrow ? 31 : 35) : (narrow ? 35 : 41);
    text(hero, "Hero Title", titleLines.join("\n"), pad, 97, viewport.width - pad * 2, titleSize, "bold", COLORS.ink, { lineHeight: locale === "en" ? 0.98 : 0.93, letterSpacing: locale === "en" ? -4 : -6.2 });
    text(hero, "Hero Description", description, pad, locale === "en" ? 178 : 184, viewport.width - pad * 2, locale === "en" ? 11.5 : 12.5, "regular", COLORS.muted, { lineHeight: 1.45 });
    const gap = 8;
    const actionWidth = (viewport.width - pad * 2 - gap) / 2;
    createButton(hero, "CTA / Download / Direct APK", locale === "en" ? "Download App  ↓" : "下載 Android App  ↓", pad, 222, actionWidth, 44, true);
    createButton(hero, "CTA / Route Trial", locale === "en" ? "Try routes  →" : "路線試查  →", pad + actionWidth + gap, 222, actionWidth, 44, false);
    text(hero, "APK Meta / No Date", "v1.3.1 · Android 7.1+ · 約 2.5 MB", pad, 274, viewport.width - pad * 2, 8.5, "medium", COLORS.muted, { lineHeight: 1.2, opacity: 0.76 });
    const activeWidth = narrow ? 186 : 204;
    const activeX = (viewport.width - activeWidth) / 2;
    const stageY = narrow ? 309 : 302;
    const farWidth = narrow ? 88 : 101;
    const backWidth = narrow ? 122 : 137;
    createPhone(hero, DESIGN.stories[(storyIndex + 3) % 5], locale, narrow ? 4 : 18, stageY + 72, farWidth, { opacity: 0.18, rotation: -10, noShadow: true, blur: 1.2 });
    createPhone(hero, DESIGN.stories[(storyIndex + 2) % 5], locale, viewport.width - farWidth - (narrow ? 4 : 18), stageY + 72, farWidth, { opacity: 0.18, rotation: 10, noShadow: true, blur: 1.2 });
    createPhone(hero, DESIGN.stories[(storyIndex + 4) % 5], locale, narrow ? -11 : -4, stageY + 35, backWidth, { opacity: 0.42, rotation: -6.5, noShadow: true, blur: 0.45 });
    createPhone(hero, DESIGN.stories[(storyIndex + 1) % 5], locale, viewport.width - backWidth + (narrow ? 11 : 4), stageY + 35, backWidth, { opacity: 0.44, rotation: 6.5, noShadow: true, blur: 0.45 });
    createPhone(hero, story, locale, activeX, stageY, activeWidth, { radius: narrow ? 30 : 34 });
    createStoryRail(hero, storyIndex, narrow ? 10 : 13, narrow ? 752 : 748, viewport.width - (narrow ? 20 : 26), true, locale);
  } else {
    label(hero, locale === "en" ? "HONG KONG BUS APP" : "香港巴士出行 APP", 82, 137, 470);
    const titleSize = locale === "en" ? 70 : 84;
    text(hero, "Hero Title", titleLines.join("\n"), 82, 177, locale === "en" ? 660 : 630, titleSize, "bold", COLORS.ink, { lineHeight: locale === "en" ? 1.01 : 0.94, letterSpacing: locale === "en" ? -4.5 : -7 });
    text(hero, "Hero Description", description, 82, 368, 610, locale === "en" ? 18 : 20, "regular", COLORS.muted, { lineHeight: 1.62 });
    createButton(hero, "CTA / Download / Scroll to Section 03", locale === "en" ? "Download Android App  ↓" : "下載 Android App  ↓", 82, 438, 224, 54, true);
    createButton(hero, "CTA / Route Trial", locale === "en" ? "Try route search  →" : "路線試查  →", 318, 438, 190, 54, false);
    text(hero, "APK Meta / No Date", "v1.3.1 · Android 7.1+ · 約 2.5 MB", 82, 507, 400, 11, "medium", COLORS.muted, { lineHeight: 1.2, opacity: 0.75 });
    createStoryRail(hero, storyIndex, 82, 747, 570, false, locale);
    createPhone(hero, DESIGN.stories[(storyIndex + 4) % 5], locale, 770, 219, 220, { opacity: 0.28, rotation: -9, noShadow: true, blur: 0.9 });
    createPhone(hero, DESIGN.stories[(storyIndex + 1) % 5], locale, 1156, 211, 210, { opacity: 0.26, rotation: 9, noShadow: true, blur: 0.9 });
    createPhone(hero, DESIGN.stories[(storyIndex + 3) % 5], locale, 832, 166, 260, { opacity: 0.45, rotation: -5.5, noShadow: true, blur: 0.35 });
    createPhone(hero, DESIGN.stories[(storyIndex + 2) % 5], locale, 1085, 160, 254, { opacity: 0.43, rotation: 5.5, noShadow: true, blur: 0.35 });
    createPhone(hero, story, locale, 930, 92, 330, { rotation: 2.5, radius: 54 });
    const note = frame(hero, "Desktop Context Note", 736, 690, 276, 134, solid(COLORS.white, 0.82), 22);
    note.strokes = [solid(COLORS.teal, 0.14)];
    applyShadow(note, "float");
    text(note, "Context Label", locale === "en" ? "THIS JOURNEY" : "本次行程", 20, 18, 232, 11, "medium", COLORS.muted, { lineHeight: 1.2 });
    text(note, "Context Value", locale === "en" ? "3 routes · compare now" : "3 條路線 · 即時比較", 20, 44, 236, locale === "en" ? 18 : 23, "bold", COLORS.teal, { lineHeight: 1.15, letterSpacing: -1.5 });
    text(note, "Context Detail", description, 20, 82, 236, 10.5, "regular", COLORS.muted, { lineHeight: 1.45 });
  }
  return hero;
}

function createMotionPhase(parent, phase, x, y) {
  const board = frame(parent, `02 Motion / ${phase.name}`, x, y, 390, 844, solid(COLORS.wind), 0);
  board.clipsContent = true;
  setFrameBackground(board);
  addWind(board, 390, 844, false);
  createBrandRow(board, 390, true, "zh-Hant");
  label(board, `MOTION · ${phase.label}`, 20, 72, 350);
  text(board, "Hero Title", phase.title, 20, 100, 350, 39, "bold", COLORS.ink, { lineHeight: 0.94, letterSpacing: -6, opacity: phase.textOpacity });
  text(board, "Timing", phase.timing, 20, 188, 350, 11, "medium", COLORS.teal, { lineHeight: 1.4 });
  const from = DESIGN.stories[0];
  const to = DESIGN.stories[1];
  createPhone(board, from, "zh-Hant", phase.fromX, 302 + phase.fromY, phase.fromWidth, { opacity: phase.fromOpacity, rotation: phase.fromRotation, noShadow: phase.fromOpacity < 0.7, blur: phase.fromBlur });
  createPhone(board, to, "zh-Hant", phase.toX, 302 + phase.toY, phase.toWidth, { opacity: phase.toOpacity, rotation: phase.toRotation, noShadow: phase.toOpacity < 0.7, blur: phase.toBlur });
  createStoryRail(board, phase.activeIndex, 13, 748, 364, true, "zh-Hant");
  board.setPluginData("timing", phase.timing);
  board.setPluginData("easing", DESIGN.motion.easing);
  return board;
}

function createRouteTrial(parent, state, x, y) {
  const board = frame(parent, `03 Route Trial / Mobile 390×844 / ${state}`, x, y, 390, 844, solid(COLORS.wind), 0);
  board.clipsContent = true;
  setFrameBackground(board);
  addWind(board, 390, 844, true);
  label(board, `ROUTE TRIAL · ${state.toUpperCase()}`, 20, 34, 350);
  text(board, "Title", "不用先下載，現在就試一程。", 20, 65, 350, 28, "bold", COLORS.ink, { lineHeight: 1.04, letterSpacing: -4 });
  text(board, "Description", "選擇起點和目的地，整理合適的巴士路線。", 20, 104, 350, 12, "regular", COLORS.muted, { lineHeight: 1.5 });
  const query = frame(board, "Query Panel", 16, 145, 358, 224, solid(COLORS.white, 0.72), 20);
  query.strokes = [solid(COLORS.teal, 0.14)];
  rectangle(query, "Origin", 16, 18, 278, 60, solid(COLORS.white, 0.9), 13).strokes = [solid(COLORS.teal, 0.14)];
  text(query, "Origin Label", "起點", 30, 29, 70, 9, "medium", COLORS.muted, { lineHeight: 1.1 });
  text(query, "Origin Value", "晨灣匯", 30, 49, 220, 14, "bold", COLORS.ink, { lineHeight: 1.1 });
  rectangle(query, "Destination", 16, 88, 278, 60, solid(COLORS.white, 0.9), 13).strokes = [solid(COLORS.teal, 0.14)];
  text(query, "Destination Label", "目的地", 30, 99, 70, 9, "medium", COLORS.muted, { lineHeight: 1.1 });
  text(query, "Destination Value", "澄岳坊", 30, 119, 220, 14, "bold", COLORS.ink, { lineHeight: 1.1 });
  const swap = frame(query, "Swap Origin and Destination / 44×44", 302, 61, 44, 44, solid(COLORS.white, 0.84), 14);
  swap.strokes = [solid(COLORS.teal, 0.24)];
  text(swap, "Swap Symbol", "⇅", 0, 12, 44, 17, "bold", COLORS.teal, { lineHeight: 1, align: "CENTER" });
  createButton(query, "Compare Routes", "比較巴士路線  →", 16, 164, 330, 44, true);
  const result = frame(board, "Route Result", 16, 389, 358, 421, solid(COLORS.white, 0.62), 20);
  result.strokes = [solid(COLORS.teal, 0.12)];
  if (state === "default") {
    text(result, "State Title", "路線會在這裡出現", 24, 80, 310, 19, "bold", COLORS.ink, { lineHeight: 1.2, align: "CENTER" });
    text(result, "State Copy", "選好起點和目的地後，便可比較候車、車費、耗時與步行距離。", 38, 121, 282, 11.5, "regular", COLORS.muted, { lineHeight: 1.6, align: "CENTER" });
  } else if (state === "candidates") {
    text(result, "Candidate Label", "選擇地點", 18, 18, 160, 10, "bold", COLORS.teal, { lineHeight: 1.2 });
    ["晨灣匯", "晨灣匯平台", "晨灣道"].forEach((value, index) => {
      const row = frame(result, `Candidate ${index + 1}`, 16, 50 + index * 72, 326, 58, solid(COLORS.white, 0.8), 12);
      row.strokes = [solid(COLORS.teal, index === 0 ? 0.38 : 0.12)];
      text(row, "Candidate Name", value, 14, 13, 230, 13, index === 0 ? "bold" : "medium", COLORS.ink, { lineHeight: 1.2 });
      text(row, "Candidate Type", index === 1 ? "巴士站" : "地點", 250, 15, 58, 9, "regular", COLORS.muted, { lineHeight: 1.2, align: "RIGHT" });
    });
  } else {
    text(result, "State Title", "路線暫時無法取得", 24, 74, 310, 19, "bold", COLORS.ink, { lineHeight: 1.2, align: "CENTER" });
    text(result, "State Copy", "你的起點和目的地仍然保留，可以稍後再試。", 38, 116, 282, 11.5, "regular", COLORS.muted, { lineHeight: 1.6, align: "CENTER" });
    createButton(result, "Retry", "再試一次", 94, 183, 170, 44, false);
  }
  return board;
}

function createQr(parent, x, y, size, muted) {
  const qr = frame(parent, muted ? "QR / Unavailable" : "QR / Ready", x, y, size, size, solid(COLORS.white, muted ? 0.4 : 0.92), 18);
  qr.strokes = [solid(COLORS.teal, muted ? 0.08 : 0.2)];
  const cells = [[1, 1, 6, 6], [12, 1, 6, 6], [1, 12, 6, 6], [9, 2, 2, 3], [8, 7, 4, 2], [13, 9, 2, 4], [8, 12, 2, 2], [11, 12, 3, 2], [15, 14, 3, 2], [8, 16, 3, 2], [12, 17, 2, 2], [16, 8, 2, 3]];
  const scale = (size - 20) / 19;
  cells.forEach((cell, index) => rectangle(qr, `QR Cell ${index + 1}`, 10 + cell[0] * scale, 10 + cell[1] * scale, cell[2] * scale, cell[3] * scale, solid(muted ? COLORS.disabled : COLORS.teal, muted ? 0.22 : 1), 1));
  qr.setPluginData("productionSource", "metadata.downloadUrl");
  return qr;
}

function createDownload(parent, viewportName, state, x, y) {
  const viewport = viewportName === "desktop" ? { width: 1440, height: 760 } : { width: 390, height: 700 };
  const mobile = viewportName !== "desktop";
  const board = frame(parent, `04 Download / ${viewportName} / ${state}`, x, y, viewport.width, viewport.height, solid(COLORS.wind), 0);
  board.clipsContent = true;
  setFrameBackground(board);
  addWind(board, viewport.width, viewport.height, state === "unavailable");
  const centerWidth = mobile ? 350 : 760;
  const left = (viewport.width - centerWidth) / 2;
  label(board, "ANDROID APK 下載", left, mobile ? 52 : 96, centerWidth);
  text(board, "Download Title", "路線找到了，把它帶在身邊。", left, mobile ? 85 : 134, centerWidth, mobile ? 36 : 58, "bold", COLORS.ink, { lineHeight: 1.08, letterSpacing: mobile ? -4 : -5, align: "CENTER" });
  text(board, "Download Description", "保存常用行程，沿途查看，出門前也能持續掌握時間。", left + (mobile ? 10 : 50), mobile ? 143 : 214, centerWidth - (mobile ? 20 : 100), mobile ? 12 : 17, "regular", COLORS.muted, { lineHeight: 1.55, align: "CENTER" });
  text(board, "Download Meta / No Date", state === "unavailable" ? "Android APK 暫時未能下載" : "v1.3.1 · Android 7.1+ · 約 2.5 MB", left, mobile ? 192 : 267, centerWidth, mobile ? 10 : 12, "medium", state === "unavailable" ? COLORS.disabled : COLORS.muted, { lineHeight: 1.3, align: "CENTER" });
  if (mobile) {
    createButton(board, "Download APK / Direct", state === "unavailable" ? "暫時無法下載" : "下載 BusIsComing  ↓", 32, 229, 326, 58, state !== "unavailable");
    text(board, "Mobile Behavior", "手機：直接使用 metadata.downloadUrl", 32, 303, 326, 10, "medium", COLORS.teal, { lineHeight: 1.3, align: "CENTER" });
    createPhone(board, DESIGN.stories[0], "zh-Hant", 115, 352, 160, { radius: 28 });
  } else {
    createQr(board, 558, 324, 188, state === "unavailable");
    text(board, "QR Label", state === "unavailable" ? "暫時沒有可用連結" : "手機掃描下載", 530, 528, 244, 12, "bold", state === "unavailable" ? COLORS.disabled : COLORS.teal, { lineHeight: 1.2, align: "CENTER" });
    createButton(board, "Download APK / Desktop Fallback", state === "unavailable" ? "暫時無法下載" : "下載 BusIsComing  ↓", 800, 360, 330, 68, state !== "unavailable");
    text(board, "Desktop Behavior", "桌面 Hero 先捲動至本區；QR、此按鈕與手機下載共用 metadata.downloadUrl", 800, 451, 330, 12, "medium", COLORS.tealDark, { lineHeight: 1.55, align: "CENTER" });
  }
  board.setPluginData("updatedDateVisible", "false");
  return board;
}

function createPrivacy(parent, viewportName, x, y) {
  const viewport = viewportName === "desktop" ? { width: 1440, height: 900 } : { width: 390, height: 844 };
  const mobile = viewportName !== "desktop";
  const board = frame(parent, `05 Privacy / ${viewportName}`, x, y, viewport.width, viewport.height, solid(COLORS.paper), 0);
  const pad = mobile ? 20 : 84;
  const logoSize = mobile ? 32 : 42;
  rectangle(board, "Brand / Real App Logo", pad, mobile ? 22 : 42, logoSize, logoSize, imageFill(DESIGN.brand.image), mobile ? 9 : 12);
  text(board, "Brand / Name", DESIGN.brand.name, pad + logoSize + 10, mobile ? 29 : 51, mobile ? 180 : 240, mobile ? 16 : 22, "bold", COLORS.ink, { lineHeight: 1 });
  text(board, "Back Home", "← 返回首頁", viewport.width - pad - (mobile ? 100 : 140), mobile ? 31 : 54, mobile ? 100 : 140, mobile ? 11 : 13, "bold", COLORS.teal, { lineHeight: 1.1, align: "RIGHT" });
  line(board, "Divider", pad, mobile ? 82 : 112, viewport.width - pad * 2, COLORS.teal, 0.13, 1);
  label(board, "PRIVACY", pad, mobile ? 120 : 172, viewport.width - pad * 2);
  text(board, "Title", "私隱政策", pad, mobile ? 153 : 214, viewport.width - pad * 2, mobile ? 42 : 64, "bold", COLORS.ink, { lineHeight: 1.05, letterSpacing: mobile ? -4 : -5 });
  text(board, "Lead", "我們重視你在使用 BusIsComing 網站與 App 時的資料選擇。", pad, mobile ? 219 : 303, viewport.width - pad * 2, mobile ? 13 : 18, "regular", COLORS.muted, { lineHeight: 1.6 });
  const bodyWidth = mobile ? viewport.width - pad * 2 : 860;
  const bodyY = mobile ? 282 : 390;
  [["01", "網站試查", "只處理完成本次巴士路線試查所需的資料。"], ["02", "下載", "版本與安裝包資料來自同一受管下載來源。"], ["03", "聯絡", "只有在你主動聯絡時才會收到你提供的內容。"]].forEach((item, index) => {
    const rowY = bodyY + index * (mobile ? 135 : 120);
    text(board, "Index", item[0], pad, rowY, 54, mobile ? 15 : 17, "bold", COLORS.teal, { lineHeight: 1.2 });
    text(board, "Heading", item[1], pad + 58, rowY, bodyWidth - 58, mobile ? 18 : 22, "bold", COLORS.ink, { lineHeight: 1.2 });
    text(board, "Body", item[2], pad + 58, rowY + 38, bodyWidth - 58, mobile ? 11.5 : 14, "regular", COLORS.muted, { lineHeight: 1.65 });
    line(board, "Body Divider", pad + 58, rowY + (mobile ? 101 : 88), bodyWidth - 58, COLORS.teal, 0.1, 1);
  });
  return board;
}

function createAssetMatrix(parent, x, y) {
  const board = frame(parent, "06 Localized Screenshot Matrix / zh-Hant + en", x, y, 2200, 1240, solid("#f7faf8"), 24);
  board.strokes = [solid(COLORS.teal, 0.13)];
  label(board, "LOCALIZED ASSETS", 42, 38, 900);
  text(board, "Title", "五個故事 × 中文／英文真實截圖", 42, 72, 1100, 38, "bold", COLORS.ink, { lineHeight: 1.1, letterSpacing: -3 });
  text(board, "Policy", "zh-Hant 與 en 建立像素級 reference；zh-Hans 共用中文截圖，只做文本、溢出與幾何驗收，不宣稱像素級 Figma 對照。", 42, 124, 1500, 14, "regular", COLORS.muted, { lineHeight: 1.6 });
  DESIGN.stories.forEach((story, index) => {
    const cellX = 42 + index * 420;
    text(board, "Story", `${story.number} · ${story.label["zh-Hant"]} / ${story.label.en}`, cellX, 206, 380, 14, "bold", COLORS.teal, { lineHeight: 1.2 });
    createPhone(board, story, "zh-Hant", cellX, 248, 170, { radius: 28, noShadow: true });
    createPhone(board, story, "en", cellX + 190, 248, 170, { radius: 28, noShadow: true });
    text(board, "Locale", "zh-Hant", cellX, 570, 170, 11, "medium", COLORS.muted, { lineHeight: 1.2, align: "CENTER" });
    text(board, "Locale", "en", cellX + 190, 570, 170, 11, "medium", COLORS.muted, { lineHeight: 1.2, align: "CENTER" });
  });
  const note = frame(board, "zh-Hans Acceptance Rule", 42, 680, 2050, 210, solid(COLORS.white, 0.8), 20);
  note.strokes = [solid(COLORS.teal, 0.15)];
  label(note, "ZH-HANS · NON-PIXEL ACCEPTANCE", 26, 24, 900);
  text(note, "Rule", "简体中文使用独立审校文本与中文截图集。浏览器验收覆盖：文案正确、无文本溢出、无横向滚动、核心几何与触控目标保持；不生成或声称 zh-Hans 像素级 Figma reference。", 26, 66, 1960, 18, "bold", COLORS.ink, { lineHeight: 1.55 });
  return board;
}

async function chooseFonts() {
  const available = await figma.listAvailableFontsAsync();
  const families = ["Noto Sans TC", "Noto Sans Traditional Chinese", "PingFang TC", "Inter"];
  let family = "Inter";
  for (const candidate of families) {
    if (available.some((font) => font.fontName.family === candidate)) {
      family = candidate;
      break;
    }
  }
  const styles = available.filter((font) => font.fontName.family === family).map((font) => font.fontName.style);
  const findStyle = (candidates) => candidates.find((candidate) => styles.includes(candidate)) || styles[0] || "Regular";
  const result = {
    regular: { family, style: findStyle(["Regular", "Normal"]) },
    medium: { family, style: findStyle(["Medium", "SemiBold", "Semi Bold", "Regular"]) },
    bold: { family, style: findStyle(["Bold", "Black", "SemiBold", "Semi Bold", "Medium", "Regular"]) },
  };
  await Promise.all([figma.loadFontAsync(result.regular), figma.loadFontAsync(result.medium), figma.loadFontAsync(result.bold)]);
  return result;
}

async function createImages() {
  const assets = {};
  for (const [name, encoded] of Object.entries(IMAGE_BASE64)) {
    try {
      assets[name] = figma.createImage(figma.base64Decode(encoded));
    } catch (error) {
      throw new Error(`无法创建 Figma image fill：${name}。${String(error)}`);
    }
  }
  return assets;
}

async function ensureVariableCollection(name) {
  const existing = (await figma.variables.getLocalVariableCollectionsAsync()).find((collection) => collection.name === name);
  return existing || figma.variables.createVariableCollection(name);
}

async function createLibrary(parent, x, y) {
  const board = frame(parent, "00 Refinement Library", x, y, 2000, 820, solid("#f7faf8"), 24);
  board.strokes = [solid(COLORS.teal, 0.14)];
  label(board, "REFINEMENT LIBRARY", 42, 38, 900);
  text(board, "Title", "015 共享 Token 與可編輯控件", 42, 73, 920, 36, "bold", COLORS.ink, { lineHeight: 1.1, letterSpacing: -3 });
  const collection = await ensureVariableCollection("BIC 015 / Refinement");
  const existingVariables = await figma.variables.getLocalVariablesAsync();
  for (const [name, value] of Object.entries(COLORS)) {
    let variable = existingVariables.find((candidate) => candidate.variableCollectionId === collection.id && candidate.name === `color/${name}`);
    if (!variable) variable = figma.variables.createVariable(`color/${name}`, collection, "COLOR");
    variable.setValueForMode(collection.modes[0].modeId, rgb(value));
  }
  for (const [name, value] of Object.entries(DESIGN.motion)) {
    if (typeof value !== "number") continue;
    let variable = existingVariables.find((candidate) => candidate.variableCollectionId === collection.id && candidate.name === `motion/${name}`);
    if (!variable) variable = figma.variables.createVariable(`motion/${name}`, collection, "FLOAT");
    variable.setValueForMode(collection.modes[0].modeId, value);
  }
  const buttons = [];
  [false, true].forEach((primary, index) => {
    const component = figma.createComponent();
    component.name = `Style=${primary ? "Primary" : "Secondary"}`;
    component.resize(224, 54);
    component.fills = [solid(primary ? COLORS.teal : COLORS.white, primary ? 1 : 0.62)];
    component.cornerRadius = 18;
    component.strokes = primary ? [] : [solid(COLORS.teal)];
    component.strokeWeight = primary ? 0 : 1;
    const labelNode = text(component, "Label", primary ? "下載 Android App" : "路線試查", 12, 17, 200, 14, "bold", primary ? COLORS.white : COLORS.teal, { lineHeight: 1.2, align: "CENTER" });
    const propertyKey = component.addComponentProperty("Label", "TEXT", labelNode.characters);
    labelNode.componentPropertyReferences = { characters: propertyKey };
    add(board, component, 42 + index * 260, 160);
    buttons.push(component);
  });
  const buttonSet = figma.combineAsVariants(buttons, board);
  buttonSet.name = "BIC 015/Button";
  buttonSet.children.forEach((child, index) => {
    child.x = 20 + index * 250;
    child.y = 20;
  });
  buttonSet.resizeWithoutConstraints(520, 94);
  buttonSet.x = 42;
  buttonSet.y = 160;
  Object.entries(COLORS).forEach(([name, value], index) => {
    const swatchX = 690 + (index % 5) * 240;
    const swatchY = 160 + Math.floor(index / 5) * 120;
    rectangle(board, `Color / ${name}`, swatchX, swatchY, 205, 64, solid(value), 13);
    text(board, "Token", `${name} · ${value.toUpperCase()}`, swatchX, swatchY + 73, 205, 10, "medium", COLORS.muted, { lineHeight: 1.2 });
  });
  text(board, "Motion Contract", "首次 10s · 自动 5s · 手动/语言/恢复 10s\n舞台 820ms · 文案延迟 160ms · cubic-bezier(.22,1,.36,1)\nreduced motion：停止自动轮播并即时手动切换", 42, 360, 560, 15, "medium", COLORS.ink, { lineHeight: 1.65 });
  text(board, "Implementation Lock", "无独立 Header · 真实 App Logo · 繁/简/EN 直达\n桌面 Hero 下载到第三屏 · 手机直接下载\n下载区不显示日期 · 路线交换按钮在双输入右侧\n流式响应式，不对整页 transform: scale()", 690, 445, 1100, 15, "medium", COLORS.ink, { lineHeight: 1.65 });
  return board;
}

function nextSectionPosition() {
  const rightEdges = figma.currentPage.children.map((node) => node.x + node.width).filter((value) => Number.isFinite(value));
  return { x: (rightEdges.length ? Math.max(...rightEdges) : 0) + 600, y: 80 };
}

async function generateFinalBoards() {
  const existing = figma.currentPage.findOne((node) => node.type === "SECTION" && node.name === FINAL_SECTION);
  if (existing) {
    figma.currentPage.selection = [existing];
    figma.viewport.scrollAndZoomIntoView([existing]);
    post("done", "015 FINAL Section 已存在", `Section Node ID: ${existing.id}。插件没有覆盖 014 或现有内容。`);
    return;
  }
  const stale = figma.currentPage.findOne((node) => node.type === "SECTION" && node.name === BUILDING_SECTION);
  if (stale) throw new Error(`发现未完成的 BUILDING Section（${stale.id}）。请人工核对后删除或重命名；插件不会自动删除。`);
  post("P1", "载入字体、真实 Logo 与双语截图", "验证后的素材只作为 image fill；不会记录一次性源目录。");
  FONT = await chooseFonts();
  ASSETS = await createImages();
  const position = nextSectionPosition();
  const root = figma.createSection();
  root.name = BUILDING_SECTION;
  root.x = position.x;
  root.y = position.y;
  root.resizeWithoutConstraints(7900, 7350);
  figma.currentPage.appendChild(root);
  root.setPluginData("version", DESIGN.version);
  root.setPluginData("approvedAt", DESIGN.approvedAt);
  root.setPluginData("baselineSectionNode", DESIGN.baselineSectionNode);
  root.setPluginData("generator", "BusIsComing 015 local Figma plugin");
  post("P2", "生成 015 设计库与关键首屏", "不覆盖 014；桌面、手机、窄屏均使用批准构图。");
  const library = await createLibrary(root, 80, 80);
  const desktopZh = createHero(root, 0, 2140, 80, "desktop", "zh-Hant");
  const desktopEn = createHero(root, 0, 3640, 80, "desktop", "en");
  const mobileZh = createHero(root, 0, 5140, 80, "mobile", "zh-Hant");
  const narrowZh = createHero(root, 0, 5580, 80, "narrow", "zh-Hant");
  post("P3", "生成环形转场与交互状态", "静态 storyboard 表达 start / +160ms / settled；实现按标注时序。");
  const phases = [
    { name: "Start", label: "START · 0MS", timing: "Story 01 前景；Story 02 位于右后方", title: "隨心搜尋，\n出發更輕鬆", textOpacity: 1, fromX: 93, fromY: 0, fromWidth: 204, fromOpacity: 1, fromRotation: 0, fromBlur: 0, toX: 268, toY: 54, toWidth: 122, toOpacity: 0.38, toRotation: 7, toBlur: 0.5, activeIndex: 1 },
    { name: "Plus 160ms", label: "+160MS", timing: "舞台已先行；旧文案开始上移淡出", title: "隨心搜尋，\n出發更輕鬆", textOpacity: 0.48, fromX: 45, fromY: 35, fromWidth: 150, fromOpacity: 0.52, fromRotation: -5.5, fromBlur: 0.4, toX: 172, toY: 10, toWidth: 182, toOpacity: 0.8, toRotation: 2.5, toBlur: 0, activeIndex: 1 },
    { name: "Settled", label: "SETTLED · 820MS", timing: "Story 02 前景；新文案完成进入后开始 10s/5s 停留计时", title: "常走的路，\n一按更省心", textOpacity: 1, fromX: -4, fromY: 42, fromWidth: 137, fromOpacity: 0.42, fromRotation: -6.5, fromBlur: 0.45, toX: 93, toY: 0, toWidth: 204, toOpacity: 1, toRotation: 0, toBlur: 0, activeIndex: 1 },
  ];
  const motionStart = createMotionPhase(root, phases[0], 80, 1100);
  const motion160 = createMotionPhase(root, phases[1], 520, 1100);
  const motionSettled = createMotionPhase(root, phases[2], 960, 1100);
  const routeDefault = createRouteTrial(root, "default", 1400, 1100);
  const routeCandidates = createRouteTrial(root, "candidates", 1840, 1100);
  const routeError = createRouteTrial(root, "error", 2280, 1100);
  const downloadDesktop = createDownload(root, "desktop", "ready", 80, 2000);
  const downloadMobile = createDownload(root, "mobile", "ready", 1580, 2000);
  const downloadUnavailable = createDownload(root, "desktop", "unavailable", 2020, 2000);
  const privacyDesktop = createPrivacy(root, "desktop", 3520, 2000);
  const privacyMobile = createPrivacy(root, "mobile", 5020, 2000);
  post("P4", "生成五故事双语素材矩阵", "zh-Hant/en 是像素 reference；zh-Hans 仅记录文本、溢出和几何验收规则。");
  const assetMatrix = createAssetMatrix(root, 80, 2960);
  DESIGN.stories.slice(1).forEach((story, index) => createHero(root, index + 1, 2340 + index * 450, 2960, "mobile", "zh-Hant"));
  DESIGN.stories.slice(1).forEach((story, index) => createHero(root, index + 1, 2340 + index * 450, 3860, "mobile", "en"));
  const indexBoard = frame(root, "Delivery Index", 80, 4280, 4200, 830, solid("#f7faf8"), 24);
  indexBoard.strokes = [solid(COLORS.teal, 0.14)];
  label(indexBoard, "DELIVERY INDEX", 42, 38, 1000);
  text(indexBoard, "Title", "015 Figma 设计与 UX 锁定", 42, 73, 1200, 38, "bold", COLORS.ink, { lineHeight: 1.1, letterSpacing: -3 });
  const indexLines = [
    `Library ${library.id}`,
    `Desktop zh-Hant Story 01 ${desktopZh.id}`,
    `Desktop en Story 01 ${desktopEn.id}`,
    `Mobile 390 zh-Hant Story 01 ${mobileZh.id}`,
    `Narrow 320 zh-Hant Story 01 ${narrowZh.id}`,
    `Motion start / +160ms / settled ${motionStart.id} / ${motion160.id} / ${motionSettled.id}`,
    `Route default / candidates / error ${routeDefault.id} / ${routeCandidates.id} / ${routeError.id}`,
    `Download desktop / mobile / unavailable ${downloadDesktop.id} / ${downloadMobile.id} / ${downloadUnavailable.id}`,
    `Privacy desktop / mobile ${privacyDesktop.id} / ${privacyMobile.id}`,
    `Localized screenshot matrix ${assetMatrix.id}`,
  ];
  indexLines.forEach((value, index) => text(indexBoard, "Index Item", value, 42 + (index % 2) * 2020, 155 + Math.floor(index / 2) * 100, 1920, 16, "medium", index < 2 ? COLORS.teal : COLORS.ink, { lineHeight: 1.4 }));
  text(indexBoard, "I1", "I1：桌面 Hero 的下载行为是本轮有意变更；路线业务与最终下载目标保持不变。", 42, 690, 1920, 14, "bold", COLORS.ink, { lineHeight: 1.5 });
  text(indexBoard, "I2", "I2：zh-Hans 不建立像素级 Figma reference，只做文本、溢出与几何验收。", 2062, 690, 1920, 14, "bold", COLORS.ink, { lineHeight: 1.5 });
  root.name = FINAL_SECTION;
  root.resizeWithoutConstraints(7900, 5200);
  figma.currentPage.selection = [root];
  figma.viewport.scrollAndZoomIntoView([root]);
  post("done", "015 Figma Section 已生成", `Section Node ID: ${root.id}\nDesktop zh-Hant: ${desktopZh.id}\nDesktop en: ${desktopEn.id}\nMobile 390: ${mobileZh.id}\nNarrow 320: ${narrowZh.id}\nMotion: ${motionStart.id}, ${motion160.id}, ${motionSettled.id}\nRoute: ${routeDefault.id}, ${routeCandidates.id}, ${routeError.id}\nDownload: ${downloadDesktop.id}, ${downloadMobile.id}, ${downloadUnavailable.id}\nPrivacy: ${privacyDesktop.id}, ${privacyMobile.id}\nLocalized assets: ${assetMatrix.id}`);
  figma.notify("Homepage refinement 015 已生成", { timeout: 6000 });
}

figma.ui.onmessage = async (message) => {
  if (message.type === "generate") {
    try {
      await generateFinalBoards();
    } catch (error) {
      const detail = error && error.stack ? error.stack : String(error);
      post("error", "生成失败", detail);
      figma.notify("015 生成失败，请查看插件详情", { error: true, timeout: 7000 });
    }
  }
  if (message.type === "close") figma.closePlugin();
};
