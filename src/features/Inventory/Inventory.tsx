"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetcher } from "@/lib/inventory/utils";
import { InventoryItem } from "@/lib/schemas";
import useSWR from "swr";

const Inventory = () => {
  const { data, error, isLoading } = useSWR(`/api/inventory`, fetcher, {
    onSuccess: (data) => {
      console.log("SWR data updated:", data);
    },
    onError: (error) => {
      console.log("SWR error:", error);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const { kitchenwareInventory, ingredientInventory } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Inventory</h1>

      <Card>
        <CardHeader>
          <CardTitle>Kitchenware</CardTitle>
        </CardHeader>
        <CardContent>
          {kitchenwareInventory.length === 0 ? (
            <p className="text-muted-foreground">No kitchenware yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {kitchenwareInventory.map((item: InventoryItem) => (
                <Badge key={item.id} variant="secondary">
                  {item.name}
                  {item.quantity && ` (${item.quantity} ${item.unit || ""})`}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          {ingredientInventory.length === 0 ? (
            <p className="text-muted-foreground">No ingredients yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ingredientInventory.map((item: InventoryItem) => (
                <Badge key={item.id} variant="outline">
                  {item.name}
                  {item.quantity && ` (${item.quantity}${item.unit || ""})`}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Inventory;
