"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateOrder } from "@/hooks/order/useCreateOrder";

const formSchema = z.object({
  tableNumber: z.string().min(1, "Table number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  dishes: z
    .array(
      z.object({
        dishId: z.string().min(1, "Dish is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one dish is required"),
});

export default function OrderForm() {
  const { loading, handleCreateOrder } = useCreateOrder();
  const [error, setError] = useState("");

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tableNumber: "",
      customerName: "",
      dishes: [],
    },
  });

  const onSubmit = async (values) => {
    try {
      await handleCreateOrder(values);
    } catch (error) {
      setError("Failed to create order. Please try again.");
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create Order</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-2 text-sm text-red-500 bg-red-50 rounded">
            {error}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tableNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Number</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter table number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="Enter customer name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dishes section will go here - you can add dynamic dish fields */}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Order..." : "Create Order"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
