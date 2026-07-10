import { getRecipeByShareToken } from "@/lib/recipes";

jest.mock("@/lib/recipes", () => ({
  getRecipeByShareToken: jest.fn(),
}));

jest.mock("next/og", () => ({
  ImageResponse: jest.fn().mockImplementation(function (this: { tree: unknown }, tree: unknown) {
    this.tree = tree;
  }),
}));

import ogImage from "./opengraph-image";

describe("opengraph-image", () => {
  it("renders the recipe's own imageUrl when present", async () => {
    (getRecipeByShareToken as jest.Mock).mockResolvedValue({
      name: "Fried Rice",
      imageUrl: "https://example.com/photo.jpg",
    });

    const result = (await ogImage({ params: Promise.resolve({ token: "tok1" }) })) as unknown as {
      tree: { props: { children: unknown } };
    };

    const treeString = JSON.stringify(result.tree);
    expect(treeString).toContain("https://example.com/photo.jpg");
  });

  it("renders the branded template with the recipe name when there's no imageUrl", async () => {
    (getRecipeByShareToken as jest.Mock).mockResolvedValue({
      name: "Fried Rice",
      imageUrl: null,
    });

    const result = (await ogImage({ params: Promise.resolve({ token: "tok2" }) })) as unknown as {
      tree: { props: { children: unknown } };
    };

    const treeString = JSON.stringify(result.tree);
    expect(treeString).toContain("Fried Rice");
    expect(treeString).toContain("from Ah Mah's kitchen");
  });

  it("falls back to a generic branded card when the token doesn't resolve", async () => {
    (getRecipeByShareToken as jest.Mock).mockResolvedValue(null);

    const result = (await ogImage({ params: Promise.resolve({ token: "bad" }) })) as unknown as {
      tree: { props: { children: unknown } };
    };

    const treeString = JSON.stringify(result.tree);
    expect(treeString).toContain("Ask Ah Mah");
  });
});
