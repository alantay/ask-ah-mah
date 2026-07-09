import { fireEvent, render, screen } from "@testing-library/react";
import { ShareCta } from "./ShareCta";

describe("ShareCta", () => {
  it("renders the share prompt and calls onShare when tapped", () => {
    const onShare = jest.fn();
    render(<ShareCta onShare={onShare} />);
    fireEvent.click(screen.getByText(/Cooked this for someone/));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it("dismisses and stops rendering when the close button is tapped", () => {
    render(<ShareCta onShare={jest.fn()} />);
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(screen.queryByText(/Cooked this for someone/)).not.toBeInTheDocument();
  });

  it("disables the share action while sharing is in flight", () => {
    render(<ShareCta onShare={jest.fn()} sharing />);
    expect(screen.getByText(/Cooked this for someone/).closest("button")).toBeDisabled();
  });
});
