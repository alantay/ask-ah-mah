import { act, renderHook } from "@testing-library/react";
import { useCyclingIndex } from "./useCyclingIndex";

describe("useCyclingIndex", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("starts at 0", () => {
    const { result } = renderHook(() => useCyclingIndex(3));
    expect(result.current).toBe(0);
  });

  it("stays at 0 when count <= 1 (guards against % 0)", () => {
    const { result, rerender } = renderHook(({ c }) => useCyclingIndex(c), {
      initialProps: { c: 1 },
    });
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current).toBe(0);

    rerender({ c: 0 });
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current).toBe(0);
  });

  it("advances one step per interval then holds on the last item (non-loop)", () => {
    const { result } = renderHook(() => useCyclingIndex(3, { intervalMs: 1000 }));

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(1);

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(2);

    // Holds on count-1 and never overshoots.
    act(() => jest.advanceTimersByTime(3000));
    expect(result.current).toBe(2);
  });

  it("wraps back to 0 and keeps cycling when loop is true", () => {
    const { result } = renderHook(() =>
      useCyclingIndex(3, { intervalMs: 1000, loop: true }),
    );

    act(() => jest.advanceTimersByTime(2000));
    expect(result.current).toBe(2);

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(0);

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(1);
  });

  it("resets to 0 when count changes", () => {
    const { result, rerender } = renderHook(({ c }) => useCyclingIndex(c, { intervalMs: 1000 }), {
      initialProps: { c: 3 },
    });

    act(() => jest.advanceTimersByTime(2000));
    expect(result.current).toBe(2);

    rerender({ c: 5 });
    expect(result.current).toBe(0);

    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(1);
  });

  it("honors a custom intervalMs", () => {
    const { result } = renderHook(() => useCyclingIndex(3, { intervalMs: 500 }));

    act(() => jest.advanceTimersByTime(400));
    expect(result.current).toBe(0);

    act(() => jest.advanceTimersByTime(100));
    expect(result.current).toBe(1);
  });
});
