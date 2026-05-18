import { fireEvent, render, screen, within } from "@testing-library/react";
import RecipeList from "./RecipeList";

jest.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="streamdown">{children}</div>
  ),
}));

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "user-1" }),
}));

const mockRecipes = [
  {
    id: "r1",
    userId: "user-1",
    name: "Test Recipe",
    instructions: "",
    tags: ["easy"],
    recipeId: "msg-1",
    baseServings: 2,
    ingredients: [{ name: "egg", amount: 2, unit: "piece" }],
    steps: [
      { title: "Step one", body: "Do the first thing." },
      { title: "Step two", body: "Do the second thing." },
    ],
  },
];

jest.mock("swr", () => {
  const actual = jest.requireActual("swr");
  return {
    __esModule: true,
    ...actual,
    default: () => ({ data: mockRecipes, isLoading: false }),
    mutate: jest.fn(),
  };
});

describe("RecipeList — start cooking flow", () => {
  it("closes the recipe modal and surfaces CookingMode when Start cooking is clicked", () => {
    render(<RecipeList />);

    // Open the recipe modal
    fireEvent.click(screen.getByText("Test Recipe"));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText(/Start cooking/)).toBeInTheDocument();

    // Click Start cooking
    fireEvent.click(within(dialog).getByLabelText(/Start cooking/));

    // Dialog should be gone, CookingMode should be visible
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText(/Exit cooking mode/i)).toBeInTheDocument();
    expect(screen.getByText("Step one")).toBeInTheDocument();
  });

  it("advances to the next step when Next step is clicked from CookingMode", () => {
    render(<RecipeList />);
    fireEvent.click(screen.getByText("Test Recipe"));
    fireEvent.click(within(screen.getByRole("dialog")).getByLabelText(/Start cooking/));

    expect(screen.getByText("Step one")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Next step/i }));
    expect(screen.getByText("Step two")).toBeInTheDocument();
  });
});
