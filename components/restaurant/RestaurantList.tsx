"use client";

import { Restaurant } from "@/lib/types";
import { RestaurantCard } from "./RestaurantCard";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RestaurantListProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant | null) => void;
}

export function RestaurantList({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect,
}: RestaurantListProps) {
  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <div className="text-4xl mb-4">🍽️</div>
        <h3 className="font-serif text-lg font-semibold text-[#1a2744] mb-2">
          No restaurants found
        </h3>
        <p className="text-sm text-[#1a2744]/60">
          Try adjusting your filters to see more options.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4 mx-auto">
        {restaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            className={`w-full cursor-pointer transition-all duration-200 rounded-lg ${
              selectedRestaurant?.id === restaurant.id
                ? "ring-2 ring-[#d4a853] ring-offset-2"
                : "hover:ring-1 hover:ring-[#1a2744]/20"
            }`}
            onClick={() =>
              onRestaurantSelect(
                selectedRestaurant?.id === restaurant.id ? null : restaurant
              )
            }
          >
            <RestaurantCard restaurant={restaurant} variant="list" />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
