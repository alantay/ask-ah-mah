import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 800));
    expect(result.current).toBe("a");
  });

  it("holds the old value until the delay elapses", () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDebouncedValue(v, 800),
      { initialProps: { v: "a" } },
    );

    rerender({ v: "b" });
    expect(result.current).toBe("a");

    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(result.current).toBe("b");
  });

  // The behaviour Task 5 relies on: a burst settles to one value, once.
  it("collapses a burst of changes into a single settled value", () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDebouncedValue(v, 800),
      { initialProps: { v: 1 } },
    );

    for (const v of [2, 3, 4]) {
      rerender({ v });
      act(() => {
        jest.advanceTimersByTime(400); // never long enough to fire
      });
    }
    expect(result.current).toBe(1);

    act(() => {
      jest.advanceTimersByTime(800);
    });
    expect(result.current).toBe(4);
  });

  it("compares by reference — a new array with equal contents still settles", () => {
    const first = ["a"];
    const { result, rerender } = renderHook(
      ({ v }) => useDebouncedValue(v, 800),
      { initialProps: { v: first } },
    );

    const second = ["a"];
    rerender({ v: second });
    act(() => {
      jest.advanceTimersByTime(800);
    });

    expect(result.current).toBe(second);
  });
});
