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

describe("CookingMode — visible Step Uses quantities", () => {
  it("shows a scaled quantity beside the ingredient without requiring a tap", () => {
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

    expect(screen.getByText("slurry (4 tbsp)")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "slurry" })).not.toBeInTheDocument();
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

describe("CookingMode — prep and method phases", () => {
  it("keeps mandatory prep in the flow while restarting the method counter at Step 1", () => {
    render(
      <CookingMode
        title="Fried Rice"
        prep={["Dice the onion", "Mince the garlic"]}
        steps={[
          { title: "Fry the aromatics", body: "Cook the prepared onion and garlic." },
          { title: "Finish the rice", body: "Add the rice and toss." },
        ]}
        onExit={jest.fn()}
      />,
    );

    expect(screen.getByText("Prep 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Before you start")).toBeInTheDocument();
    expect(screen.getByText("Prep", { exact: true })).toBeInTheDocument();
    expect(screen.getByLabelText("Prep task 1")).toBeInTheDocument();
    expect(screen.getByText("Next prep →")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Next prep →"));
    expect(screen.getByText("Prep 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("Start cooking →")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Start cooking →"));
    expect(screen.getByText("Step 1 of 2")).toBeInTheDocument();
    expect(screen.getByText("Cooking")).toBeInTheDocument();
    expect(screen.getByLabelText("Step 1")).toBeInTheDocument();
    expect(screen.getByText("Next step →")).toBeInTheDocument();
  });
});


it("opens with focus on the step heading and supports Escape", async () => {
  const user = userEvent.setup();
  const exit = jest.fn();
  render(<CookingMode title="Rice" steps={steps} onExit={exit} />);
  expect(screen.getByRole("dialog", { name: "Rice" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Prep" })).toHaveFocus();
  await user.keyboard("{Escape}");
  expect(exit).toHaveBeenCalledTimes(1);
});

it("resumes at the supplied step and reports navigation", () => {
  const onStepChange = jest.fn();
  render(<CookingMode title="Rice" steps={steps} initialStep={1} onStepChange={onStepChange} onExit={jest.fn()} />);
  expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 2");
  fireEvent.click(screen.getByRole("button", { name: /Prev/ }));
  expect(onStepChange).toHaveBeenLastCalledWith(0);
});

it("keeps a resumed step within a shortened recipe", () => {
  render(<CookingMode title="Rice" steps={steps} initialStep={10} onExit={jest.fn()} />);
  expect(screen.getByRole("status")).toHaveTextContent("Step 2 of 2");
});
