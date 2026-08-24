import { expect, test } from "@playwright/test";

async function expectMobilePlaceGeometry(page: import("@playwright/test").Page) {
  const controls = page.getByTestId("journey-place-controls");
  const stack = page.getByTestId("journey-input-stack");
  const swap = controls.getByRole("button", { name: /Swap origin and destination|交換起點和終點|交换起点和终点/ });
  const [controlsBox, stackBox, swapBox] = await Promise.all([
    controls.boundingBox(),
    stack.boundingBox(),
    swap.boundingBox(),
  ]);
  expect(controlsBox).not.toBeNull();
  expect(stackBox).not.toBeNull();
  expect(swapBox).not.toBeNull();
  expect(swapBox!.width).toBeGreaterThanOrEqual(44);
  expect(swapBox!.height).toBeGreaterThanOrEqual(44);
  expect(swapBox!.x).toBeGreaterThanOrEqual(stackBox!.x + stackBox!.width + 8);
  expect(Math.abs((swapBox!.y + swapBox!.height / 2) - (stackBox!.y + 64))).toBeLessThanOrEqual(2);
  expect(swapBox!.x + swapBox!.width).toBeLessThanOrEqual(controlsBox!.x + controlsBox!.width + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test("mobile journey inputs keep the swap control on their right in default, candidate, and error states", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "desktop-1440", "mobile geometry contract");
  let failPlaceSearch = false;
  await page.route("**/api/routes/query_places", async (route) => {
    if (failPlaceSearch) {
      await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ requestId: "places-error", data: null, error: { code: "EXTERNAL_SERVICE_UNAVAILABLE", message: "unavailable" } }) });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ requestId: "places-ok", data: { places: [{ placeToken: "place-1", name: "晨灣匯", provider: "citybus", expiresAt: "2026-08-25T12:15:00Z" }], expiresAt: "2026-08-25T12:15:00Z" }, error: null }),
    });
  });

  await page.goto("/zh-hant/#route-trial");
  await page.locator("#route-trial").evaluate((element) => element.scrollIntoView({ block: "start" }));
  await expectMobilePlaceGeometry(page);

  const origin = page.getByRole("combobox", { name: "起點" });
  await origin.fill("晨灣");
  await expect(page.getByTestId("origin-place-dropdown")).toBeVisible();
  await expectMobilePlaceGeometry(page);
  await page.getByRole("option", { name: "晨灣匯" }).click();
  await expectMobilePlaceGeometry(page);

  failPlaceSearch = true;
  await page.getByRole("combobox", { name: "目的地" }).fill("錯誤地點");
  await expect(page.getByText("地點搜尋暫不可用，請稍後再試。")).toBeVisible();
  await expectMobilePlaceGeometry(page);
});

test("online query selects places, shows loading, renders route cards, and updates ETA", async ({ page }) => {
  const longOriginStop = "Very Long Origin Stop Name Near Hing Wah Estate Bus Terminus";
  const longDestinationStop = "Very Long Destination Stop Name Near Yue Wan Estate Shopping Centre";
  await page.route("**/api/routes/query_places", async (route) => {
    const body = route.request().postDataJSON() as { query: string };
    const isOrigin = body.query.toLowerCase().includes("origin");
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        requestId: "pw-places",
        data: {
          places: [
            {
              placeToken: isOrigin ? "origin-token" : "destination-token",
              name: isOrigin ? "Origin Place" : "Destination Place",
              provider: "citybus",
              expiresAt: "2026-06-16T12:15:00Z",
            },
          ],
          expiresAt: "2026-06-16T12:15:00Z",
        },
        error: null,
      }),
    });
  });

  await page.route("**/api/routes/query_routes", async (route) => {
    const body = route.request().postDataJSON() as { language: string };
    if (body.language !== "en") {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          requestId: "pw-routes-failed",
          data: null,
          error: { code: "EXTERNAL_SERVICE_UNAVAILABLE", message: "route query unavailable" },
        }),
      });
      return;
    }
    await page.waitForTimeout(180);
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        requestId: "pw-routes",
        data: {
          queriedAt: "2026-06-16T12:00:00Z",
          resultLimit: 20,
          routes: [
            {
              routeId: "route-606",
              operator: "citybus",
              routeNumbers: ["606"],
              routeLabel: "606",
              boardingStop: { name: longOriginStop },
              alightingStop: { name: longDestinationStop },
              fare: { currency: "HKD", amount: 6.1 },
              durationMinutes: 10,
              walkingDistanceMeters: 266,
              sortIndex: 0,
              etaToken: "eta-606",
              etaExpiresAt: "2026-06-16T12:05:00Z",
            },
          ],
        },
        error: null,
      }),
    });
  });

  await page.route("**/api/routes/query_etas", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        requestId: "pw-etas",
        data: {
          queriedAt: "2026-06-16T12:00:01Z",
          etas: [{ etaToken: "eta-606", status: "waiting", waitMinutes: 49, updatedAt: "2026-06-16T12:00:01Z" }],
        },
        error: null,
      }),
    });
  });

  await page.goto("/en/#route-trial");
  await expect(page.getByTestId("online-query-demo")).toBeVisible();
  await page.locator("#route-trial").evaluate((element) => element.scrollIntoView({ block: "start" }));

  await page.getByLabel(/Origin|出發地|出发地/).fill("origin");
  await expect(page.getByTestId("origin-place-dropdown")).toBeVisible();
  await page.getByRole("option", { name: "Origin Place" }).click();
  await page.getByLabel(/Destination|目的地/).fill("destination");
  await expect(page.getByTestId("destination-place-dropdown")).toBeVisible();
  await page.getByRole("option", { name: "Destination Place" }).click();

  await page.getByTestId("online-query-demo").getByRole("button", { name: /Compare bus routes|比較巴士路線|比较巴士路线/ }).click();
  await expect(page.getByTestId("route-loading")).toBeVisible();
  await expect(page.getByText("606")).toBeVisible();
  await expect(page.getByText(longOriginStop)).toBeVisible();
  await expect(page.getByText(longDestinationStop)).toBeVisible();
  await expect(page.getByTestId("route-origin-stop")).toHaveAttribute("title", longOriginStop);
  await expect(page.getByTestId("route-destination-stop")).toHaveAttribute("title", longDestinationStop);
  const originStopBox = await page.getByTestId("route-origin-stop").boundingBox();
  const destinationStopBox = await page.getByTestId("route-destination-stop").boundingBox();
  expect(originStopBox?.height ?? 99).toBeLessThan(24);
  expect(destinationStopBox?.height ?? 99).toBeLessThan(24);
  await expect(page.getByTestId("route-card")).toBeVisible();
  await expect(page.getByTestId("route-metrics")).toContainText("Fare");
  await expect(page.getByTestId("route-metrics")).toContainText("$6.10");
  await expect(page.getByTestId("route-metrics")).toContainText("Time 10 min");
  await expect(page.getByTestId("route-metrics")).toContainText("Walk 266 m");
  await expect(page.getByTestId("route-card")).not.toContainText(/Direct|Transfer|直達|转乘|轉乘/);
  await expect(page.getByText(/Wait 49 min|等候 49/)).toBeVisible();
  await page.locator("#route-trial").evaluate((element) => element.scrollIntoView({ block: "start" }));


  await page.getByRole("navigation", { name: "Choose language" }).getByRole("link", { name: /简/ }).click();
  await expect(page.getByText(/暂未更新，仍显示上次结果|Not refreshed — showing the previous result/)).toBeVisible();
  await page.locator("#route-trial").evaluate((element) => element.scrollIntoView({ block: "start" }));
});
