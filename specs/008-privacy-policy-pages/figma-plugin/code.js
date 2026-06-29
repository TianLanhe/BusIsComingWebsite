figma.showUI(__html__, { width: 360, height: 210 });

const pageName = "Privacy Policy Pages - 008";

function findOrCreatePage(name) {
  const existing = figma.root.children.find((page) => page.name === name);
  if (existing) {
    return existing;
  }
  const page = figma.createPage();
  page.name = name;
  return page;
}

function addText(parent, name, text, x, y, width, fontSize, color) {
  const node = figma.createText();
  node.name = name;
  node.characters = text;
  node.x = x;
  node.y = y;
  node.resize(width, node.height);
  node.fontSize = fontSize;
  node.fills = [{ type: "SOLID", color }];
  parent.appendChild(node);
  return node;
}

function addCard(parent, name, x, y, width, height, title, description) {
  const card = figma.createFrame();
  card.name = name;
  card.x = x;
  card.y = y;
  card.resize(width, height);
  card.cornerRadius = 8;
  card.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.98, b: 0.98 } }];
  card.strokes = [{ type: "SOLID", color: { r: 0.82, g: 0.88, b: 0.88 } }];
  parent.appendChild(card);
  addText(card, "Title", title, 20, 18, width - 40, 18, { r: 0.06, g: 0.13, b: 0.16 });
  addText(card, "Description", description, 20, 50, width - 40, 14, { r: 0.27, g: 0.35, b: 0.39 });
  return card;
}

function createFrame(name, x, y, width, height) {
  const frame = figma.createFrame();
  frame.name = name;
  frame.x = x;
  frame.y = y;
  frame.resize(width, height);
  frame.fills = [{ type: "SOLID", color: { r: 0.99, g: 0.99, b: 0.97 } }];
  return frame;
}

async function createPrivacyFrames() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  const page = findOrCreatePage(pageName);
  figma.currentPage = page;

  const desktop = createFrame("Desktop 1440 / Privacy Policy Page", 0, 0, 1440, 1600);
  page.appendChild(desktop);
  addText(desktop, "Eyebrow", "私隱政策 / Privacy Policy", 120, 96, 720, 18, { r: 0.05, g: 0.46, b: 0.42 });
  addText(desktop, "Title", "BusIsComing Privacy Policy", 120, 132, 820, 48, { r: 0.05, g: 0.11, b: 0.14 });
  addText(desktop, "Lead", "Simple privacy information for the website and Android app. No account identity, no ad tracking, and only functional data processing.", 120, 210, 760, 20, { r: 0.27, g: 0.35, b: 0.39 });
  addText(desktop, "Updated", "Last updated: 2026-06-30", 120, 292, 420, 15, { r: 0.39, g: 0.47, b: 0.51 });
  addCard(desktop, "Summary / No account identity", 120, 360, 280, 150, "No account identity", "No registration or login is required.");
  addCard(desktop, "Summary / No ads or sale", 424, 360, 280, 150, "No ad tracking", "No advertising profile or data sale.");
  addCard(desktop, "Summary / Device-first saved routes", 728, 360, 280, 150, "Device-first routes", "Saved routes stay primarily on the device.");
  addCard(desktop, "Summary / External services", 1032, 360, 280, 150, "External services", "Citybus, DATA.GOV.HK and Google Geocoding are used when needed.");
  addText(desktop, "Body section labels", "1. Scope\\n2. What we do not collect\\n3. Functional processing\\n4. Third-party services\\n5. Your choices and contact", 120, 600, 760, 22, { r: 0.05, g: 0.11, b: 0.14 });

  const mobile = createFrame("Mobile 390 / Privacy Policy Page", 1500, 0, 390, 1500);
  page.appendChild(mobile);
  addText(mobile, "Eyebrow", "私隱政策", 24, 56, 250, 15, { r: 0.05, g: 0.46, b: 0.42 });
  addText(mobile, "Title", "BusIsComing Privacy Policy", 24, 88, 342, 32, { r: 0.05, g: 0.11, b: 0.14 });
  addText(mobile, "Lead", "For the website and Android app. No account identity, no ad tracking, functional processing only.", 24, 176, 342, 16, { r: 0.27, g: 0.35, b: 0.39 });
  addCard(mobile, "Summary / No account identity", 24, 280, 342, 112, "No account identity", "No registration or login.");
  addCard(mobile, "Summary / No ads or sale", 24, 412, 342, 112, "No ad tracking", "No advertising profile or data sale.");
  addCard(mobile, "Summary / Device-first routes", 24, 544, 342, 112, "Device-first routes", "Saved routes stay primarily on device.");
  addCard(mobile, "Summary / External services", 24, 676, 342, 128, "External services", "Citybus, DATA.GOV.HK and Google Geocoding are used when needed.");
  addText(mobile, "Body section labels", "1. Scope\\n2. What we do not collect\\n3. Functional processing\\n4. Third-party services\\n5. Your choices and contact", 24, 860, 342, 20, { r: 0.05, g: 0.11, b: 0.14 });

  const footer = createFrame("Footer Privacy Link States", 0, 1700, 780, 360);
  page.appendChild(footer);
  addText(footer, "State labels", "Footer-only entry\\nzh-Hant: 私隱政策 -> /zh-hant/privacy/\\nzh-Hans: 隐私政策 -> /zh-hans/privacy/\\nen: Privacy Policy -> /en/privacy/\\nStates: default, hover, focus", 48, 48, 680, 20, { r: 0.05, g: 0.11, b: 0.14 });

  const seo = createFrame("SEO Hreflang Notes", 840, 1700, 780, 360);
  page.appendChild(seo);
  addText(seo, "SEO notes", "SEO page groups:\\n- home: /zh-hant/, /zh-hans/, /en/\\n- privacy: /zh-hant/privacy/, /zh-hans/privacy/, /en/privacy/\\nPrivacy canonical and hreflang must stay inside the privacy group.", 48, 48, 680, 20, { r: 0.05, g: 0.11, b: 0.14 });

  const notes = createFrame("Spec Notes", 1680, 1700, 780, 360);
  page.appendChild(notes);
  addText(notes, "Spec notes", "Website-only implementation.\\nAndroid app is not changed in this feature.\\nPrivacy pages do not show language switching.\\nFooter is the only new site entry.", 48, 48, 680, 20, { r: 0.05, g: 0.11, b: 0.14 });

  figma.viewport.scrollAndZoomIntoView([desktop, mobile, footer, seo, notes]);
}

figma.ui.onmessage = async (message) => {
  if (message.type === "create-frames") {
    await createPrivacyFrames();
    figma.closePlugin("Privacy policy frames created.");
  }
};
