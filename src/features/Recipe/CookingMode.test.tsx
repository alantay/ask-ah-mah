import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("CookingMode — finish-moment share prompt", () => {
  const goToLastStep = () => fireEvent.click(screen.getByText("Next step →"));

  it("does not show the share prompt before cooked is ticked", () => {
    render(
      <CookingMode
        title="Fried Rice"
        steps={steps}
        onExit={jest.fn()}
        cooked={false}
        onCookedChange={jest.fn()}
        onShare={jest.fn()}
      />,
    );
    goToLastStep();
    expect(screen.queryByText(/Cooked this for someone/)).not.toBeInTheDocument();
  });

  it("shows the share prompt right after ticking cooked, and calls onShare when tapped", () => {
    const onShare = jest.fn();
    render(
      <CookingMode
        title="Fried Rice"
        steps={steps}
        onExit={jest.fn()}
        cooked={false}
        onCookedChange={jest.fn()}
        onShare={onShare}
      />,
    );
    goToLastStep();
    fireEvent.click(screen.getByRole("checkbox", { name: "I made this" }));

    expect(screen.getByText(/Cooked this for someone/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Cooked this for someone/));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it("does not show the prompt when an already-cooked recipe mounts with cooked=true", () => {
    render(
      <CookingMode
        title="Fried Rice"
        steps={steps}
        onExit={jest.fn()}
        cooked
        onCookedChange={jest.fn()}
        onShare={jest.fn()}
      />,
    );
    goToLastStep();
    expect(screen.queryByText(/Cooked this for someone/)).not.toBeInTheDocument();
  });

  it("omits the share prompt entirely when onShare is not provided", () => {
    render(
      <CookingMode
        title="Fried Rice"
        steps={steps}
        onExit={jest.fn()}
        cooked={false}
        onCookedChange={jest.fn()}
      />,
    );
    goToLastStep();
    fireEvent.click(screen.getByRole("checkbox", { name: "I made this" }));
    expect(screen.queryByText(/Cooked this for someone/)).not.toBeInTheDocument();
  });
});

describe("CookingMode — Step Uses inline hints", () => {
  it("turns a matched ingredient mention into a hoverable hint, scaled by servingsRatio", async () => {
    render(
      <CookingMode
        title="Fried Rice"
        steps={[
          { title: "Prep", body: "Chop everything." },
          {
            title: "Thicken",
            body: "Stir in the slurry.",
            uses: [{ name: "slurry", amount: "2", unit: "tbsp" }],
          },
        ]}
        servingsRatio={2}
        onExit={jest.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Next step →"));

    const hint = screen.getByText("slurry");
    expect(hint.tagName).toBe("BUTTON");
    await userEvent.hover(hint);
    expect(await screen.findByText("4 tbsp")).toBeInTheDocument();
  });

  it("renders plain body text on steps without uses (e.g. prep-synthesized steps)", () => {
    render(
      <CookingMode
        title="Fried Rice"
        steps={[{ title: "Cook", body: "Fry it up." }]}
        prep={["Dice the onion"]}
        onExit={jest.fn()}
      />,
    );
    const matches = screen.getAllByText("Dice the onion");
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((el) => el.tagName !== "BUTTON")).toBe(true);
  });
});
