import { lastSavedLabel } from "./lastSavedLabel";

// Saturday 4 Oct 2026, mid-afternoon local time
const now = new Date(2026, 9, 4, 15, 0);

describe("lastSavedLabel", () => {
  it("says today for earlier the same day", () => {
    expect(lastSavedLabel(new Date(2026, 9, 4, 0, 5), now)).toBe("today");
  });

  it("says yesterday across midnight, not by 24h", () => {
    expect(lastSavedLabel(new Date(2026, 9, 3, 23, 50), now)).toBe("yesterday");
  });

  it("names the weekday within the last week", () => {
    expect(lastSavedLabel(new Date(2026, 9, 1, 12, 0), now)).toBe("Thursday");
  });

  it("gives a date once a weekday would be ambiguous", () => {
    expect(lastSavedLabel(new Date(2026, 8, 27, 12, 0), now)).toBe("27 Sept");
  });

  it("adds the year for an earlier year", () => {
    expect(lastSavedLabel(new Date(2025, 11, 20, 12, 0), now)).toBe("20 Dec 2025");
  });
});
