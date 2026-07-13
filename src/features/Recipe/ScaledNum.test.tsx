import { render, screen } from "@testing-library/react";
import { ScaledNum } from "./ScaledNum";

describe("ScaledNum", () => {
  it("renders its children", () => {
    render(<ScaledNum>250g</ScaledNum>);
    expect(screen.getByText("250g")).toBeInTheDocument();
  });

  it("carries the pulse class", () => {
    render(<ScaledNum>1 cup</ScaledNum>);
    expect(screen.getByText("1 cup")).toHaveClass("scaled-num-pulse");
  });

  it("keeps the same DOM node when the value is unchanged", () => {
    const { rerender } = render(<ScaledNum>2 tbsp</ScaledNum>);
    const first = screen.getByText("2 tbsp");

    rerender(<ScaledNum>2 tbsp</ScaledNum>);
    expect(screen.getByText("2 tbsp")).toBe(first);
  });

  it("remounts (bumps the key) when the value changes to retrigger the pulse", () => {
    const { rerender } = render(<ScaledNum>100g</ScaledNum>);
    const first = screen.getByText("100g");

    rerender(<ScaledNum>200g</ScaledNum>);
    const next = screen.getByText("200g");

    expect(next).not.toBe(first);
    expect(next).toHaveClass("scaled-num-pulse");
  });
});
