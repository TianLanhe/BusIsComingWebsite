const DESIGN = __DESIGN_CONTRACT__;
const IMAGE_BASE64 = __IMAGE_BASE64__;

figma.showUI(__html__, { width: 420, height: 520, themeColors: true });

const FINAL_SECTION = DESIGN.finalSectionName;
const BUILDING_SECTION = `${FINAL_SECTION} — BUILDING`;
const COLORS = DESIGN.tokens.colors;
let FONT = null;
let ASSETS = null;
let SYSTEM = null;

function post(stage, message, detail) {
  figma.ui.postMessage({ type: "progress", stage, message, detail: detail || "" });
}

function hex(hexValue, alpha) {
  const clean = hexValue.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
    a: alpha === undefined ? 1 : alpha,
  };
}

function solid(color, opacity) {
  const value = hex(color, opacity);
  return { type: "SOLID", color: { r: value.r, g: value.g, b: value.b }, opacity: value.a };
}

function linearGradient(stops, rotation) {
  const angle = ((rotation || 0) * Math.PI) / 180;
  const cos = Math.cos(angle) / 2;
  const sin = Math.sin(angle) / 2;
  return {
    type: "GRADIENT_LINEAR",
    gradientTransform: [
      [cos, sin, 0.5 - cos / 2 - sin / 2],
      [-sin, cos, 0.5 + sin / 2 - cos / 2],
    ],
    gradientStops: stops.map((stop) => ({ position: stop.position, color: hex(stop.color, stop.opacity) })),
  };
}

function noFill(node) {
  node.fills = [];
}

function setRadius(node, value) {
  node.cornerRadius = value;
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
  if (radius !== undefined) setRadius(node, radius);
  return add(parent, node, x, y);
}

