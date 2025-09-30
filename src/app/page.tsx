"use client";
import AboutPopOver from "@/components/AboutPopOver";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWrapper from "@/features/Chat/components/ChatWrapper";
import RecipeDisplay from "@/features/RecipeDisplay/RecipeDisplay";
import RecipeList from "@/features/RecipeList/RecipeList";
import { useState } from "react";

import InventoryWrapper from "@/features/Inventory/components/InventoryWrapper";

export default function Home() {
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithId>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRecipeSelectFromDrawer = (recipe: RecipeWithId) => {
    setSelectedRecipe(recipe);
    setIsDrawerOpen(false); // Close drawer when recipe is selected
  };

  return (
    <div className="bg-background">
      <main className="xl:container mx-auto h-[calc(100dvh-6rem)] sm:h-[calc(100dvh-6.5rem)]  md:h-[calc(100dvh-8rem)] ">
        <div className="flex gap-4 h-full">
          <section className="flex-7 min-w-0">
            {selectedRecipe ? (
              <RecipeDisplay
                recipe={selectedRecipe}
                exitRecipe={() => setSelectedRecipe("")}
              />
            ) : (
              <ChatWrapper />
            )}
          </section>
          <aside className="flex-3 min-w-0 pt-4 hidden lg:block lg:relative overflow-y-auto pr-4 mb-4 ">
            <Tabs defaultValue="inventory">
              <TabsList>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="recipe">Recipe</TabsTrigger>
              </TabsList>
              <TabsContent value="inventory">
                <InventoryWrapper />
              </TabsContent>
              <TabsContent value="recipe">
                <RecipeList setSelectedRecipe={setSelectedRecipe} />
              </TabsContent>
            </Tabs>
          </aside>
        </div>
      </main>

      <div className="absolute top-7 sm:top-9 md:top-13 right-3 flex items-center gap-2">
        <AboutPopOver svgSize="18" className="lg:hidden" />
        <Drawer
          direction="right"
          open={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
        >
          <DrawerTrigger asChild>
            <Button
              variant="secondary"
              className="flex items-center gap-1  cursor-pointer lg:hidden"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 21V22H7V21C6.46957 21 5.96086 20.7893 5.58579 20.4142C5.21071 20.0391 5 19.5304 5 19V4C5 3.46957 5.21071 2.96086 5.58579 2.58579C5.96086 2.21071 6.46957 2 7 2H17C17.5304 2 18.0391 2.21071 18.4142 2.58579C18.7893 2.96086 19 3.46957 19 4V19C19 19.5304 18.7893 20.0391 18.4142 20.4142C18.0391 20.7893 17.5304 21 17 21V22H15V21H9ZM7 4V9H17V4H7ZM7 19H17V11H7V19ZM8 12H10V15H8V12ZM8 6H10V8H8V6Z"
                  fill="currentColor"
                />
              </svg>
              Kitchen
            </Button>
          </DrawerTrigger>
          <DrawerContent aria-label="Inventory">
            <DrawerTitle className="sr-only">Inventory</DrawerTitle>
            <div className="flex-1 overflow-auto px-4 pt-8">
              <Tabs defaultValue="inventory">
                <TabsList>
                  <TabsTrigger value="inventory">Inventory</TabsTrigger>
                  <TabsTrigger value="recipe">Recipe</TabsTrigger>
                </TabsList>
                <TabsContent value="inventory">
                  <InventoryWrapper />
                </TabsContent>
                <TabsContent value="recipe">
                  <RecipeList
                    setSelectedRecipe={handleRecipeSelectFromDrawer}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
