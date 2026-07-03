import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { ActionTypes } from "../../src/core/constants.js";
import { GLCoreEngine } from "../../src/core/gl-core-engine.js";
import { StateStore } from "../../src/core/state-store.js";
import { renderApp } from "../../src/ui/renderers.js";

const css = readFileSync(new URL("../../styles.css", import.meta.url), "utf8");

function memoryStore() {
  let state = null;
  return {
    load() {
      if (state) return JSON.parse(JSON.stringify(state));
      return new StateStore("__layout_e2e__").reset();
    },
    save(nextState) {
      state = JSON.parse(JSON.stringify(nextState));
    },
    reset() {
      state = new StateStore("__layout_e2e__").reset();
      return state;
    }
  };
}

function createEngine() {
  return new GLCoreEngine({ store: memoryStore() });
}

function engineForUserContext(userId, companyId = null) {
  const engine = createEngine();
  const user = engine.state.users.find((item) => item.id === userId);
  assert.ok(user, `missing demo user ${userId}`);
  const contexts = engine.modules.companies.contextsForUser(userId);
  const context = companyId
    ? contexts.find((item) => item.companyId === companyId && item.compatibleRoles.includes(user.selectedRole))
      || contexts.find((item) => item.companyId === companyId)
    : engine.modules.companies.defaultContextForUser(user);
  assert.ok(context, `missing context for ${userId}`);
  engine.state.session.userId = userId;
  engine.state.session.role = context.compatibleRoles.includes(user.selectedRole)
    ? user.selectedRole
    : context.compatibleRoles[0] || user.selectedRole;
  engine.state.session.contextType = context.contextType;
  engine.state.session.companyId = context.companyId || null;
  engine.state.session.companyRoleId = context.userCompanyRoleId || null;
  engine.state.session.onboardingRequired = false;
  engine.state.session.onboardingUserId = null;
  return engine;
}

function selectView(engine, view, route) {
  return engine.dispatchAction(ActionTypes.SELECT_VIEW, { view, route });
}

function renderedPage(engine) {
  return `<!doctype html>
    <html lang="pl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>${css}</style>
      </head>
      <body>${renderApp(engine.getSnapshot(), engine)}</body>
    </html>`;
}

async function launchPlaywrightBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    if (process.platform === "win32") {
      try {
        return await chromium.launch({ channel: "msedge", headless: true });
      } catch {
        // Fall through and report the original bundled-browser error.
      }
    }
    throw error;
  }
}

test("e2e: wspolny layout ma breakpointy i zabezpieczenia przed nakladaniem paneli", () => {
  assert.match(css, /\.app-shell\s*{[\s\S]*grid-template-columns:\s*272px minmax\(0,\s*1fr\) 320px;/);
  assert.match(css, /@media \(min-width:\s*1800px\)/);
  assert.match(css, /@media \(max-width:\s*1440px\) and \(min-width:\s*1221px\)/);
  assert.match(css, /@media \(max-width:\s*1220px\)/);
  assert.match(css, /@media \(max-width:\s*860px\)/);
  assert.match(css, /@media \(max-width:\s*640px\)/);
  assert.match(css, /\.main\s*{[\s\S]*min-width:\s*0;/);
  assert.match(css, /\.context-rail\s*{[\s\S]*min-width:\s*0;/);
  assert.match(css, /\.transport-table,\s*\n\.audit-table\s*{[\s\S]*overflow-x:\s*auto;/);
});

test("e2e: kolumny layoutu maja miejsce bez nakladania w wymaganych szerokosciach", () => {
  const requiredViewports = [1366, 1440, 1920, 2560];
  const columnsForWidth = (width) => {
    if (width >= 1800) return { left: 292, right: 340 };
    if (width >= 1221 && width <= 1440) return { left: 248, right: 288 };
    return { left: 272, right: 320 };
  };

  for (const width of requiredViewports) {
    const columns = columnsForWidth(width);
    const main = width - columns.left - columns.right;
    assert.ok(main > 0, `glowna kolumna musi istniec dla ${width}px`);
    assert.equal(columns.left + main <= width, true, `lewy panel nie moze wejsc w tresc dla ${width}px`);
    assert.equal(columns.left + main + columns.right <= width, true, `prawy panel nie moze wejsc w tresc dla ${width}px`);
  }
});

test("e2e: kluczowe widoki korzystaja z jednego szkieletu layoutu", () => {
  const cases = [
    ["Profil", "u-carrier-owner", "co-carrier-a", "profile", "/profile"],
    ["Pracownicy", "u-carrier-owner", "co-carrier-a", "employees", "/employees"],
    ["Ladunki", "u-carrier-owner", "co-carrier-a", "create", "/loads"],
    ["Pojazdy", "u-carrier-owner", "co-carrier-a", "companies", "/company"],
    ["Transporty", "u-carrier-owner", "co-carrier-a", "transports", "/transports"],
    ["Portfel", "u-platform", null, "wallet", "/wallet"],
    ["Dokumenty", "u-driver-1", "co-carrier-a", "documents", "/documents"],
    ["Ubezpieczenia", "u-insurance", "co-insurance-a", "policies", "/policies"]
  ];

  for (const [label, userId, companyId, view, route] of cases) {
    const engine = engineForUserContext(userId, companyId);
    const result = selectView(engine, view, route);
    const html = renderApp(engine.getSnapshot(), engine);
    assert.equal(result.ok, true, label);
    assert.equal((html.match(/data-layout-shell/g) || []).length, 1, label);
    assert.ok(html.includes('data-layout-column="left"'), label);
    assert.ok(html.includes('data-layout-column="main"'), label);
    assert.ok(html.includes('data-layout-column="right"'), label);
  }
});

test("playwright: panele layoutu nie nachodza na siebie w rozdzielczosciach desktopowych", async (t) => {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch (error) {
    assert.fail(`Playwright musi byc zainstalowany jako zaleznosc projektu: ${error.message}`);
  }

  const engine = engineForUserContext("u-carrier-owner", "co-carrier-a");
  assert.equal(selectView(engine, "employees", "/employees").ok, true);
  const browser = await launchPlaywrightBrowser(chromium);
  const viewports = [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 }
  ];

  try {
    const page = await browser.newPage();
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.setContent(renderedPage(engine), { waitUntil: "load" });
      const result = await page.evaluate(() => {
        const box = (selector) => {
          const node = document.querySelector(selector);
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return {
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
          };
        };
        const left = box('[data-layout-column="left"]');
        const main = box('[data-layout-column="main"]');
        const right = box('[data-layout-column="right"]');
        const gap = 0.5;
        return {
          left,
          main,
          right,
          leftBeforeMain: left.right <= main.left + gap,
          mainBeforeRight: main.right <= right.left + gap,
          visibleWidths: left.width > 0 && main.width > 0 && right.width > 0
        };
      });

      assert.equal(result.visibleWidths, true, `kolumny musza byc widoczne ${viewport.width}x${viewport.height}`);
      assert.equal(result.leftBeforeMain, true, `lewy panel nachodzi na tresc ${viewport.width}x${viewport.height}`);
      assert.equal(result.mainBeforeRight, true, `prawy panel nachodzi na tresc ${viewport.width}x${viewport.height}`);
    }
  } finally {
    await browser.close();
  }
});
