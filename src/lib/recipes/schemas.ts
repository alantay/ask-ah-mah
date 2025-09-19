export type Recipe = {
  userId: string;
  name: string;
  instructions: string;
};

export type RecipeWithId = Recipe & { id: string };