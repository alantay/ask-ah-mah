import { fireEvent, render, screen } from "@testing-library/react";
import { CookingMode } from "./CookingMode";

const steps = [
  { title: "Prep", body: "Chop everything." },
  { title: "Cook", body: "Fry it up." },
];

describe("CookingMode — last-step cooked marker", () => {
  const goToLastStep = () => {
    fireEvent.click(screen.getByText("Next step →"));
  };

  it("does not show the 'I made this' checkbox before the final step", () => {
    render(
      <CookingMode title="Fried Rice" steps={steps} onExit={jest.fn()} onCookedChange={jest.fn()} />,
    );
    expect(screen.queryByRole("checkbox", { name: "I made this" })).not.toBeInTheDocument();
  });

  it("shows the checkbox on the final step and 'Done — all finished!' exits", () => {
    const onExit = jest.fn();
    render(
      <CookingMode title="Fried Rice" steps={steps} onExit={onExit} onCookedChange={jest.fn()} />,
    );

    goToLastStep();
    expect(screen.getByRole("checkbox", { name: "I made this" })).toBeInTheDocument();

    fireEvent.click(screen.getByText("Done — all finished!"));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("ticking the checkbox fires onCookedChange(true) without exiting", () => {
    const onExit = jest.fn();
    const onCookedChange = jest.fn();
    render(
      <CookingMode
        title="Fried Rice"
        steps={steps}
        onExit={onExit}
        cooked={false}
        onCookedChange={onCookedChange}
      />,
    );

    goToLastStep();
    fireEvent.click(screen.getByRole("checkbox", { name: "I made this" }));

    expect(onCookedChange).toHaveBeenCalledWith(true);
    expect(onExit).not.toHaveBeenCalled();
  });

  it("un-ticking an already-cooked dish fires onCookedChange(false)", () => {
    const onCookedChange = jest.fn();
    render(
      <CookingMode
        title="Fried Rice"
        steps={steps}
        onExit={jest.fn()}
        cooked
        onCookedChange={onCookedChange}
      />,
    );

    goToLastStep();
    const checkbox = screen.getByRole("checkbox", { name: "I made this" });
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(onCookedChange).toHaveBeenCalledWith(false);
  });

  it("omits the checkbox when the consumer can't persist it (no onCookedChange)", () => {
    render(<CookingMode title="Fried Rice" steps={steps} onExit={jest.fn()} />);

    goToLastStep();
    expect(screen.queryByRole("checkbox", { name: "I made this" })).not.toBeInTheDocument();
    expect(screen.getByText("Done — all finished!")).toBeInTheDocument();
  });
});
