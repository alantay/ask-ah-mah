import { fireEvent, render, screen } from "@testing-library/react";
import { CookingMode } from "./CookingMode";

const steps = [
  { title: "Prep", body: "Chop everything." },
  { title: "Cook", body: "Fry it up." },
];

describe("CookingMode — finish moment", () => {
  const goToLastStep = () => {
    fireEvent.click(screen.getByText("Next step →"));
  };

  it("does not show 'I made this' before the final step", () => {
    render(<CookingMode title="Fried Rice" steps={steps} onExit={jest.fn()} onMadeIt={jest.fn()} />);
    expect(screen.queryByText("I made this")).not.toBeInTheDocument();
  });

  it("tapping 'I made this' on the final step fires onMadeIt then onExit", () => {
    const onExit = jest.fn();
    const onMadeIt = jest.fn();
    render(<CookingMode title="Fried Rice" steps={steps} onExit={onExit} onMadeIt={onMadeIt} />);

    goToLastStep();
    fireEvent.click(screen.getByText("I made this"));

    expect(onMadeIt).toHaveBeenCalledTimes(1);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("tapping 'Back to recipe' on the final step fires only onExit", () => {
    const onExit = jest.fn();
    const onMadeIt = jest.fn();
    render(<CookingMode title="Fried Rice" steps={steps} onExit={onExit} onMadeIt={onMadeIt} />);

    goToLastStep();
    fireEvent.click(screen.getByText("Back to recipe"));

    expect(onMadeIt).not.toHaveBeenCalled();
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("works without an onMadeIt handler (persisted recipe consumer may omit it)", () => {
    const onExit = jest.fn();
    render(<CookingMode title="Fried Rice" steps={steps} onExit={onExit} />);

    goToLastStep();
    fireEvent.click(screen.getByText("I made this"));

    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
