"use client";

import { useState, useMemo } from "react";
import { Restaurant, FilterState } from "@/lib/types";
import { RestaurantMap } from "@/components/map/RestaurantMap";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { RestaurantList } from "@/components/restaurant/RestaurantList";
import { FilterPanel } from "@/components/restaurant/FilterPanel";
import { AssistantChat } from "@/components/chat/AssistantChat";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Map, List, Filter, PanelLeftClose, PanelLeft } from "lucide-react";

// Import static restaurant data
import restaurantsData from "@/data/restaurants.json";

const restaurants = restaurantsData as Restaurant[];

// Google Maps API key - should be set in .env.local
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function Home() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<"map" | "list">("map");
  const [filters, setFilters] = useState<FilterState>({
    cuisineTypes: [],
    menuTypes: { lunch20: false, dinner45: false, dinner60: false },
    dietaryOptions: [],
    diningOptions: { indoor: false, outdoor: false, takeout: false },
    policies: { byob: false, noSaturdays: false },
    minRating: undefined,
    searchQuery: "",
  });

  // Filter restaurants based on current filters
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      // Search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesSearch =
          restaurant.name.toLowerCase().includes(query) ||
          restaurant.address.toLowerCase().includes(query) ||
          restaurant.dietaryOptions?.some((d) => d.toLowerCase().includes(query)) ||
          restaurant.cuisineTypes?.some((c) => c.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Cuisine types - if any selected, must match at least one
      if (filters.cuisineTypes.length > 0) {
        const restaurantCuisines = restaurant.cuisineTypes || [];
        const matchesCuisine = filters.cuisineTypes.some((cuisine) =>
          restaurantCuisines.includes(cuisine)
        );
        if (!matchesCuisine) return false;
      }

      // Menu types - if any selected, must match at least one
      const anyMenuTypeSelected =
        filters.menuTypes.lunch20 || filters.menuTypes.dinner45 || filters.menuTypes.dinner60;
      if (anyMenuTypeSelected) {
        const matchesMenuType =
          (filters.menuTypes.lunch20 && restaurant.offersLunch20) ||
          (filters.menuTypes.dinner45 && restaurant.offersDinner45) ||
          (filters.menuTypes.dinner60 && restaurant.offersDinner60);
        if (!matchesMenuType) return false;
      }

      // Dietary options - must have all selected options
      if (filters.dietaryOptions.length > 0) {
        const restaurantDietary = restaurant.dietaryOptions || [];
        const hasAllDietary = filters.dietaryOptions.every((option) =>
          restaurantDietary.includes(option)
        );
        if (!hasAllDietary) return false;
      }

      // Dining options
      if (filters.diningOptions.indoor && !restaurant.offersIndoorDining) return false;
      if (filters.diningOptions.outdoor && !restaurant.offersOutdoorDining) return false;
      if (filters.diningOptions.takeout && !restaurant.offersTakeout) return false;

      // Policies
      if (filters.policies.byob && !restaurant.isBYOB) return false;
      if (filters.policies.noSaturdays && restaurant.excludesSaturdays) return false;

      // Minimum rating
      if (filters.minRating && (restaurant.googleRating || 0) < filters.minRating) {
        return false;
      }

      return true;
    });
  }, [filters]);

  return (
    <div className="h-screen flex flex-col bg-[#faf8f5]">
      {/* Header */}
      <header className="bg-[#1a2744] text-white px-4 py-3 shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Philly Restaurant Week
            </h1>
            <span className="hidden md:inline-block text-[#d4a853] text-sm font-medium">
              January 18 - 31, 2026
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle - Desktop */}
            <div className="hidden md:flex items-center bg-[#1a2744]/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  activeView === "map"
                    ? "bg-[#d4a853] text-[#1a2744]"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => setActiveView("map")}
              >
                <Map className="h-4 w-4 mr-2" />
                Map
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  activeView === "list"
                    ? "bg-[#d4a853] text-[#1a2744]"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => setActiveView("list")}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>

            {/* Filter Button - Mobile */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white hover:bg-white/10"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-fit min-w-[280px] max-w-[85vw] p-0">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  restaurants={restaurants}
                  filteredCount={filteredRestaurants.length}
                />
              </SheetContent>
            </Sheet>

          </div>
        </div>
      </header>

      {/* Mobile Date Badge */}
      <div className="md:hidden bg-[#d4a853] text-[#1a2744] text-center py-1 text-sm font-medium sticky top-[52px] z-50">
        January 18 - 31, 2026
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {/* Sidebar - Desktop */}
        <aside
          className={`hidden md:flex flex-col border-r border-[#1a2744]/10 transition-all duration-300 ${
            sidebarOpen ? "w-fit min-w-[280px] max-w-[400px]" : "w-0 min-w-0 overflow-hidden"
          }`}
        >
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            restaurants={restaurants}
            filteredCount={filteredRestaurants.length}
          />
        </aside>

        {/* Main View */}
        <main className="flex-1 relative min-w-0">
          {/* Sidebar Toggle Button - Desktop */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex absolute bottom-4 left-4 z-20 bg-white shadow-md hover:bg-gray-50"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
          {/* Mobile View Toggle */}
          <div className="md:hidden absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center bg-white rounded-lg shadow-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  activeView === "map"
                    ? "bg-[#1a2744] text-white"
                    : "text-[#1a2744]/70"
                }`}
                onClick={() => setActiveView("map")}
              >
                <Map className="h-4 w-4 mr-1" />
                Map
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`${
                  activeView === "list"
                    ? "bg-[#1a2744] text-white"
                    : "text-[#1a2744]/70"
                }`}
                onClick={() => setActiveView("list")}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
          </div>

          {/* Map View */}
          {activeView === "map" && (
            <div className="h-full relative">
              {GOOGLE_MAPS_API_KEY ? (
                <RestaurantMap
                  restaurants={filteredRestaurants}
                  selectedRestaurant={selectedRestaurant}
                  onRestaurantSelect={setSelectedRestaurant}
                  apiKey={GOOGLE_MAPS_API_KEY}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-[#c9d6df]">
                  <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <Map className="h-12 w-12 mx-auto mb-4 text-[#1a2744]/40" />
                    <h3 className="font-serif text-lg font-semibold text-[#1a2744] mb-2">
                      Map Not Available
                    </h3>
                    <p className="text-sm text-[#1a2744]/60 mb-4">
                      Please set your Google Maps API key in the environment variables
                      to view the map.
                    </p>
                    <code className="text-xs bg-[#1a2744]/5 px-2 py-1 rounded">
                      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                    </code>
                  </div>
                </div>
              )}

              {/* Selected Restaurant Popup */}
              {selectedRestaurant && (
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-10">
                  <RestaurantCard
                    restaurant={selectedRestaurant}
                    onClose={() => setSelectedRestaurant(null)}
                    variant="popup"
                  />
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {activeView === "list" && (
            <div className="h-full w-full min-w-0 bg-[#faf8f5]">
              <RestaurantList
                restaurants={filteredRestaurants}
                selectedRestaurant={selectedRestaurant}
                onRestaurantSelect={setSelectedRestaurant}
              />
            </div>
          )}
        </main>
      </div>

      {/* AI Chat Assistant */}
      <AssistantChat />
    </div>
  );
}
