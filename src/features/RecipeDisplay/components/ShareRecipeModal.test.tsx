import { render, screen, waitFor } from "@testing-library/react";
import { ShareRecipeModal } from "./ShareRecipeModal";
import type { RecipeWithId } from "@/lib/recipes/schemas";

jest.mock("@/contexts/SessionContext", () => ({
  useSessionContext: () => ({ userId: "user-1" }),
}));

const RECIPE: RecipeWithId = {
  id: "recipe-1",
  userId: "user-1",
  name: "Fried Rice",
  instructions: "",
  baseServings: 2,
  ingredients: [],
  imageUrl: null,
};

describe("ShareRecipeModal", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ token: "tok1" }) }) as never;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("mints a share link on open and populates the copy field", async () => {
    render(<ShareRecipeModal recipe={RECIPE} open onOpenChange={jest.fn()} />);

    expect(global.fetch).toHaveBeenCalledWith("/api/recipe/recipe-1/share", { method: "POST" });
    expect(await screen.findByText(/\/r\/tok1/)).toBeInTheDocument();
  });

  it("does not mint when closed", () => {
    render(<ShareRecipeModal recipe={RECIPE} open={false} onOpenChange={jest.fn()} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("disables the channel links until the link is minted", async () => {
    render(<ShareRecipeModal recipe={RECIPE} open onOpenChange={jest.fn()} />);

    const email = screen.getByLabelText("Share via Email");
    expect(email).not.toHaveAttribute("href");

    await waitFor(() => expect(screen.getByLabelText("Share via Email")).toHaveAttribute("href"));
  });

  it("builds the WhatsApp link with the recipe name and url", async () => {
    render(<ShareRecipeModal recipe={RECIPE} open onOpenChange={jest.fn()} />);

    await waitFor(() => {
      const whatsapp = screen.getByLabelText("Share via WhatsApp");
      expect(whatsapp.getAttribute("href")).toContain("wa.me");
      expect(whatsapp.getAttribute("href")).toContain(encodeURIComponent("Fried Rice"));
    });
  });

  it("builds the save-image link from the OG image route", async () => {
    render(<ShareRecipeModal recipe={RECIPE} open onOpenChange={jest.fn()} />);

    await waitFor(() => {
      const saveImg = screen.getByLabelText("Save image");
      expect(saveImg.getAttribute("href")).toContain("/r/tok1/opengraph-image");
    });
  });
});
