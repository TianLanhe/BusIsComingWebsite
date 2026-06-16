import { expect, test } from "@playwright/test";

test("online query selects places, shows loading, renders route cards, and updates ETA", async ({ page }, testInfo) => {
  const visualPrefix = `../specs/004-online-bus-query/visual-review/${testInfo.project.name}`;
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
              boardingStop: { name: "Hing Wah Estate" },
              alightingStop: { name: "Yue Wan Estate" },
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

  await page.goto("/#online-query");
  await expect(page.getByTestId("online-query-demo")).toBeVisible();
  await page.locator("#online-query").evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.screenshot({
    path: `${visualPrefix}-online-query-v2.png`,
    fullPage: false,
  });

  await page.getByLabel(/Origin|出發地|出发地/).fill("origin");
  await expect(page.getByTestId("origin-place-dropdown")).toBeVisible();
  await page.screenshot({
    path: `${visualPrefix}-place-dropdown.png`,
    fullPage: false,
  });
  await page.getByRole("button", { name: "Origin Place" }).click();
  await page.getByLabel(/Destination|目的地/).fill("destination");
  await expect(page.getByTestId("destination-place-dropdown")).toBeVisible();
  await page.getByRole("button", { name: "Destination Place" }).click();

  await page.getByRole("button", { name: /Search|查詢|查询/ }).click();
  await expect(page.getByTestId("route-loading")).toBeVisible();
  await expect(page.getByText("606")).toBeVisible();
  await expect(page.getByText("Hing Wah Estate")).toBeVisible();
  await expect(page.getByText("Yue Wan Estate")).toBeVisible();
  await expect(page.getByText(/Wait 49 min|等候 49/)).toBeVisible();
  await page.locator("#online-query").evaluate((element) => element.scrollIntoView({ block: "start" }));

  await page.screenshot({
    path: `${visualPrefix}-route-results.png`,
    fullPage: false,
  });

  await page.getByRole("button", { name: "简" }).click();
  await expect(page.getByText(/仍显示上次成功查询结果|Still showing the last successful results/)).toBeVisible();
  await page.locator("#online-query").evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.screenshot({
    path: testInfo.project.name === "desktop-1440" ? `${visualPrefix}-error-retained.png` : `${visualPrefix}-error-empty.png`,
    fullPage: false,
  });
});
