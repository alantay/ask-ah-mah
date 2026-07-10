import { hasSeenSignInNudge, markSignInNudgeSeen } from "./signInNudge";

describe("signInNudge", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("has not been seen by default", () => {
    expect(hasSeenSignInNudge("first-save")).toBe(false);
  });

  it("is seen after being marked", () => {
    markSignInNudgeSeen("first-save");
    expect(hasSeenSignInNudge("first-save")).toBe(true);
  });

  it("keeps different nudge keys independent", () => {
    markSignInNudgeSeen("first-save");
    expect(hasSeenSignInNudge("finish-moment")).toBe(false);
  });

  it("does not throw when localStorage is unavailable", () => {
    const original = window.localStorage.getItem;
    window.localStorage.getItem = () => {
      throw new Error("private mode");
    };
    expect(() => hasSeenSignInNudge("first-save")).not.toThrow();
    expect(hasSeenSignInNudge("first-save")).toBe(false);
    window.localStorage.getItem = original;
  });

  it("does not throw when localStorage.setItem fails", () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error("private mode");
    };
    expect(() => markSignInNudgeSeen("first-save")).not.toThrow();
    window.localStorage.setItem = original;
  });
});
