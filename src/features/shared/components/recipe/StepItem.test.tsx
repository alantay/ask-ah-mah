import { render, screen } from "@testing-library/react";

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

describe("uses chip row", () => {
  it("renders a chip per use, scaling numeric amounts by ratio and leaving text uses unscaled", () => {
    render(
      <StepItem
        n={1}
        ratio={2}
        step={{
          title: "Thicken the sauce",
          body: "Stir in the slurry.",
          uses: [
            { name: "cornstarch slurry", amount: "2", unit: "tbsp" },
            { name: "cornstarch slurry", text: "remaining" },
          ],
        }}
      />,
    );
    expect(screen.getByText(/4 tbsp cornstarch slurry/)).toBeInTheDocument();
    expect(screen.getByText(/remaining cornstarch slurry/)).toBeInTheDocument();
  });

  it("omits the chip row when the step has no uses", () => {
    render(<StepItem n={1} step={step} />);
    expect(screen.queryByTestId("step-uses")).not.toBeInTheDocument();
  });
});
