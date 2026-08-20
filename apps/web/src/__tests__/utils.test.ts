import { describe, it, expect } from "vitest";
import { toHHMM } from "@/lib/utils";

describe("toHHMM", () => {
  it("passes through HH:MM strings unchanged", () => {
    expect(toHHMM("06:00")).toBe("06:00");
    expect(toHHMM("00:00")).toBe("00:00");
    expect(toHHMM("18:30")).toBe("18:30");
  });

  it("pads single-digit hour", () => {
    expect(toHHMM("6:00")).toBe("06:00");
    expect(toHHMM("9:45")).toBe("09:45");
  });

  it("normalizes ISO 8601 timestamps to HH:MM", () => {
    const iso = "2017-01-01T00:15:00.000";
    const result = toHHMM(iso);
    // Should produce a valid HH:MM string
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("handles ISO 8601 with timezone offset", () => {
    const iso = "2026-08-14T06:00:00+05:30";
    const result = toHHMM(iso);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it("returns empty string for empty input", () => {
    expect(toHHMM("")).toBe("");
  });

  it("returns original for unparseable input", () => {
    expect(toHHMM("not-a-date")).toBe("not-a-date");
  });
});
