import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { StepItem } from "./StepItem";

const step = {
  title: "Heat the pan",
  body: "Put butter in a pan on medium heat.",
  tip: "Don't let it brown.",
};

describe("StepItem", () => {
  it("renders title, body and an em-dashed tip", () => {
    render(<StepItem n={1} step={step} />);
    expect(screen.getByText("Heat the pan")).toBeInTheDocument();
    expect(
      screen.getByText("Put butter in a pan on medium heat."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Don't let it brown\./)).toBeInTheDocument();
  });

  it("omits the tip when the step has none", () => {
    render(<StepItem n={2} step={{ title: "Add eggs", body: "Pour in." }} />);
    expect(screen.queryByText(/—/)).not.toBeInTheDocument();
  });

  describe("quiet register (cookbook)", () => {
    it("renders a mono '<n>.' marker", () => {
      render(<StepItem n={3} step={step} marker="quiet" />);
      expect(screen.getByText("3.")).toBeInTheDocument();
    });

    it("forwards `as` and extra props to the wrapper element", () => {
      render(
        <ol>
          <StepItem
            n={1}
            step={step}
            marker="quiet"
            as="li"
            data-tweak-row="step-0"
          />
        </ol>,
      );
      const li = document.querySelector('li[data-tweak-row="step-0"]');
      expect(li).toBeInTheDocument();
      expect(li?.tagName).toBe("LI");
    });
  });

  describe("stamp register (chat letter)", () => {
    it("renders the numbered ink-stamp badge", () => {
      render(<StepItem n={4} step={step} marker="stamp" />);
      expect(screen.getByText("4")).toBeInTheDocument();
    });
  });
});

describe("step uses (inline hints)", () => {
  it("turns a matched ingredient mention into a hoverable hint showing the scaled amount", async () => {
    render(
      <StepItem
        n={1}
        ratio={2}
        step={{
          title: "Make the savory filling",
          body: "Heat cooking oil in a small pan, sauté the garlic until fragrant.",
          uses: [{ name: "cooking oil", amount: "1", unit: "tbsp" }],
        }}
      />,
    );
    const hint = screen.getByText("cooking oil");
    expect(hint.tagName).toBe("BUTTON");
    expect(screen.queryByText("2 tbsp")).not.toBeInTheDocument();

    await userEvent.hover(hint);
    expect(await screen.findByText("2 tbsp")).toBeInTheDocument();
  });

  it("renders free-text uses (e.g. \"remaining\") unscaled", async () => {
    render(
      <StepItem
        n={1}
        ratio={2}
        step={{
          title: "Finish the sauce",
          body: "Stir in the remaining slurry.",
          uses: [{ name: "slurry", text: "remaining" }],
        }}
      />,
    );
    await userEvent.hover(screen.getByText("slurry"));
    expect(await screen.findByText("remaining")).toBeInTheDocument();
  });

  it("silently drops a use whose name isn't mentioned in the step body", () => {
    render(
      <StepItem
        n={1}
        step={{
          title: "Finish the sauce",
          body: "Stir it in and simmer.",
          uses: [{ name: "cornstarch slurry", amount: "2", unit: "tbsp" }],
        }}
      />,
    );
    expect(screen.getByText("Stir it in and simmer.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders plain body text when the step has no uses", () => {
    render(<StepItem n={1} step={step} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
