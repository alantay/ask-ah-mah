"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GetInventoryResponse, InventoryItem } from "@/lib/inventory/schemas";
import { fetcher } from "@/lib/inventory/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import useSWR, { mutate } from "swr";
import { z } from "zod";

const addItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["ingredient", "kitchenware"]),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
});

type AddItemForm = z.infer<typeof addItemSchema>;

const Inventory = () => {
  const [isAdding, setIsAdding] = useState(false);

  const { data, error, isLoading } = useSWR<GetInventoryResponse>(
    `/api/inventory`,
    fetcher
  );

  const form = useForm<AddItemForm>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      name: "",
      type: "ingredient" as const,
      quantity: 1,
      unit: undefined,
    },
  });

  const onSubmit = async (values: AddItemForm) => {
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([values]),
      });

      if (response.ok) {
        form.reset();
        mutate("/api/inventory");
      }
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  if (error) return <div>Error: {error.message}</div>;

  const { kitchenwareInventory, ingredientInventory } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Inventory</h1>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          variant={isAdding ? "outline" : "default"}
        >
          {isAdding ? "Cancel" : "Add Item"}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Chicken, Wok, Flour"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ingredient">Ingredient</SelectItem>
                          <SelectItem value="kitchenware">
                            Kitchenware
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Add to Inventory
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kitchenware</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && <div>Loading...</div>}
          {kitchenwareInventory?.length === 0 ? (
            <p className="text-muted-foreground">No kitchenware yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {kitchenwareInventory?.map((item: InventoryItem) => (
                <Badge key={item.id} variant="secondary">
                  {item.name}
                  {item.quantity &&
                    item.quantity > 1 &&
                    ` (${item.quantity}${item.unit ? ` ${item.unit}` : ""})`}
                  {item.quantity === 1 &&
                    item.unit &&
                    ` (${item.quantity} ${item.unit})`}
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
          {isLoading && <div>Loading...</div>}
          {ingredientInventory?.length === 0 ? (
            <p className="text-muted-foreground">No ingredients yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ingredientInventory?.map((item: InventoryItem) => (
                <Badge key={item.id} variant="outline">
                  {item.name}
                  {item.quantity &&
                    item.quantity > 1 &&
                    ` (${item.quantity}${item.unit ? ` ${item.unit}` : ""})`}
                  {item.quantity === 1 &&
                    item.unit &&
                    ` (${item.quantity} ${item.unit})`}
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
