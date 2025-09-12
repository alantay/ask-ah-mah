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
import { useSessionContext } from "@/contexts/SessionContext";
import { GetInventoryResponse, InventoryItem } from "@/lib/inventory/schemas";
import { fetcher } from "@/lib/inventory/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
  const { userId, isLoading: sessionLoading } = useSessionContext();

  const { data, error, isLoading } = useSWR<GetInventoryResponse>(
    userId ? `/api/inventory?userId=${userId}` : null,
    fetcher,
    {
      shouldRetryOnError: true,
      revalidateOnMount: true,
    }
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
    if (!userId) return;

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: [values], userId }),
      });

      if (response.ok) {
        form.reset();
        mutate(`/api/inventory?userId=${userId}`);
        toast.success(`${values.name} added to inventory`);
      }
    } catch (error) {
      console.error("Failed to add item:", error);
      toast.error(`${values.name} failed to add to inventory`);
    }
  };

  const removeItem = async (itemName: string) => {
    if (!userId) return;
    try {
      const response = await fetch("/api/inventory", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemNames: [itemName], userId }),
      });
      if (response.ok) {
        mutate(`/api/inventory?userId=${userId}`);
        toast.success(`${itemName} removed from inventory`);
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error(`${itemName} failed to remove from inventory`);
    }
  };

  if (sessionLoading || !userId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Inventory</h1>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) return <div>Error: {error.message}</div>;

  const { kitchenwareInventory, ingredientInventory } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your Inventory</h1>
        <Button
          className="cursor-pointer"
          onClick={() => setIsAdding(!isAdding)}
          variant={isAdding ? "outline" : "secondary"}
        >
          {isAdding || (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z"
                fill="currentColor"
              />
            </svg>
          )}
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
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z"
                      fill="currentColor"
                    />
                  </svg>
                  Add to Inventory
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-none">
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
                <Badge
                  key={item.id}
                  variant="outline"
                  className="relative pr-6 py-1"
                >
                  {item.name}
                  {item.quantity &&
                    item.quantity > 1 &&
                    ` (${item.quantity}${item.unit ? ` ${item.unit}` : ""})`}
                  {item.quantity === 1 &&
                    item.unit &&
                    ` (${item.quantity} ${item.unit})`}
                  <button
                    onClick={() => removeItem(item.name)}
                    className="absolute right-1 cursor-pointer"
                  >
                    <svg
                      className="text-gray-400 hover:text-gray-500"
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.3479 14.8489C14.1228 15.0739 13.8176 15.2003 13.4994 15.2003C13.1811 15.2003 12.8759 15.0739 12.6509 14.8489L9.99989 11.8189L7.34889 14.8479C7.23779 14.9608 7.10544 15.0506 6.95946 15.1121C6.81349 15.1736 6.65677 15.2056 6.49837 15.2063C6.33996 15.2069 6.18299 15.1762 6.03652 15.1159C5.89004 15.0555 5.75696 14.9668 5.64495 14.8548C5.53294 14.7428 5.44421 14.6097 5.38389 14.4632C5.32357 14.3168 5.29285 14.1598 5.29349 14.0014C5.29414 13.843 5.32614 13.6863 5.38765 13.5403C5.44916 13.3943 5.53897 13.262 5.65189 13.1509L8.40989 10.0009L5.65089 6.84887C5.53797 6.73777 5.44816 6.60542 5.38665 6.45944C5.32514 6.31346 5.29314 6.15675 5.29249 5.99834C5.29185 5.83994 5.32257 5.68297 5.38289 5.5365C5.44321 5.39002 5.53194 5.25694 5.64395 5.14493C5.75596 5.03292 5.88905 4.94419 6.03552 4.88387C6.18199 4.82355 6.33896 4.79282 6.49737 4.79347C6.65577 4.79411 6.81249 4.82611 6.95846 4.88763C7.10444 4.94914 7.23679 5.03895 7.34789 5.15187L9.99989 8.18287L12.6509 5.15187C12.762 5.03895 12.8943 4.94914 13.0403 4.88763C13.1863 4.82611 13.343 4.79411 13.5014 4.79347C13.6598 4.79282 13.8168 4.82355 13.9633 4.88387C14.1097 4.94419 14.2428 5.03292 14.3548 5.14493C14.4668 5.25694 14.5556 5.39002 14.6159 5.5365C14.6762 5.68297 14.7069 5.83994 14.7063 5.99834C14.7056 6.15675 14.6736 6.31346 14.6121 6.45944C14.5506 6.60542 14.4608 6.73777 14.3479 6.84887L11.5899 10.0009L14.3479 13.1509C14.4595 13.2623 14.548 13.3947 14.6084 13.5403C14.6688 13.686 14.6998 13.8422 14.6998 13.9999C14.6998 14.1576 14.6688 14.3137 14.6084 14.4594C14.548 14.6051 14.4595 14.7374 14.3479 14.8489Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-none">
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
                <Badge
                  key={item.id}
                  variant="outline"
                  className="relative pr-6 py-1"
                >
                  {item.name}
                  {item.quantity &&
                    item.quantity > 1 &&
                    ` (${item.quantity}${item.unit ? ` ${item.unit}` : ""})`}
                  {item.quantity === 1 &&
                    item.unit &&
                    ` (${item.quantity} ${item.unit})`}

                  <button
                    onClick={() => removeItem(item.name)}
                    className="absolute right-1 cursor-pointer"
                  >
                    <svg
                      className="text-gray-400 hover:text-gray-500"
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.3479 14.8489C14.1228 15.0739 13.8176 15.2003 13.4994 15.2003C13.1811 15.2003 12.8759 15.0739 12.6509 14.8489L9.99989 11.8189L7.34889 14.8479C7.23779 14.9608 7.10544 15.0506 6.95946 15.1121C6.81349 15.1736 6.65677 15.2056 6.49837 15.2063C6.33996 15.2069 6.18299 15.1762 6.03652 15.1159C5.89004 15.0555 5.75696 14.9668 5.64495 14.8548C5.53294 14.7428 5.44421 14.6097 5.38389 14.4632C5.32357 14.3168 5.29285 14.1598 5.29349 14.0014C5.29414 13.843 5.32614 13.6863 5.38765 13.5403C5.44916 13.3943 5.53897 13.262 5.65189 13.1509L8.40989 10.0009L5.65089 6.84887C5.53797 6.73777 5.44816 6.60542 5.38665 6.45944C5.32514 6.31346 5.29314 6.15675 5.29249 5.99834C5.29185 5.83994 5.32257 5.68297 5.38289 5.5365C5.44321 5.39002 5.53194 5.25694 5.64395 5.14493C5.75596 5.03292 5.88905 4.94419 6.03552 4.88387C6.18199 4.82355 6.33896 4.79282 6.49737 4.79347C6.65577 4.79411 6.81249 4.82611 6.95846 4.88763C7.10444 4.94914 7.23679 5.03895 7.34789 5.15187L9.99989 8.18287L12.6509 5.15187C12.762 5.03895 12.8943 4.94914 13.0403 4.88763C13.1863 4.82611 13.343 4.79411 13.5014 4.79347C13.6598 4.79282 13.8168 4.82355 13.9633 4.88387C14.1097 4.94419 14.2428 5.03292 14.3548 5.14493C14.4668 5.25694 14.5556 5.39002 14.6159 5.5365C14.6762 5.68297 14.7069 5.83994 14.7063 5.99834C14.7056 6.15675 14.6736 6.31346 14.6121 6.45944C14.5506 6.60542 14.4608 6.73777 14.3479 6.84887L11.5899 10.0009L14.3479 13.1509C14.4595 13.2623 14.548 13.3947 14.6084 13.5403C14.6688 13.686 14.6998 13.8422 14.6998 13.9999C14.6998 14.1576 14.6688 14.3137 14.6084 14.4594C14.548 14.6051 14.4595 14.7374 14.3479 14.8489Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
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
