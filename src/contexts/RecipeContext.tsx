"use client";

import { RecipeWithId } from "@/lib/recipes/schemas";
import { createContext, ReactNode, useContext, useState } from "react";

interface RecipeContextType {
  selectedRecipe: RecipeWithId | null;
  setSelectedRecipe: (recipe: RecipeWithId | null) => void;
  exitRecipe: () => void;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithId | null>(
    null
  );

  const exitRecipe = () => {
    setSelectedRecipe(null);
  };

  return (
    <RecipeContext.Provider
      value={{ selectedRecipe, setSelectedRecipe, exitRecipe }}
    >
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipeContext = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error("useRecipeContext must be used within a RecipeProvider");
  }
  return context;
};
