import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OnlineQueryDemoSection } from "../components/online-demo/OnlineQueryDemo";
import type { ApiEnvelope, QueryEtasData, QueryPlacesData, QueryRoutesData } from "../services/routeQueryTypes";
import { renderWithI18n } from "./test-utils";

type EnvelopeData = QueryPlacesData | QueryRoutesData | QueryEtasData;

describe("OnlineQueryDemoSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requires candidate selection and does not submit free-text route queries", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonEnvelope({ places: [], expiresAt: "2026-06-16T12:00:00Z" }));
    renderWithI18n(<OnlineQueryDemoSection />);

    fireEvent.change(screen.getByLabelText("Origin"), { target: { value: "origin free text" } });
    fireEvent.change(screen.getByLabelText("Destination"), { target: { value: "destination free text" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect((await screen.findAllByText("Choose a place from the candidate list.")).length).toBeGreaterThanOrEqual(2);
    expect(fetchSpy).not.toHaveBeenCalledWith(
      "/api/routes/query_routes",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("selects places, submits route tokens, renders route cards, and merges ETA", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, string>;
      if (url.endsWith("/query_places")) {
        const placeName = body.query.includes("origin") ? "Origin Place" : "Destination Place";
        const token = body.query.includes("origin") ? "origin-token" : "destination-token";
        return jsonEnvelope<QueryPlacesData>({
          places: [{ placeToken: token, name: placeName, provider: "citybus", expiresAt: "2026-06-16T12:15:00Z" }],
          expiresAt: "2026-06-16T12:15:00Z",
        });
      }
      if (url.endsWith("/query_routes")) {
        expect(body).toEqual(
          expect.objectContaining({
            language: "en",
            originPlaceToken: "origin-token",
            destinationPlaceToken: "destination-token",
          }),
        );
        expect(body).not.toHaveProperty("slat");
        return jsonEnvelope<QueryRoutesData>({
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
        });
      }
      return jsonEnvelope<QueryEtasData>({
        queriedAt: "2026-06-16T12:00:01Z",
        etas: [{ etaToken: "eta-606", status: "waiting", waitMinutes: 49, updatedAt: "2026-06-16T12:00:01Z" }],
      });
    });

    renderWithI18n(<OnlineQueryDemoSection />);

    await choosePlace("Origin", "origin", "Origin Place");
    await choosePlace("Destination", "destination", "Destination Place");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("606")).toBeInTheDocument();
    expect(screen.getByText("Hing Wah Estate")).toBeInTheDocument();
    expect(screen.getByText("Yue Wan Estate")).toBeInTheDocument();
    const routeCard = screen.getByTestId("route-card");
    expect(routeCard).toHaveAttribute("data-mobile-layout", "compact");
    expect(screen.getByTestId("route-metrics")).toHaveAttribute("data-layout", "inline-label-value");
    expect(screen.getByTestId("route-metric-fare")).toHaveTextContent("Fare");
    expect(screen.getByTestId("route-metric-fare")).toHaveTextContent("$6.10");
    expect(screen.getByTestId("route-metric-duration")).toHaveTextContent("Time");
    expect(screen.getByTestId("route-metric-duration")).toHaveTextContent("10 min");
    expect(screen.getByTestId("route-metric-walking")).toHaveTextContent("Walk");
    expect(screen.getByTestId("route-metric-walking")).toHaveTextContent("266 m");
    expect(await screen.findByText("Wait 49 min")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/routes/query_etas",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("eta-606"),
      }),
    );
  });

  it("blocks same-place route search before calling the route API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      jsonEnvelope<QueryPlacesData>({
        places: [{ placeToken: "same-token", name: "Same Place", provider: "citybus", expiresAt: "2026-06-16T12:15:00Z" }],
        expiresAt: "2026-06-16T12:15:00Z",
      }),
    );
    renderWithI18n(<OnlineQueryDemoSection />);

    await choosePlace("Origin", "same", "Same Place");
    await choosePlace("Destination", "same", "Same Place");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findAllByText("Origin and destination cannot be the same.")).toHaveLength(2);
    expect(fetchSpy).not.toHaveBeenCalledWith(
      "/api/routes/query_routes",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("does not let an older route response overwrite the latest query", async () => {
    let firstRouteResolve: (response: Response) => void = () => undefined;
    const firstRoute = new Promise<Response>((resolve) => {
      firstRouteResolve = resolve;
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, string>;
      if (url.endsWith("/query_places")) {
        const token = `${body.query}-token`;
        const placeName = body.query === "d2" ? "Destination Two" : body.query === "d1" ? "Destination One" : "Origin Place";
        return jsonEnvelope<QueryPlacesData>({
          places: [{ placeToken: token, name: placeName, provider: "citybus", expiresAt: "2026-06-16T12:15:00Z" }],
          expiresAt: "2026-06-16T12:15:00Z",
        });
      }
      if (url.endsWith("/query_routes") && body.destinationPlaceToken === "d1-token") {
        return firstRoute;
      }
      if (url.endsWith("/query_routes")) {
        return jsonEnvelope<QueryRoutesData>({
          queriedAt: "2026-06-16T12:00:00Z",
          resultLimit: 20,
          routes: [routeFixture("route-new", "22X", "eta-new")],
        });
      }
      return jsonEnvelope<QueryEtasData>({ queriedAt: "2026-06-16T12:00:01Z", etas: [] });
    });

    renderWithI18n(<OnlineQueryDemoSection />);

    await choosePlace("Origin", "origin", "Origin Place");
    await choosePlace("Destination", "d1", "Destination One");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await choosePlace("Destination", "d2", "Destination Two");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));
    expect(await screen.findByText("22X")).toBeInTheDocument();

    firstRouteResolve(
      jsonEnvelope<QueryRoutesData>({
        queriedAt: "2026-06-16T11:59:00Z",
        resultLimit: 20,
        routes: [routeFixture("route-old", "11A", "eta-old")],
      }),
    );

    await waitFor(() => expect(screen.queryByText("11A")).not.toBeInTheDocument());
    expect(screen.getByText("22X")).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("renders a compact missing-stop fallback instead of empty boarding and alighting placeholders", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, string>;
      if (url.endsWith("/query_places")) {
        const placeName = body.query.includes("origin") ? "Origin Place" : "Destination Place";
        const token = body.query.includes("origin") ? "origin-token" : "destination-token";
        return jsonEnvelope<QueryPlacesData>({
          places: [{ placeToken: token, name: placeName, provider: "citybus", expiresAt: "2026-06-16T12:15:00Z" }],
          expiresAt: "2026-06-16T12:15:00Z",
        });
      }
      if (url.endsWith("/query_routes")) {
        return jsonEnvelope<QueryRoutesData>({
          queriedAt: "2026-06-16T12:00:00Z",
          resultLimit: 20,
          routes: [
            {
              ...routeFixture("route-missing", "82", "eta-missing"),
              boardingStop: { name: "" },
              alightingStop: { name: "" },
            },
          ],
        });
      }
      return jsonEnvelope<QueryEtasData>({ queriedAt: "2026-06-16T12:00:01Z", etas: [] });
    });

    renderWithI18n(<OnlineQueryDemoSection />);

    await choosePlace("Origin", "origin", "Origin Place");
    await choosePlace("Destination", "destination", "Destination Place");
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("82")).toBeInTheDocument();
    expect(screen.getByTestId("route-stop-fallback")).toHaveTextContent("Stop details unavailable");
    expect(screen.queryByText("Boarding stop")).not.toBeInTheDocument();
    expect(screen.queryByText("Alighting stop")).not.toBeInTheDocument();
  });
});

async function choosePlace(label: string, keyword: string, candidateName: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value: keyword } });
  fireEvent.click(await screen.findByRole("button", { name: candidateName }));
}

function jsonEnvelope<TData extends EnvelopeData>(data: TData): Response {
  const body: ApiEnvelope<TData> = { requestId: "test-request", data, error: null };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function routeFixture(routeId: string, routeNumber: string, etaToken: string) {
  return {
    routeId,
    operator: "citybus" as const,
    routeNumbers: [routeNumber],
    routeLabel: routeNumber,
    boardingStop: { name: "Boarding" },
    alightingStop: { name: "Alighting" },
    fare: { currency: "HKD" as const, amount: 6.1 },
    durationMinutes: 12,
    walkingDistanceMeters: 180,
    sortIndex: 0,
    etaToken,
    etaExpiresAt: "2026-06-16T12:05:00Z",
  };
}