function rectangle(parent, name, x, y, width, height, fill, radius) {
  const node = figma.createRectangle();
  node.name = name;
  node.resize(width, height);
  node.fills = fill ? (Array.isArray(fill) ? fill : [fill]) : [];
  if (radius !== undefined) setRadius(node, radius);
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
  node.lineHeight = { value: settings.lineHeight || 1.3, unit: "PERCENT" };
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

function sectionTitle(parent, index, titleValue, subtitle, x, y, width) {
  label(parent, index, x, y, width);
  text(parent, "Section Title", titleValue, x, y + 28, width, 32, "bold", COLORS.ink, { lineHeight: 1.08, letterSpacing: -3 });
  text(parent, "Section Description", subtitle, x, y + 74, width, 13, "regular", COLORS.muted, { lineHeight: 1.6 });
}

function applyShadow(node, kind) {
  const spec = kind === "phone"
    ? { x: 0, y: 28, blur: 60, spread: 0, alpha: 0.24 }
    : kind === "float"
      ? { x: 0, y: 24, blur: 58, spread: 0, alpha: 0.16 }
      : { x: 0, y: 10, blur: 28, spread: 0, alpha: 0.075 };
  node.effects = [{
    type: "DROP_SHADOW",
    color: { r: 0.03, g: 0.18, b: 0.17, a: spec.alpha },
    offset: { x: spec.x, y: spec.y },
    radius: spec.blur,
    spread: spec.spread,
    visible: true,
    blendMode: "NORMAL",
  }];
}

function addWind(parent, width, height, quiet) {
  const strength = quiet ? 0.52 : 1;
  const far = ellipse(parent, "Wind / Far", -width * 0.18, -height * 0.2, width * 1.36, height * 0.5, solid(COLORS.white, 0.38), 0.55 * strength);
  far.strokes = [solid(COLORS.white, 0.54 * strength)];
  far.strokeWeight = Math.max(34, width * 0.07);
  noFill(far);
  const back = ellipse(parent, "Wind / Back", width * 0.45, height * 0.08, width * 0.9, height * 0.42, solid(COLORS.teal, 0.08), 0.34 * strength);
  back.strokes = [solid(COLORS.teal, 0.11 * strength)];
  back.strokeWeight = Math.max(24, width * 0.05);
  noFill(back);
  ellipse(parent, "Wind / Mid", -width * 0.15, height * 0.38, width * 1.35, height * 0.22, solid(COLORS.white, 0.66), 0.8 * strength);
  ellipse(parent, "Wind / Near", -width * 0.1, height * 0.78, width * 1.25, height * 0.26, solid(COLORS.white, 0.74), 0.72 * strength);
  ellipse(parent, "Wind / Glow", width * 0.46, height * 0.57, width * 0.7, height * 0.28, solid(COLORS.pale, 0.46), 0.8 * strength);
}

function createBrand(parent, x, y, mobile) {
  const size = mobile ? 26 : 34;
  const mark = frame(parent, "Brand / Mark", x, y, size, size, solid(COLORS.teal), mobile ? 8 : 10);
  mark.clipsContent = true;
  const barWidth = mobile ? 3.8 : 5;
  const gap = mobile ? 2.4 : 3;
  const start = mobile ? 5.2 : 7;
  const heights = mobile ? [8, 15, 11] : [9, 18, 13];
  heights.forEach((barHeight, index) => {
    rectangle(mark, `Bar ${index + 1}`, start + index * (barWidth + gap), size - start - barHeight, barWidth, barHeight, solid(COLORS.white), barWidth / 2);
  });
  text(parent, "Brand / Name", "BusIsComing", x + size + (mobile ? 5 : 11), y + (mobile ? 6 : 5), mobile ? 100 : 150, mobile ? 13 : 20, "bold", COLORS.ink, { lineHeight: 1 });
}

function createHeader(parent, width, mobile) {
  const height = mobile ? 58 : 82;
  const pad = mobile ? 14 : 64;
  createBrand(parent, pad, mobile ? 16 : 24, mobile);
  const labels = DESIGN.navigation;
  if (mobile) {
    const starts = [244, 270, 316, 360];
    const widths = [22, 42, 42, 24];
    labels.forEach((item, index) => text(parent, `Navigation / ${item}`, item, starts[index], 25, widths[index], 7.4, "bold", COLORS.tealDark, { lineHeight: 1.1, align: "CENTER" }));
  } else {
    const starts = [1030, 1093, 1183, 1282];
    const widths = [46, 78, 78, 64];
    labels.forEach((item, index) => {
      const node = text(parent, `Navigation / ${item}`, item, starts[index], 34, widths[index], 13, "bold", COLORS.tealDark, { lineHeight: 1.1, align: "CENTER" });
      if (index === 3) {
        const trigger = frame(parent, "Language Trigger", starts[index] - 8, 21, 72, 40, solid(COLORS.white, 0.5), 11);
        trigger.strokes = [solid(COLORS.teal, 0.18)];
        trigger.strokeWeight = 1;
        trigger.insertChild(0, node);
        node.x = 8;
        node.y = 13;
      }
    });
  }
  line(parent, "Header Divider", pad, height - 1, width - pad * 2, COLORS.tealDark, 0.12, 1);
}

function createButtonInstance(parent, style, state, labelValue, x, y, width, height) {
  const component = SYSTEM.buttonComponents[`${style}-${state}`] || SYSTEM.buttonComponents[`${style}-default`];
  const instance = component.createInstance();
  instance.name = `Button / ${style} / ${state} / ${labelValue}`;
  instance.resize(width, height);
  const labelNode = instance.findOne((node) => node.type === "TEXT" && node.name === "Label");
  if (labelNode) labelNode.characters = labelValue;
  return add(parent, instance, x, y);
}

function createStoryRail(parent, activeIndex, x, y, width, mobile) {
  const height = mobile ? 88 : 88;
  const rail = frame(parent, "Story Rail", x, y, width, height, solid(COLORS.white, mobile ? 0.78 : 0.62), mobile ? 18 : 22);
  rail.strokes = [solid(COLORS.teal, 0.14)];
  rail.strokeWeight = 1;
  applyShadow(rail, "card");
  const slotWidth = width / 5;
  line(rail, "Story Track", slotWidth * 0.5, mobile ? 26 : 30, width - slotWidth, COLORS.teal, 0.15, 1);
  DESIGN.stories.forEach((story, index) => {
    const component = index === activeIndex ? SYSTEM.storyTabComponents.active : SYSTEM.storyTabComponents.default;
    const instance = component.createInstance();
    instance.name = `Story ${story.id} / ${story.label} / ${index === activeIndex ? "Active" : "Default"}`;
    instance.resize(slotWidth, height - 10);
    const number = instance.findOne((node) => node.type === "TEXT" && node.name === "Number");
    const labelNode = instance.findOne((node) => node.type === "TEXT" && node.name === "Label");
    if (number) number.characters = story.id;
    if (labelNode) labelNode.characters = story.label;
    add(rail, instance, slotWidth * index, 5);
  });
  return rail;
}

function imageFill(imageKey) {
  return { type: "IMAGE", imageHash: ASSETS[imageKey].hash, scaleMode: "FILL" };
}

function createPhone(parent, story, x, y, width, options) {
  const settings = options || {};
  const aspect = 1080 / 2172;
  const height = settings.height || width / aspect;
  const shell = frame(parent, settings.name || `Phone / ${story.id}`, x, y, width, height, linearGradient([
    { position: 0, color: "#8aa19d", opacity: 1 },
    { position: 0.18, color: "#244846", opacity: 1 },
    { position: 0.52, color: "#0b2928", opacity: 1 },
    { position: 0.78, color: "#163a38", opacity: 1 },
    { position: 1, color: "#91a6a2", opacity: 1 },
  ], 145), settings.radius || Math.max(22, width * 0.16));
  shell.clipsContent = true;
  shell.opacity = settings.opacity === undefined ? 1 : settings.opacity;
  shell.rotation = settings.rotation || 0;
  if (!settings.noShadow) applyShadow(shell, "phone");
  const inset = settings.inset || Math.max(5, width * 0.026);
  const screen = rectangle(shell, "App Screenshot", inset, inset, width - inset * 2, height - inset * 2, imageFill(story.image), Math.max(17, (settings.radius || width * 0.16) - inset));
  screen.setPluginData("alt", story.alt);
  return shell;
}

function heroBackground(parent, width, height) {
  parent.fills = [linearGradient([
    { position: 0, color: "#d4e9e4", opacity: 1 },
    { position: 0.52, color: "#edf6f2", opacity: 1 },
    { position: 1, color: "#cfe7e1", opacity: 1 },
  ], 145)];
  addWind(parent, width, height, false);
}

function createHero(parent, storyIndex, x, y, mobile) {
  const viewport = mobile ? DESIGN.viewports.mobile : DESIGN.viewports.desktop;
  const story = DESIGN.stories[storyIndex];
  const hero = frame(parent, `01 Hero / ${mobile ? "Mobile 390×844" : "Desktop 1440×960"} / Story ${story.id}`, x, y, viewport.width, viewport.height, solid(COLORS.wind), mobile ? 0 : 0);
  hero.clipsContent = true;
  hero.setPluginData("viewport", `${viewport.width}×${viewport.height}`);
  hero.setPluginData("story", story.id);
  heroBackground(hero, viewport.width, viewport.height);
  createHeader(hero, viewport.width, mobile);

  if (mobile) {
    label(hero, "香港巴士出行 APP", 20, 73, 240);
    text(hero, "Hero Title", story.titleLines.join("\n"), 20, 98, 350, 41, "bold", COLORS.ink, { lineHeight: 0.93, letterSpacing: -6.5 });
    text(hero, "Hero Description", `${story.description}。`, 20, 184, 350, 12.5, "regular", COLORS.muted, { lineHeight: 1.45 });
    createButtonInstance(hero, "Primary", "default", "下載 Android App  ↓", 20, 218, 190, 42);
    createButtonInstance(hero, "Secondary", "default", "路線試查  →", 217, 218, 153, 42);
    text(hero, "APK Meta", "v1.3.1 · Android 7.1+ · 約 2.5 MB", 20, 268, 300, 8.5, "medium", COLORS.muted, { lineHeight: 1.2, opacity: 0.78 });

    const backLeft = DESIGN.stories[(storyIndex + 4) % 5];
    const backRight = DESIGN.stories[(storyIndex + 1) % 5];
    const farLeft = DESIGN.stories[(storyIndex + 3) % 5];
    const farRight = DESIGN.stories[(storyIndex + 2) % 5];
    createPhone(hero, farLeft, 28, 350, 104, { opacity: 0.27, rotation: -8, noShadow: true, radius: 24 });
    createPhone(hero, farRight, 258, 347, 104, { opacity: 0.27, rotation: 8, noShadow: true, radius: 24 });
    createPhone(hero, backLeft, 8, 326, 139, { opacity: 0.52, rotation: -5.5, radius: 31 });
    createPhone(hero, backRight, 243, 324, 139, { opacity: 0.55, rotation: 5.5, radius: 31 });
    createPhone(hero, story, 88, 300, 214, { radius: 36 });
    createStoryRail(hero, storyIndex, 13, 748, 364, true);
  } else {
    label(hero, "香港巴士出行 APP", 82, 154, 360);
    text(hero, "Hero Title", story.titleLines.join("\n"), 82, 191, 650, 84, "bold", COLORS.ink, { lineHeight: 0.94, letterSpacing: -7 });
    text(hero, "Hero Description", `${story.description}。`, 82, 384, 520, 20, "regular", COLORS.muted, { lineHeight: 1.72 });
    createButtonInstance(hero, "Primary", "default", "下載 Android App  ↓", 82, 449, 214, 52);
    createButtonInstance(hero, "Secondary", "default", "路線試查  →", 307, 449, 176, 52);
    text(hero, "APK Meta", "v1.3.1 · Android 7.1+ · 約 2.5 MB", 82, 514, 340, 11, "medium", COLORS.muted, { lineHeight: 1.2, opacity: 0.75 });
    createStoryRail(hero, storyIndex, 82, 754, 570, false);

    const backLeft = DESIGN.stories[(storyIndex + 4) % 5];
    const backRight = DESIGN.stories[(storyIndex + 1) % 5];
    createPhone(hero, backLeft, 785, 184, 244, { opacity: 0.34, rotation: -7, noShadow: true, radius: 44 });
    createPhone(hero, backRight, 1125, 170, 238, { opacity: 0.32, rotation: 7, noShadow: true, radius: 43 });
    createPhone(hero, story, 920, 112, 356, { rotation: 4.5, radius: 58 });

    const detail = frame(hero, "Desktop Context Note", 742, 688, 274, 142, solid(COLORS.white, 0.82), 24);
    detail.strokes = [solid(COLORS.teal, 0.16)];
    detail.strokeWeight = 1;
    applyShadow(detail, "float");
    text(detail, "Context Label", story.id === "04" ? "首程班次" : "本次行程", 22, 20, 220, 12, "regular", COLORS.muted, { lineHeight: 1.2 });
    text(detail, "Context Value", story.id === "04" ? "6、11、18、27 分鐘" : "3 條路線 · 即時比較", 22, 47, 230, 24, "bold", COLORS.teal, { lineHeight: 1.1, letterSpacing: -2 });
    text(detail, "Context Detail", story.description, 22, 90, 225, 11, "regular", COLORS.muted, { lineHeight: 1.55 });
  }
  return hero;
}

function createRouteCardInstance(parent, data, x, y, width) {
  const instance = SYSTEM.routeCard.createInstance();
  instance.name = `Route Card / ${data.route}`;
  if (width < 420) instance.rescale(width / 440);
  else instance.resize(width, 116);
  const map = {
    Route: data.route,
    Stops: data.stops,
    Wait: data.wait,
    Fare: data.fare,
    Duration: data.duration,
    Walk: data.walk,
  };
  instance.findAll((node) => node.type === "TEXT").forEach((node) => {
    if (map[node.name]) node.characters = map[node.name];
  });
  return add(parent, instance, x, y);
}

function drawRouteResult(parent, state, x, y, width, height, mobile) {
  const result = frame(parent, `Result / ${state}`, x, y, width, height, solid("#f1f8f5", 0.74), mobile ? 18 : 0);
  text(result, "Result Eyebrow", "即時比較", mobile ? 16 : 26, 20, width * 0.55, mobile ? 9 : 10, "bold", COLORS.muted, { lineHeight: 1.2, letterSpacing: 6 });
  text(result, "Result Route", "晨灣匯 → 澄岳坊", mobile ? 16 : 26, 43, width * 0.55, mobile ? 16 : 21, "bold", COLORS.ink, { lineHeight: 1.2, letterSpacing: -2 });
  const stateCopy = DESIGN.routeStateCopy[state];
  text(result, "Result Count", state === "success" ? "3 條路線" : state === "retained" ? "暫未更新 · 3 條路線" : state === "loading" ? "正在整理" : state === "empty" ? "0 條路線" : "", width * 0.62, 36, width * 0.32, mobile ? 9 : 11, "bold", COLORS.teal, { lineHeight: 1.2, align: "RIGHT" });
  line(result, "Toolbar Divider", mobile ? 16 : 26, 77, width - (mobile ? 32 : 52), COLORS.teal, 0.11, 1);

  if (state === "success" || state === "retained") {
    const cardWidth = width - (mobile ? 32 : 52);
    DESIGN.routeCards.forEach((card, index) => createRouteCardInstance(result, card, mobile ? 16 : 26, 96 + index * (mobile ? 92 : 128), cardWidth));
  } else if (state === "loading") {
    for (let index = 0; index < 3; index += 1) {
      const skeleton = frame(result, `Skeleton ${index + 1}`, mobile ? 16 : 26, 96 + index * 128, width - (mobile ? 32 : 52), 112, solid(COLORS.white, 0.72), 16);
      rectangle(skeleton, "Skeleton Route", 16, 17, 92, 15, solid(COLORS.pale), 8);
      rectangle(skeleton, "Skeleton Detail", 16, 48, skeleton.width * 0.62, 10, solid(COLORS.pale, 0.72), 6);
      rectangle(skeleton, "Skeleton Metric", 16, 82, skeleton.width * 0.76, 9, solid(COLORS.pale, 0.56), 6);
    }
  } else {
    ellipse(result, "State Mark", width / 2 - 30, 150, 60, 60, solid(COLORS.white, 0.45), 1).strokes = [solid(COLORS.teal, 0.2)];
    text(result, "State Title", stateCopy[0], width * 0.12, 234, width * 0.76, mobile ? 15 : 18, "bold", COLORS.ink, { lineHeight: 1.2, align: "CENTER" });
    text(result, "State Description", stateCopy[1], width * 0.14, 268, width * 0.72, mobile ? 10.5 : 12, "regular", COLORS.muted, { lineHeight: 1.62, align: "CENTER" });
    if (state === "empty" || state === "error") {
      createButtonInstance(result, "Secondary", "default", state === "empty" ? "重新選擇地點" : "再試一次", width / 2 - 74, 333, 148, 40);
    }
  }
  return result;
}

function createRouteState(parent, state, x, y, mobile) {
  const width = mobile ? 390 : 820;
  const height = mobile ? 720 : 620;
  const board = frame(parent, `02 Route Trial / ${mobile ? "Mobile" : "Desktop"} / ${state}`, x, y, width, height, linearGradient([
    { position: 0, color: "#f8fbf9", opacity: 1 },
    { position: 0.5, color: "#e9f4f0", opacity: 1 },
    { position: 1, color: "#d9ece7", opacity: 1 },
  ], 155), 0);
  board.clipsContent = true;
  addWind(board, width, height, true);
  const stateTag = frame(board, "State Tag", 18, 16, mobile ? 118 : 150, 28, solid(COLORS.teal), 14);
  text(stateTag, "State Name", `STATE / ${state.toUpperCase()}`, 10, 8, stateTag.width - 20, 8, "bold", COLORS.white, { lineHeight: 1, letterSpacing: 8, align: "CENTER" });
  if (mobile) {
    text(board, "Route Title", "不用先下載，現在就試一程。", 18, 60, 354, 27, "bold", COLORS.ink, { lineHeight: 1.06, letterSpacing: -4 });
    const query = frame(board, "Query Panel", 16, 109, 358, 196, solid(COLORS.white, 0.72), 20);
    query.strokes = [solid(COLORS.teal, 0.13)];
    text(query, "Query Prompt", "你想去哪裡？", 16, 16, 300, 17, "bold", COLORS.ink, { lineHeight: 1.2 });
    rectangle(query, "Origin", 16, 49, 326, 47, solid(COLORS.white, 0.88), 12).strokes = [solid(COLORS.teal, 0.13)];
    text(query, "Origin Text", "起點  晨灣匯", 30, 64, 260, 11, "medium", COLORS.ink, { lineHeight: 1.2 });
    rectangle(query, "Destination", 16, 103, 326, 47, solid(COLORS.white, 0.88), 12).strokes = [solid(COLORS.teal, 0.13)];
    text(query, "Destination Text", "目的地  澄岳坊", 30, 118, 260, 11, "medium", COLORS.ink, { lineHeight: 1.2 });
    createButtonInstance(query, "Primary", "default", "比較巴士路線  →", 16, 158, 326, 32);
    drawRouteResult(board, state, 16, 321, 358, 383, true);
  } else {
    text(board, "Route Title", "不用先下載，現在就試一程。", 32, 65, 730, 42, "bold", COLORS.ink, { lineHeight: 1.03, letterSpacing: -5 });
    const workbench = frame(board, "Route Workbench", 32, 128, 756, 460, solid(COLORS.white, 0.72), 28);
    workbench.strokes = [solid(COLORS.teal, 0.16)];
    workbench.strokeWeight = 1;
    applyShadow(workbench, "card");
    const query = frame(workbench, "Query Panel", 0, 0, 286, 460, linearGradient([
      { position: 0, color: COLORS.white, opacity: 0.9 },
      { position: 1, color: COLORS.pale, opacity: 0.7 },
    ], 155), 28);
    text(query, "Query Index", "01 / SET YOUR JOURNEY", 24, 26, 220, 9, "bold", COLORS.teal, { lineHeight: 1.2, letterSpacing: 12 });
    text(query, "Query Prompt", "你想去哪裡？", 24, 53, 230, 24, "bold", COLORS.ink, { lineHeight: 1.2, letterSpacing: -3 });
    text(query, "Query Intro", "選擇起點和目的地，整理合適的巴士路線。", 24, 91, 230, 10.5, "regular", COLORS.muted, { lineHeight: 1.55 });
    rectangle(query, "Origin", 24, 139, 238, 65, solid(COLORS.white, 0.86), 15).strokes = [solid(COLORS.teal, 0.14)];
    text(query, "Origin Label", "起點", 40, 151, 60, 9, "medium", COLORS.muted, { lineHeight: 1.1 });
    text(query, "Origin Value", "晨灣匯", 40, 171, 150, 14, "bold", COLORS.ink, { lineHeight: 1.1 });
    rectangle(query, "Destination", 24, 215, 238, 65, solid(COLORS.white, 0.86), 15).strokes = [solid(COLORS.teal, 0.14)];
    text(query, "Destination Label", "目的地", 40, 227, 60, 9, "medium", COLORS.muted, { lineHeight: 1.1 });
    text(query, "Destination Value", "澄岳坊", 40, 247, 150, 14, "bold", COLORS.ink, { lineHeight: 1.1 });
    createButtonInstance(query, "Primary", "default", "比較巴士路線  →", 24, 302, 238, 48);
    text(query, "Privacy Note", "✓ 試查資料只用於本次查詢。", 24, 373, 230, 9.5, "regular", COLORS.muted, { lineHeight: 1.5 });
    drawRouteResult(workbench, state, 286, 0, 470, 460, false);
  }
  return board;
}

function createQr(parent, x, y, size, muted) {
  const qr = frame(parent, muted ? "QR / Hidden" : "QR / Ready", x, y, size, size, solid(COLORS.white, muted ? 0.38 : 0.9), 14);
  qr.strokes = [solid(COLORS.teal, muted ? 0.08 : 0.2)];
  qr.strokeWeight = 1;
  const cells = [
    [1, 1, 6, 6], [12, 1, 6, 6], [1, 12, 6, 6], [9, 2, 2, 3], [8, 7, 4, 2], [13, 9, 2, 4],
    [8, 12, 2, 2], [11, 12, 3, 2], [15, 14, 3, 2], [8, 16, 3, 2], [12, 17, 2, 2], [16, 8, 2, 3],
  ];
  const scale = (size - 20) / 19;
  cells.forEach((cell, index) => rectangle(qr, `QR Cell ${index + 1}`, 10 + cell[0] * scale, 10 + cell[1] * scale, cell[2] * scale, cell[3] * scale, solid(muted ? COLORS.disabled : COLORS.teal, muted ? 0.22 : 1), 1));
  return qr;
}

function createDownloadState(parent, state, x, y, mobile) {
  const width = mobile ? 390 : 900;
  const height = mobile ? 600 : 570;
  const board = frame(parent, `03 Download / ${mobile ? "Mobile" : "Desktop"} / ${state}`, x, y, width, height, linearGradient([
    { position: 0, color: "#d9ece7", opacity: 1 },
    { position: 0.54, color: "#edf6f2", opacity: 1 },
    { position: 1, color: "#d2e8e2", opacity: 1 },
  ], 145), 0);
  board.clipsContent = true;
  addWind(board, width, height, state === "reduced-motion");
  const pad = mobile ? 20 : 54;
  const stateTag = frame(board, "State Tag", pad, 18, mobile ? 150 : 180, 28, solid(COLORS.teal), 14);
  text(stateTag, "State Name", `DOWNLOAD / ${state.toUpperCase()}`, 9, 8, stateTag.width - 18, 8, "bold", COLORS.white, { lineHeight: 1, letterSpacing: 8, align: "CENTER" });
  label(board, "ANDROID APK 下載", pad, mobile ? 72 : 86, width - pad * 2);
  text(board, "Download Title", "路線找到了，\n把它帶在身邊。", pad, mobile ? 103 : 122, width - pad * 2, mobile ? 36 : 53, "bold", COLORS.ink, { lineHeight: mobile ? 1.09 : 1.1, letterSpacing: mobile ? -3.5 : -4 });
  const copy = DESIGN.downloadStateCopy[state];
  text(board, "Download Meta", copy[0], pad, mobile ? 203 : 250, mobile ? 350 : 560, mobile ? 9 : 10.5, "medium", state === "unavailable" ? COLORS.disabled : COLORS.muted, { lineHeight: 1.3 });
  const disabled = state === "checking" || state === "unavailable";
  const buttonLabel = state === "ready" || state === "reduced-motion" ? "ANDROID APK\n下載 BusIsComing  ↓" : copy[1];
  const buttonWidth = mobile ? 350 : 500;
  const button = createButtonInstance(board, "Primary", disabled ? "disabled" : "default", buttonLabel, pad, mobile ? 239 : 294, buttonWidth, mobile ? 72 : 76);
  button.setPluginData("motion", state === "reduced-motion" ? "static" : "wind-converge");
  text(board, "Install Help", "查看 Android 安裝說明  →", pad, mobile ? 327 : 385, 260, mobile ? 9 : 10, "bold", COLORS.teal, { lineHeight: 1.2 });
  if (!mobile) {
    createQr(board, 690, 292, 142, state !== "ready" && state !== "reduced-motion");
    text(board, "QR Label", state === "ready" || state === "reduced-motion" ? "掃描下載" : state === "checking" ? "下載資料確認後顯示" : "暫時沒有可用連結", 670, 447, 180, 9, "medium", state === "ready" || state === "reduced-motion" ? COLORS.tealDark : COLORS.disabled, { lineHeight: 1.3, align: "CENTER" });
  }
  if (state !== "reduced-motion") {
    const cue = ellipse(board, "Motion Cue / Wind Focus", pad + buttonWidth - 82, mobile ? 252 : 305, 52, 52, solid(COLORS.white, 0.18), 0.8);
    cue.strokes = [solid(COLORS.white, 0.5)];
    cue.strokeWeight = 1;
  }
  text(board, "Behavior Note", state === "checking" ? "不可點擊 · 不顯示 QR · 尺寸不跳動" : state === "unavailable" ? "不可點擊 · 原位說明 · 不建立假連結" : state === "reduced-motion" ? "停止風帶匯聚、亮帶與箭頭位移；保留靜態層級" : "ready 才建立真實 APK 連結與真實 QR", pad, height - 54, width - pad * 2, mobile ? 8.5 : 9.5, "regular", COLORS.muted, { lineHeight: 1.45 });
  return board;
}

function createSupportEnding(parent, x, y, mobile) {
  const width = mobile ? 390 : 1200;
  const height = mobile ? 1350 : 1020;
  const board = frame(parent, `04 Support Ending / ${mobile ? "Mobile" : "Desktop"}`, x, y, width, height, solid("#f8fcfa"), 0);
  board.clipsContent = true;
  const pad = mobile ? 20 : 64;
  line(board, "Quiet Wind Divider", pad, mobile ? 36 : 54, width - pad * 2, COLORS.teal, 0.15, 1);
  if (mobile) {
    label(board, "常見問題", pad, 86, 240);
    text(board, "FAQ Title", "出發前，\n也許你想知道。", pad, 119, 350, 39, "bold", COLORS.ink, { lineHeight: 1.05, letterSpacing: -5.2 });
    let cursorY = 244;
    DESIGN.faq.forEach(([question, answer], index) => {
      line(board, `FAQ Divider ${index + 1}`, pad, cursorY, 350, COLORS.teal, 0.16, 1);
      text(board, "FAQ Index", String(index + 1).padStart(2, "0"), pad, cursorY + 23, 30, 10, "bold", COLORS.teal, { lineHeight: 1.2, opacity: 0.55 });
      text(board, "FAQ Question", question, pad + 39, cursorY + 18, 260, 15, "bold", COLORS.ink, { lineHeight: 1.35 });
      text(board, "FAQ Toggle", index === 0 ? "−" : "+", width - pad - 30, cursorY + 20, 28, 16, "medium", COLORS.teal, { lineHeight: 1.2, align: "CENTER" });
      if (index === 0) {
        text(board, "FAQ Answer", answer, pad + 39, cursorY + 69, 300, 12.5, "regular", COLORS.muted, { lineHeight: 1.72 });
        cursorY += 184;
      } else {
        cursorY += 86;
      }
    });
    line(board, "Contact Divider", pad, cursorY + 26, 350, COLORS.teal, 0.18, 1);
    text(board, "Contact Eyebrow", "還有問題？", pad, cursorY + 54, 180, 10, "regular", COLORS.muted, { lineHeight: 1.2 });
    text(board, "Contact Action", "直接聯絡我們", pad, cursorY + 78, 280, 24, "bold", COLORS.ink, { lineHeight: 1.2, letterSpacing: -3 });
    text(board, "Contact Arrow", "→", width - pad - 42, cursorY + 71, 42, 27, "medium", COLORS.teal, { lineHeight: 1.2, align: "RIGHT" });
    line(board, "Footer Divider", pad, cursorY + 144, 350, COLORS.teal, 0.12, 1);
    createBrand(board, pad, cursorY + 178, true);
    text(board, "Footer Links", "常見問題\n私隱政策\n返回頂部 ↑", 252, cursorY + 178, 118, 10, "medium", COLORS.muted, { lineHeight: 2, align: "RIGHT" });
    text(board, "Footer Positioning", "香港巴士路線規劃與導航 App\n© 2026 BusIsComing", pad, cursorY + 274, 320, 9, "regular", COLORS.muted, { lineHeight: 1.8 });
  } else {
    label(board, "常見問題", pad, 110, 320);
    text(board, "FAQ Title", "出發前，\n也許你想知道。", pad, 148, 430, 54, "bold", COLORS.ink, { lineHeight: 1.06, letterSpacing: -5.2 });
    let cursorY = 120;
    DESIGN.faq.forEach(([question, answer], index) => {
      const listX = 530;
      line(board, `FAQ Divider ${index + 1}`, listX, cursorY, 606, COLORS.teal, 0.16, 1);
      text(board, "FAQ Index", String(index + 1).padStart(2, "0"), listX, cursorY + 29, 40, 11, "bold", COLORS.teal, { lineHeight: 1.2, opacity: 0.52 });
      text(board, "FAQ Question", question, listX + 53, cursorY + 24, 430, 17, "bold", COLORS.ink, { lineHeight: 1.35 });
      text(board, "FAQ Toggle", index === 0 ? "−" : "+", listX + 566, cursorY + 24, 29, 18, "medium", COLORS.teal, { lineHeight: 1.2, align: "CENTER" });
      if (index === 0) {
        text(board, "FAQ Answer", answer, listX + 53, cursorY + 72, 520, 14, "regular", COLORS.muted, { lineHeight: 1.78 });
        cursorY += 182;
      } else {
        cursorY += 84;
      }
    });
    line(board, "Contact Divider", pad, 645, width - pad * 2, COLORS.teal, 0.18, 1);
    text(board, "Contact Eyebrow", "還有問題？", pad, 686, 200, 11, "regular", COLORS.muted, { lineHeight: 1.2 });
    text(board, "Contact Action", "直接聯絡我們", pad, 715, 420, 34, "bold", COLORS.ink, { lineHeight: 1.2, letterSpacing: -3 });
    text(board, "Contact Arrow", "→", width - pad - 60, 704, 60, 36, "medium", COLORS.teal, { lineHeight: 1.2, align: "RIGHT" });
    line(board, "Footer Divider", pad, 808, width - pad * 2, COLORS.teal, 0.12, 1);
    createBrand(board, pad, 855, false);
    text(board, "Footer Links", "常見問題    私隱政策    返回頂部 ↑", width - pad - 360, 861, 360, 11, "medium", COLORS.muted, { lineHeight: 1.2, align: "RIGHT" });
    text(board, "Footer Positioning", "香港巴士路線規劃與導航 App", pad, 938, 330, 10, "regular", COLORS.muted, { lineHeight: 1.2 });
    text(board, "Footer Copyright", "© 2026 BusIsComing", width - pad - 220, 938, 220, 10, "regular", COLORS.muted, { lineHeight: 1.2, align: "RIGHT" });
  }
  return board;
}

function variablePaint(variable) {
  return figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", variable);
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
  function findStyle(candidates) {
    return candidates.find((candidate) => styles.includes(candidate)) || styles[0] || "Regular";
  }
  const result = {
    regular: { family, style: findStyle(["Regular", "Normal"]) },
    medium: { family, style: findStyle(["Medium", "SemiBold", "Semi Bold", "Regular"]) },
    bold: { family, style: findStyle(["Bold", "Black", "SemiBold", "Semi Bold", "Medium", "Regular"]) },
  };
  await Promise.all([figma.loadFontAsync(result.regular), figma.loadFontAsync(result.medium), figma.loadFontAsync(result.bold)]);
  return result;
}

async function ensureCollection(name) {
  const existing = (await figma.variables.getLocalVariableCollectionsAsync()).find((collection) => collection.name === name);
  if (existing) return existing;
  const collection = figma.variables.createVariableCollection(name);
  collection.renameMode(collection.modes[0].modeId, "Value");
  return collection;
}

async function ensureVariable(collection, name, type, value, scopes, codeSyntax) {
  const variables = await figma.variables.getLocalVariablesAsync(type);
  let variable = variables.find((candidate) => candidate.variableCollectionId === collection.id && candidate.name === name);
  if (!variable) variable = figma.variables.createVariable(name, collection, type);
  variable.scopes = scopes || [];
  variable.setValueForMode(collection.modes[0].modeId, value);
  if (variable.setVariableCodeSyntax && codeSyntax) variable.setVariableCodeSyntax("WEB", codeSyntax);
  return variable;
}

async function createDesignSystem() {
  post("P1", "建立变量与样式", "Starter-compatible 单模式变量；语义颜色通过 alias 指向 primitive。 ");
  const primitiveCollection = await ensureCollection("BIC v1.3.1 / Primitives");
  const semanticCollection = await ensureCollection("BIC v1.3.1 / Semantic");
  const dimensionCollection = await ensureCollection("BIC v1.3.1 / Dimension");

  const primitive = {};
  for (const [name, value] of Object.entries(COLORS)) {
    primitive[name] = await ensureVariable(primitiveCollection, `color/${name}`, "COLOR", hex(value), [], `var(--bic-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)})`);
  }
  const semanticMap = {
    "color/text/primary": "ink",
    "color/text/secondary": "muted",
    "color/action/brand": "teal",
    "color/action/brand-dark": "tealDark",
    "color/background/wind": "wind",
    "color/background/paper": "paper",
    "color/surface/primary": "white",
    "color/border/subtle": "line",
    "color/action/disabled": "disabled",
  };
  const semantic = {};
  for (const [name, primitiveKey] of Object.entries(semanticMap)) {
    semantic[name] = await ensureVariable(
      semanticCollection,
      name,
      "COLOR",
      figma.variables.createVariableAlias(primitive[primitiveKey]),
      name.includes("text") ? ["TEXT_FILL"] : ["ALL_FILLS", "STROKE_COLOR"],
      `var(--bic-${name.split("/").slice(-2).join("-")})`,
    );
  }
  const dimension = {};
  for (const [name, value] of Object.entries(DESIGN.tokens.spacing)) {
    dimension[`spacing/${name}`] = await ensureVariable(dimensionCollection, `spacing/${name}`, "FLOAT", value, ["GAP"], `var(--bic-space-${name})`);
  }
  for (const [name, value] of Object.entries(DESIGN.tokens.radius)) {
    dimension[`radius/${name}`] = await ensureVariable(dimensionCollection, `radius/${name}`, "FLOAT", value, ["CORNER_RADIUS"], `var(--bic-radius-${name})`);
  }
  dimension["motion/orbit-ms"] = await ensureVariable(dimensionCollection, "motion/orbit-ms", "FLOAT", DESIGN.motion.orbit.durationMs, [], "var(--bic-motion-orbit-ms)");
  dimension["motion/faq-ms"] = await ensureVariable(dimensionCollection, "motion/faq-ms", "FLOAT", DESIGN.motion.faq.durationMs, [], "var(--bic-motion-faq-ms)");

  const textStyles = await figma.getLocalTextStylesAsync();
  const typeSpecs = [
    ["BIC v1.3.1/Display/Hero Desktop", FONT.bold, 84, 79, -7],
    ["BIC v1.3.1/Display/Hero Mobile", FONT.bold, 41, 38, -6.5],
    ["BIC v1.3.1/Heading/Section", FONT.bold, 54, 57, -5],
    ["BIC v1.3.1/Body/Lead", FONT.regular, 20, 34, 0],
    ["BIC v1.3.1/Body/Default", FONT.regular, 14, 24, 0],
    ["BIC v1.3.1/Label/Overline", FONT.bold, 12, 14, 12],
    ["BIC v1.3.1/Label/Caption", FONT.medium, 10, 14, 2],
  ];
  for (const [name, fontName, fontSize, lineHeight, letterSpacing] of typeSpecs) {
    let style = textStyles.find((candidate) => candidate.name === name);
    if (!style) style = figma.createTextStyle();
    style.name = name;
    style.fontName = fontName;
    style.fontSize = fontSize;
    style.lineHeight = { value: lineHeight, unit: "PIXELS" };
    style.letterSpacing = { value: letterSpacing, unit: "PERCENT" };
    style.description = "BusIsComing Homepage Visual System v1.3.1 approved typography.";
  }

  const effectStyles = await figma.getLocalEffectStylesAsync();
  for (const [name, spec] of [
    ["BIC v1.3.1/Elevation/Phone", { y: 28, blur: 60, alpha: 0.24 }],
    ["BIC v1.3.1/Elevation/Floating", { y: 24, blur: 58, alpha: 0.16 }],
    ["BIC v1.3.1/Elevation/Card", { y: 10, blur: 28, alpha: 0.075 }],
  ]) {
    let style = effectStyles.find((candidate) => candidate.name === name);
    if (!style) style = figma.createEffectStyle();
    style.name = name;
    style.effects = [{ type: "DROP_SHADOW", color: { r: 0.03, g: 0.18, b: 0.17, a: spec.alpha }, offset: { x: 0, y: spec.y }, radius: spec.blur, spread: 0, visible: true, blendMode: "NORMAL" }];
  }
  return { primitiveCollection, semanticCollection, dimensionCollection, primitive, semantic, dimension };
}

function bindComponentFrame(component, fillVariable, radiusVariable) {
  component.fills = [variablePaint(fillVariable)];
  component.setBoundVariable("topLeftRadius", radiusVariable);
  component.setBoundVariable("topRightRadius", radiusVariable);
  component.setBoundVariable("bottomLeftRadius", radiusVariable);
  component.setBoundVariable("bottomRightRadius", radiusVariable);
}

function exposeTextProperty(component, node, propertyName, defaultValue) {
  const propertyKey = component.addComponentProperty(propertyName, "TEXT", defaultValue);
  node.componentPropertyReferences = { characters: propertyKey };
}

// combineAsVariants 不会自动排版；显式网格避免所有状态叠在同一个坐标。
function layoutVariantSet(componentSet, columns, gap, padding) {
  componentSet.children.forEach((child, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    child.x = padding + column * (child.width + gap);
    child.y = padding + row * (child.height + gap);
  });
  let maxX = 0;
  let maxY = 0;
  componentSet.children.forEach((child) => {
    maxX = Math.max(maxX, child.x + child.width);
    maxY = Math.max(maxY, child.y + child.height);
  });
  componentSet.resizeWithoutConstraints(maxX + padding, maxY + padding);
  componentSet.fills = [solid(COLORS.white, 0.5)];
  componentSet.cornerRadius = 14;
}

function makeButtonComponent(parent, styleName, stateName, x, y) {
  const component = figma.createComponent();
  component.name = `Style=${styleName}, State=${stateName}`;
  component.resize(200, 52);
  component.layoutMode = "HORIZONTAL";
  component.primaryAxisSizingMode = "FIXED";
  component.counterAxisSizingMode = "FIXED";
  component.primaryAxisAlignItems = "CENTER";
  component.counterAxisAlignItems = "CENTER";
  component.itemSpacing = 8;
  component.paddingLeft = 16;
  component.paddingRight = 16;
  const semantic = SYSTEM.tokens.semantic;
  const fillVar = stateName === "Disabled" ? semantic["color/action/disabled"] : styleName === "Primary" ? semantic["color/action/brand"] : semantic["color/surface/primary"];
  bindComponentFrame(component, fillVar, SYSTEM.tokens.dimension["radius/md"]);
  if (styleName === "Secondary") {
    component.strokes = [variablePaint(semantic["color/action/brand"] )];
    component.strokeWeight = 1;
  }
  if (stateName === "Hover") component.opacity = 0.9;
  const labelNode = figma.createText();
  labelNode.name = "Label";
  labelNode.fontName = FONT.bold;
  labelNode.fontSize = 14;
  labelNode.characters = "Button";
  labelNode.textAutoResize = "WIDTH_AND_HEIGHT";
  labelNode.fills = [variablePaint(styleName === "Primary" || stateName === "Disabled" ? SYSTEM.tokens.primitive.white : semantic["color/action/brand-dark"] )];
  component.appendChild(labelNode);
  exposeTextProperty(component, labelNode, "Label", "Button");
  add(parent, component, x, y);
  return component;
}

function makeStoryTabComponent(parent, active, x, y) {
  const component = figma.createComponent();
  component.name = `State=${active ? "Active" : "Default"}`;
  component.resize(112, 78);
  component.fills = [];
  component.clipsContent = false;
  const dot = frame(component, "Dot", 31, 2, active ? 50 : 38, 38, active ? variablePaint(SYSTEM.tokens.semantic["color/action/brand"]) : solid(COLORS.white, 0.78), 19);
  dot.resize(active ? 50 : 38, 38);
  dot.strokes = active ? [] : [variablePaint(SYSTEM.tokens.semantic["color/border/subtle"] )];
  dot.strokeWeight = active ? 0 : 1;
  const number = text(component, "Number", "01", 31, 13, active ? 50 : 38, 11, "bold", active ? COLORS.white : COLORS.muted, { lineHeight: 1.1, align: "CENTER" });
  number.x = active ? 31 : 37;
  const labelNode = text(component, "Label", "搜尋", 16, 53, 80, 10, "bold", active ? COLORS.teal : COLORS.muted, { lineHeight: 1.1, align: "CENTER" });
  labelNode.x = 16;
  exposeTextProperty(component, number, "Number", "01");
  exposeTextProperty(component, labelNode, "Label", "搜尋");
  add(parent, component, x, y);
  return component;
}

function makeRouteCardComponent(parent, x, y) {
  const component = figma.createComponent();
  component.name = "BIC v1.3.1/Route Card";
  component.resize(440, 116);
  bindComponentFrame(component, SYSTEM.tokens.semantic["color/surface/primary"], SYSTEM.tokens.dimension["radius/lg"]);
  component.strokes = [variablePaint(SYSTEM.tokens.semantic["color/border/subtle"] )];
  component.strokeWeight = 1;
  const route = text(component, "Route", "ZX28", 16, 14, 220, 17, "bold", COLORS.ink, { lineHeight: 1.15, letterSpacing: -2 });
  const stops = text(component, "Stops", "晨灣匯平台 → 澄岳坊總站", 16, 42, 260, 10.5, "regular", COLORS.muted, { lineHeight: 1.25 });
  text(component, "Wait Label", "預計候車", 318, 14, 96, 8.5, "regular", COLORS.muted, { lineHeight: 1.1, align: "RIGHT" });
  const wait = text(component, "Wait", "6 分鐘", 304, 34, 110, 15, "bold", COLORS.teal, { lineHeight: 1.1, align: "RIGHT" });
  line(component, "Metric Divider", 16, 69, 408, COLORS.teal, 0.11, 1);
  const fare = text(component, "Fare", "HK$ 7.8", 16, 84, 82, 10, "medium", COLORS.muted, { lineHeight: 1.1 });
  const duration = text(component, "Duration", "耗時 26 分鐘", 115, 84, 120, 10, "medium", COLORS.muted, { lineHeight: 1.1 });
  const walk = text(component, "Walk", "步行 180 米", 250, 84, 120, 10, "medium", COLORS.muted, { lineHeight: 1.1 });
  exposeTextProperty(component, route, "Route", "ZX28");
  exposeTextProperty(component, stops, "Stops", "晨灣匯平台 → 澄岳坊總站");
  exposeTextProperty(component, wait, "Wait", "6 分鐘");
  exposeTextProperty(component, fare, "Fare", "HK$ 7.8");
  exposeTextProperty(component, duration, "Duration", "耗時 26 分鐘");
  exposeTextProperty(component, walk, "Walk", "步行 180 米");
  add(parent, component, x, y);
  return component;
}

function createComponents(parent, x, y) {
  const board = frame(parent, "00 Components / Native Library", x, y, 2200, 920, solid("#f7faf8"), 24);
  board.strokes = [solid(COLORS.teal, 0.14)];
  sectionTitle(board, "00 / COMPONENTS", "可编辑组件与状态", "所有组件使用 BIC v1.3.1 前缀变量；不复用旧版不兼容视觉。", 42, 38, 900);
  SYSTEM.buttonComponents = {};
  const buttons = [];
  ["Primary", "Secondary"].forEach((styleName, styleIndex) => {
    ["Default", "Hover", "Disabled"].forEach((stateName, stateIndex) => {
      const component = makeButtonComponent(board, styleName, stateName, 50 + stateIndex * 230, 160 + styleIndex * 95);
      SYSTEM.buttonComponents[`${styleName}-${stateName.toLowerCase()}`] = component;
      buttons.push(component);
    });
  });
  const buttonSet = figma.combineAsVariants(buttons, board);
  buttonSet.name = "BIC v1.3.1/Button";
  layoutVariantSet(buttonSet, 3, 20, 20);
  buttonSet.x = 50;
  buttonSet.y = 160;

  const storyDefault = makeStoryTabComponent(board, false, 840, 160);
  const storyActive = makeStoryTabComponent(board, true, 980, 160);
  const storySet = figma.combineAsVariants([storyDefault, storyActive], board);
  storySet.name = "BIC v1.3.1/Story Tab";
  layoutVariantSet(storySet, 2, 20, 20);
  storySet.x = 840;
  storySet.y = 160;
  SYSTEM.storyTabComponents = { default: storyDefault, active: storyActive };

  SYSTEM.routeCard = makeRouteCardComponent(board, 1250, 160);
  text(board, "Component Guidance", "Button\nPrimary = 下載與主要提交；Secondary = 路線試查、重試。\n\nStory Tab\n五個故事共享兩態，點擊後同步更新文案、前景截圖與深度位置。\n\nRoute Card\n只用文字顯示「耗時」與「步行」；不加入摘要標籤。", 50, 430, 760, 14, "regular", COLORS.muted, { lineHeight: 1.7 });
  text(board, "Accessibility Guidance", "Touch target ≥ 44×44\nFocus-visible 必須可見\nStory 使用 aria-pressed 或等價語義\n裝飾後景圖不進入焦點順序", 880, 430, 520, 14, "regular", COLORS.muted, { lineHeight: 1.7 });
  text(board, "Responsive Guidance", "桌面 1440×960\n手機 390×844\n補充：320px 不可橫向溢出\n導航、CTA、截圖邊框和故事軌均不可缺失", 1510, 430, 580, 14, "regular", COLORS.muted, { lineHeight: 1.7 });
  return board;
}

function createFoundations(parent, x, y) {
  const board = frame(parent, "00 Foundations", x, y, 1400, 920, solid("#f7faf8"), 24);
  board.strokes = [solid(COLORS.teal, 0.14)];
  sectionTitle(board, "00 / FOUNDATIONS", "有空气流动的安静工具", "海绿、深青、白与极浅绿色；不用紫色，不以卡片包裹普通文案。", 42, 38, 920);
  let swatchX = 42;
  Object.entries(COLORS).forEach(([name, value], index) => {
    const row = Math.floor(index / 5);
    const column = index % 5;
    swatchX = 42 + column * 250;
    const swatchY = 155 + row * 128;
    rectangle(board, `Color / ${name}`, swatchX, swatchY, 210, 72, solid(value), 15);
    text(board, "Token Name", name, swatchX, swatchY + 81, 110, 11, "bold", COLORS.ink, { lineHeight: 1.1 });
    text(board, "Token Value", value.toUpperCase(), swatchX + 100, swatchY + 81, 110, 10, "regular", COLORS.muted, { lineHeight: 1.1, align: "RIGHT" });
  });
  text(board, "Type Sample Hero", "隨心搜尋，出發更輕鬆", 42, 453, 800, 54, "bold", COLORS.ink, { lineHeight: 1.06, letterSpacing: -5.2 });
  text(board, "Type Sample Lead", "輸入起終點，即時比較合適路線。", 42, 525, 620, 20, "regular", COLORS.muted, { lineHeight: 1.72 });
  label(board, "SPACING / RADIUS", 42, 607, 500);
  Object.entries(DESIGN.tokens.spacing).forEach(([name, value], index) => {
    const itemX = 42 + index * 132;
    rectangle(board, `Spacing / ${name}`, itemX, 654, value, 18, solid(COLORS.teal), 5);
    text(board, "Spacing Name", `${name} · ${value}`, itemX, 684, 110, 10, "medium", COLORS.muted, { lineHeight: 1.1 });
  });
  label(board, "PHONE MATERIAL", 860, 453, 410);
  const material = frame(board, "Phone Material Sample", 860, 492, 392, 244, linearGradient([
    { position: 0, color: "#8aa19d", opacity: 1 },
    { position: 0.18, color: "#244846", opacity: 1 },
    { position: 0.52, color: "#0b2928", opacity: 1 },
    { position: 0.78, color: "#163a38", opacity: 1 },
    { position: 1, color: "#91a6a2", opacity: 1 },
  ], 145), 54);
  applyShadow(material, "phone");
  const inner = frame(material, "Screen Sample", 10, 10, 372, 224, solid("#eef6f3"), 46);
  text(inner, "Material Note", "深青金属渐变\n细高光 · 克制阴影\n只保留边框，不添加灵动岛", 40, 65, 292, 18, "medium", COLORS.ink, { lineHeight: 1.55, align: "CENTER" });
  return board;
}

function createMotionNotes(parent, x, y) {
  const board = frame(parent, "05 Motion Notes", x, y, 1600, 920, solid("#f7faf8"), 24);
  board.strokes = [solid(COLORS.teal, 0.14)];
  sectionTitle(board, "05 / MOTION", "风带、环形舞台与下载汇聚", "Figma 保存静态关键帧和精确参数；生产实现按此时序，不自行改成淡入淡出。", 42, 38, 1040);
  const cards = [
    ["BACKGROUND WIND", "10–22s · transform + opacity", "远、中、近与呼吸光保持不同速度。reduced motion 下静止。"],
    ["ORBIT CAROUSEL", "880ms · cubic-bezier(.18,.82,.18,1)", "前景退到后侧，目标从后方绕到前景；opacity 660ms，blur 760ms。"],
    ["DESKTOP PHONE", "520ms · cubic-bezier(.2,.8,.2,1)", "轻量位移与旋转；标题和辅助说明同步更新。"],
    ["FAQ", "240ms · cubic-bezier(.2,.8,.2,1)", "同一时间最多展开一项；加减号和 aria-expanded 同步。"],
    ["DOWNLOAD", "风带汇聚 · 亮带掠过 · 箭头轻落一次", "不出现手指、放大镜或游戏化提示；reduced motion 保留静态层级。"],
  ];
  cards.forEach(([titleValue, timing, description], index) => {
    const cardX = 42 + (index % 3) * 500;
    const cardY = 160 + Math.floor(index / 3) * 260;
    const card = frame(board, `Motion / ${titleValue}`, cardX, cardY, 450, 210, solid(COLORS.white, 0.72), 20);
    card.strokes = [solid(COLORS.teal, 0.13)];
    text(card, "Motion Title", titleValue, 24, 24, 400, 11, "bold", COLORS.teal, { lineHeight: 1.2, letterSpacing: 9 });
    text(card, "Motion Timing", timing, 24, 61, 400, 18, "bold", COLORS.ink, { lineHeight: 1.25, letterSpacing: -1.5 });
    text(card, "Motion Description", description, 24, 103, 396, 12.5, "regular", COLORS.muted, { lineHeight: 1.62 });
  });
  const stage = frame(board, "Orbit Keyframes", 1042, 420, 500, 410, solid(COLORS.wind, 0.8), 22);
  label(stage, "ORBIT KEYFRAMES", 24, 22, 420);
  createPhone(stage, DESIGN.stories[4], 24, 105, 110, { opacity: 0.35, rotation: -8, noShadow: true, radius: 24 });
  createPhone(stage, DESIGN.stories[0], 188, 70, 144, { radius: 29 });
  createPhone(stage, DESIGN.stories[1], 366, 105, 110, { opacity: 0.38, rotation: 8, noShadow: true, radius: 24 });
  text(stage, "Orbit Note", "后侧 → 前景 → 后侧\n同时改变 x / y / scale / rotate / opacity / blur / z-index", 24, 343, 452, 11.5, "medium", COLORS.muted, { lineHeight: 1.5, align: "CENTER" });
  return board;
}

function createContentContract(parent, x, y) {
  const board = frame(parent, "06 Content Contract", x, y, 2000, 1200, solid("#f7faf8"), 24);
  board.strokes = [solid(COLORS.teal, 0.14)];
  sectionTitle(board, "06 / CONTENT", "文案、产品事实与禁止漂移", "繁体为已确认基线；简体和英文必须独立审校，不机械转换。", 42, 38, 1100);
  DESIGN.stories.forEach((story, index) => {
    const rowY = 160 + index * 132;
    text(board, "Story Number", story.id, 42, rowY, 54, 22, "bold", COLORS.teal, { lineHeight: 1.1 });
    text(board, "Story Label", story.label, 102, rowY + 2, 80, 12, "bold", COLORS.muted, { lineHeight: 1.1 });
    text(board, "Story Title", story.title, 210, rowY, 640, 24, "bold", COLORS.ink, { lineHeight: 1.15, letterSpacing: -2 });
    text(board, "Story Description", story.description, 210, rowY + 43, 780, 13, "regular", COLORS.muted, { lineHeight: 1.55 });
    line(board, `Story Divider ${index + 1}`, 42, rowY + 102, 920, COLORS.teal, 0.11, 1);
  });
  label(board, "PRODUCT BOUNDARY", 1080, 160, 780);
  text(board, "Product Positioning", "香港巴士路線規劃與導航 App", 1080, 198, 780, 32, "bold", COLORS.ink, { lineHeight: 1.15, letterSpacing: -3 });
  text(board, "Operator Boundary", "路線規劃以 App 已支援的香港巴士路線資料為準。符合條件的聯營路線可集中顯示城巴、九巴與龍運的首程到站時間；不得擴寫為完整跨營運商路線規劃。", 1080, 256, 760, 15, "regular", COLORS.muted, { lineHeight: 1.75 });
  label(board, "DO NOT ADD", 1080, 398, 780);
  const prohibitedCopy = [
    "紫色色塊或藍紫漸變",
    "手機靈動島、劉海或硬件開孔",
    "深色頁尾潮汐或假結尾",
    "低存在感證據標籤與功能編號標籤",
    "手機說明卡與故事按鈕遮擋",
    "路線卡耗時、步行圖標或摘要標籤",
    "Android 工程本地路徑與內部調試描述",
  ];
  prohibitedCopy.forEach((item, index) => text(board, "Prohibited Item", `— ${item}`, 1080, 438 + index * 42, 760, 13, "medium", COLORS.ink, { lineHeight: 1.4 }));
  label(board, "THREE LOCALES", 1080, 772, 780);
  text(board, "Locale Note", "zh-Hant：香港交通與產品頁習慣\nzh-Hans：自然簡體中文，獨立審校\nen：自然、克制的英語產品表達\n\n所有標題、按鈕、狀態、FAQ、圖片 alt 與輔助標籤均進入集中 i18n。", 1080, 812, 760, 14, "regular", COLORS.muted, { lineHeight: 1.72 });
  return board;
}

function createCover(parent, x, y) {
  const cover = frame(parent, "Cover / Approved Visual System", x, y, 1400, 720, linearGradient([
    { position: 0, color: "#d4e9e4", opacity: 1 },
    { position: 0.55, color: "#edf6f2", opacity: 1 },
    { position: 1, color: "#cfe7e1", opacity: 1 },
  ], 145), 28);
  cover.clipsContent = true;
  addWind(cover, 1400, 720, false);
  label(cover, "APPROVED · 2026-08-21", 72, 68, 600);
  text(cover, "Cover Title", "BusIsComing\nHomepage Visual System", 72, 115, 820, 72, "bold", COLORS.ink, { lineHeight: 0.98, letterSpacing: -6 });
  text(cover, "Cover Subtitle", "v1.3.1 · A × C 混合方向\n有呼吸感、克制、强层级；桌面与手机同等完整。", 72, 298, 680, 20, "regular", COLORS.muted, { lineHeight: 1.65 });
  createPhone(cover, DESIGN.stories[0], 956, 78, 280, { rotation: 4.5, radius: 48 });
  createPhone(cover, DESIGN.stories[4], 806, 185, 176, { opacity: 0.42, rotation: -8, noShadow: true, radius: 34 });
  text(cover, "Source Note", "实现基线：1440×960 / 390×844\nFigma 节点、动效与状态不得自行漂移", 72, 588, 580, 13, "medium", COLORS.tealDark, { lineHeight: 1.6 });
  return cover;
}

async function createImages() {
  const assets = {};
  for (const [name, encoded] of Object.entries(IMAGE_BASE64)) {
    const bytes = figma.base64Decode(encoded);
    const image = figma.createImage(bytes);
    assets[name] = image;
  }
  return assets;
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
    post("done", "最终 Section 已存在", `Node ID: ${existing.id}。插件没有覆盖任何内容。`);
    return;
  }
  const stale = figma.currentPage.findOne((node) => node.type === "SECTION" && node.name === BUILDING_SECTION);
  if (stale) throw new Error(`发现上次未完成的 BUILDING Section（${stale.id}）。请先手动删除或重命名该节点，再重新运行；插件不会自动删除内容。`);

  post("P1", "载入字体与图像", "保留真实 v1.3.1 截图；手机外壳由原生 Figma 图层生成。 ");
  FONT = await chooseFonts();
  ASSETS = await createImages();
  SYSTEM = { tokens: await createDesignSystem() };

  const position = nextSectionPosition();
  const root = figma.createSection();
  root.name = BUILDING_SECTION;
  root.x = position.x;
  root.y = position.y;
  root.resizeWithoutConstraints(7900, 10100);
  figma.currentPage.appendChild(root);
  root.setPluginData("version", DESIGN.version);
  root.setPluginData("approvedAt", DESIGN.approvedAt);
  root.setPluginData("generator", "BusIsComing Homepage v1.3.1 local Figma plugin");

  post("P2", "生成基础与组件", "创建 token 样本、可编辑组件与内容合同。 ");
  createCover(root, 80, 80);
  createFoundations(root, 1540, 80);
  createComponents(root, 3000, 80);

  post("P3", "生成五个 Hero 双端状态", "每个故事都有独立 1440×960 与 390×844 画板。 ");
  DESIGN.stories.forEach((story, index) => createHero(root, index, 80 + index * 1500, 1080, false));
  DESIGN.stories.forEach((story, index) => createHero(root, index, 80 + index * 450, 2110, true));

  post("P3", "生成路线试查状态", "idle / loading / success / empty / error / retained，双端同几何。 ");
  DESIGN.states.route.forEach((state, index) => createRouteState(root, state, 80 + index * 870, 3080, false));
  DESIGN.states.route.forEach((state, index) => createRouteState(root, state, 80 + index * 440, 3760, true));

  post("P3", "生成下载与收尾", "下载四态、FAQ、联系和浅色页尾。 ");
  DESIGN.states.download.forEach((state, index) => createDownloadState(root, state, 80 + index * 950, 4560, false));
  DESIGN.states.download.forEach((state, index) => createDownloadState(root, state, 80 + index * 440, 5190, true));
  createSupportEnding(root, 80, 5840, false);
  createSupportEnding(root, 1340, 5840, true);
  createMotionNotes(root, 1790, 5840);
  createContentContract(root, 3450, 5840);

  const indexBoard = frame(root, "Delivery Index", 5520, 5840, 2200, 1200, solid("#f7faf8"), 24);
  indexBoard.strokes = [solid(COLORS.teal, 0.14)];
  sectionTitle(indexBoard, "INDEX", "交付画板索引", "每项均为原生可编辑 Figma 节点；真实截图只作为手机屏幕内的图像填充。", 42, 38, 1200);
  const indexLines = [
    "00 Foundations · 色彩 / 排版 / 间距 / 手机材质",
    "00 Components · Button / Story Tab / Route Card",
    "01 Hero · Desktop × 5 · 1440×960",
    "01 Hero · Mobile × 5 · 390×844",
    "02 Route Trial · 6 states × Desktop / Mobile",
    "03 Download · 4 states × Desktop / Mobile",
    "04 Support Ending · Desktop / Mobile",
    "05 Motion Notes · wind / orbit / download / FAQ / reduced motion",
    "06 Content Contract · 五故事 / 三语 / 运营商边界 / 禁止项",
  ];
  indexLines.forEach((value, index) => text(indexBoard, "Index Item", `${String(index).padStart(2, "0")}  ${value}`, 42, 170 + index * 62, 1850, 16, "medium", index === 0 ? COLORS.teal : COLORS.ink, { lineHeight: 1.35 }));
  label(indexBoard, "IMPLEMENTATION LOCK", 42, 800, 1200);
  text(indexBoard, "Implementation Lock", "标题换行、主行动顺序、手机截图完整边框、环形远近关系、故事按钮位置、路线卡文字指标、下载居中构图和浅色页尾均不可漂移。", 42, 842, 1880, 18, "bold", COLORS.ink, { lineHeight: 1.62 });

  root.name = FINAL_SECTION;
  root.resizeWithoutConstraints(7900, 7200);
  figma.currentPage.selection = [root];
  figma.viewport.scrollAndZoomIntoView([root]);
  post("done", "最终 Figma 画板已生成", `Section Node ID: ${root.id} · ${root.children.length} 个顶层节点。请复制该 Section 链接回传给 Codex。`);
  figma.notify("Homepage Visual System v1.3.1 已生成", { timeout: 5000 });
}

figma.ui.onmessage = async (message) => {
  if (message.type === "generate") {
    try {
      await generateFinalBoards();
    } catch (error) {
      const detail = error && error.stack ? error.stack : String(error);
      post("error", "生成失败", detail);
      figma.notify("生成失败，请查看插件详情", { error: true, timeout: 6000 });
    }
  }
  if (message.type === "close") figma.closePlugin();
};
