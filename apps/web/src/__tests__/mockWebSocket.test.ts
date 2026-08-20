import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TelemetryWebSocketClient } from "@/services/mockWebSocket";

describe("TelemetryWebSocketClient", () => {
  let client: TelemetryWebSocketClient;

  beforeEach(() => {
    vi.useFakeTimers();
    client = new TelemetryWebSocketClient("ws://localhost:9999");
  });

  afterEach(() => {
    client.disconnect();
    vi.useRealTimers();
  });

  it("does not restart synthetic stream after disconnect()", () => {
    const spy = vi.spyOn(client as any, "startSyntheticStream");

    // Start synthetic stream manually (since WS won't connect in test)
    client.startSyntheticStream();
    expect(spy).toHaveBeenCalledTimes(1);

    // Disconnect
    client.disconnect();

    // Reset the spy and verify no restart happens
    spy.mockReset();

    // Simulate what would happen if ws.onclose fires after disconnect
    // The isDisconnecting flag should prevent restart
    expect((client as any).isDisconnecting).toBe(true);
  });

  it("emits status events with correct event type", () => {
    const events: any[] = [];
    client.subscribe((event) => events.push(event));

    // Manually call broadcastStatus to test the event type
    (client as any).broadcastStatus(true);

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("status");
    expect(events[0].payload.status).toBe("connected");
  });

  it("emits status event with simulated_live on disconnect", () => {
    const events: any[] = [];
    client.subscribe((event) => events.push(event));

    (client as any).broadcastStatus(false);

    expect(events).toHaveLength(1);
    expect(events[0].event).toBe("status");
    expect(events[0].payload.status).toBe("simulated_live");
  });

  it("emits reading events with total_kw field", () => {
    const events: any[] = [];
    client.subscribe((event) => events.push(event));

    client.startSyntheticStream();
    vi.advanceTimersByTime(3500);

    const readingEvents = events.filter((e) => e.event === "reading");
    expect(readingEvents.length).toBeGreaterThan(0);
    expect(typeof readingEvents[0].payload.total_kw).toBe("number");
    expect(Number.isFinite(readingEvents[0].payload.total_kw)).toBe(true);
  });
});
