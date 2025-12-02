"use client";

import { useRouter } from "next/navigation";
import {
  QrCode,
  UtensilsCrossed,
  Table2,
  NotepadText,
  HandPlatter,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const configItems = [
  {
    title: "Dishes",
    icon: UtensilsCrossed,
    description: "Manage restaurant dishes and menu items",
    href: "/dashboard/configuration/dishes",
  },
  {
    title: "Tables",
    icon: Table2,
    description: "Configure restaurant tables and seating",
    href: "/dashboard/configuration/tables",
  },
  {
    title: "Ingredients",
    icon: NotepadText,
    description: "Add and Manage ingredients for dishes",
    href: "/dashboard/configuration/ingredients",
  },
  {
    title: "Categories",
    icon: HandPlatter,
    description: "Add and Manage categories for dishes",
    href: "/dashboard/configuration/categories",
  },
  {
    title: "Offers",
    icon: Tag,
    description: "Manage special offers and discounts",
    href: "/dashboard/configuration/offers",
  },
];

export default function ConfigurationMenu() {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {configItems.map((item) => (
        <Card key={item.href} className="transition-shadow hover:shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="p-3 rounded-full bg-primary/10">
                <item.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push(item.href)}
              >
                Manage {item.title}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
