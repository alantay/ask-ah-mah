import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DottedList } from "./DottedList";

describe("DottedList", () => {
  it("renders items as plain text when uses is omitted (notes usage)", () => {
    render(<DottedList items={["Best eaten fresh, but keeps 2 days chilled."]} />);
    expect(
      screen.getByText("Best eaten fresh, but keeps 2 days chilled."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  describe("prep uses (mise en place hints)", () => {
    it("turns a matched ingredient mention into a hoverable hint showing the scaled total", async () => {
      render(
        <DottedList
          items={["Rinse glutinous rice until water runs nearly clear."]}
          ratio={2}
          uses={[{ name: "glutinous rice", amount: "2", unit: "cups" }]}
        />,
      );
      const hint = screen.getByText("glutinous rice");
      expect(hint.tagName).toBe("BUTTON");
      expect(screen.queryByText("4 cups")).not.toBeInTheDocument();

      await userEvent.hover(hint);
      expect(await screen.findByText("4 cups")).toBeInTheDocument();
    });

    it("renders an ingredient with no amount as plain text (no empty popover)", () => {
      render(
        <DottedList
          items={["Season with salt to taste."]}
          uses={[{ name: "salt" }]}
        />,
      );
      expect(screen.getByText("Season with salt to taste.")).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
