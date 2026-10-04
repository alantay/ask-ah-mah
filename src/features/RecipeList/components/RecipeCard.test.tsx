import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecipeWithId } from "@/lib/recipes/schemas";
import RecipeCard from "./RecipeCard";

const recipe = { id: "r1", name: "Egg rice", ingredients: [], tags: [] } as unknown as RecipeWithId;

it("puts the recipe link before deletion in keyboard order", async () => {
  const user = userEvent.setup();
  const onDelete = jest.fn();
  render(<RecipeCard recipe={recipe} onDelete={onDelete} />);
  await user.tab();
  expect(screen.getByRole("link", { name: "Egg rice" })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "Delete Egg rice" })).toHaveFocus();
  await user.keyboard("{Enter}");
  expect(onDelete).toHaveBeenCalledWith("r1", screen.getByRole("button"));
});
