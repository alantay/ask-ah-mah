"use client";

import { fetcher } from "@/lib/inventory/utils";
import useSWR from "swr";

const Inventory = () => {
  const { data, error, isLoading } = useSWR(`/api/inventory`, fetcher);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const { kitchenwareInventory, ingredientInventory } = data;

  return (
    <div>
      <h1>Inventory</h1>
      <ul className="pl-2">
        {kitchenwareInventory.map((item: any) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>

      <div>
        <h2>Ingredients</h2>
        <ul className="pl-2">
          {ingredientInventory.map((item: InventoryItem) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      </div>
      </div>
  );
};

export default Inventory;
