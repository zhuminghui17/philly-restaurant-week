"use client";

import { FilterState, Restaurant } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, X, RotateCcw, Star } from "lucide-react";

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  restaurants: Restaurant[];
  filteredCount: number;
}

export function FilterPanel({
  filters,
  onFiltersChange,
  restaurants,
  filteredCount,
}: FilterPanelProps) {
  // Extract unique dietary options from restaurants
  const allDietaryOptions = [
    ...new Set(restaurants.flatMap((r) => r.dietaryOptions || [])),
  ].filter((opt) => opt && opt.length < 30); // Filter out long notes

  const updateFilters = (updates: Partial<FilterState>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const toggleMenuType = (type: "lunch20" | "dinner45" | "dinner60") => {
    updateFilters({
      menuTypes: {
        ...filters.menuTypes,
        [type]: !filters.menuTypes[type],
      },
    });
  };

  const toggleDietary = (option: string) => {
    const newOptions = filters.dietaryOptions.includes(option)
      ? filters.dietaryOptions.filter((o) => o !== option)
      : [...filters.dietaryOptions, option];
    updateFilters({ dietaryOptions: newOptions });
  };

  const toggleDiningOption = (option: "indoor" | "outdoor" | "takeout") => {
    updateFilters({
      diningOptions: {
        ...filters.diningOptions,
        [option]: !filters.diningOptions[option],
      },
    });
  };

  const togglePolicy = (policy: "byob" | "noSaturdays") => {
    updateFilters({
      policies: {
        ...filters.policies,
        [policy]: !filters.policies[policy],
      },
    });
  };

  const setMinRating = (rating: number | undefined) => {
    updateFilters({ minRating: rating });
  };

  const resetFilters = () => {
    onFiltersChange({
      menuTypes: { lunch20: false, dinner45: false, dinner60: false },
      dietaryOptions: [],
      diningOptions: { indoor: false, outdoor: false, takeout: false },
      policies: { byob: false, noSaturdays: false },
      minRating: undefined,
      searchQuery: "",
    });
  };

  const hasActiveFilters =
    filters.menuTypes.lunch20 ||
    filters.menuTypes.dinner45 ||
    filters.menuTypes.dinner60 ||
    filters.dietaryOptions.length > 0 ||
    filters.diningOptions.indoor ||
    filters.diningOptions.outdoor ||
    filters.diningOptions.takeout ||
    filters.policies.byob ||
    filters.policies.noSaturdays ||
    filters.minRating ||
    filters.searchQuery;

  return (
    <div className="space-y-6 p-4 bg-[#faf8f5] h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-[#1a2744]">
            Filter Restaurants
          </h2>
          <p className="text-sm text-[#1a2744]/60">
            Showing {filteredCount} of {restaurants.length}
          </p>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-[#1a2744]/60 hover:text-[#1a2744]"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a2744]/40" />
        <Input
          placeholder="Search restaurants..."
          value={filters.searchQuery}
          onChange={(e) => updateFilters({ searchQuery: e.target.value })}
          className="pl-10 bg-white border-[#1a2744]/20 focus:border-[#d4a853]"
        />
        {filters.searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => updateFilters({ searchQuery: "" })}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="bg-[#1a2744]/10" />

      {/* Menu Types */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#1a2744]">Menu Options</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.menuTypes.lunch20 ? "default" : "outline"}
            size="sm"
            onClick={() => toggleMenuType("lunch20")}
            className={
              filters.menuTypes.lunch20
                ? "bg-[#4a9c6d] hover:bg-[#3a8c5d]"
                : "border-[#4a9c6d] text-[#4a9c6d] hover:bg-[#4a9c6d]/10"
            }
          >
            $20 Lunch
          </Button>
          <Button
            variant={filters.menuTypes.dinner45 ? "default" : "outline"}
            size="sm"
            onClick={() => toggleMenuType("dinner45")}
            className={
              filters.menuTypes.dinner45
                ? "bg-[#1a2744] hover:bg-[#1a2744]/80"
                : "border-[#1a2744] text-[#1a2744] hover:bg-[#1a2744]/10"
            }
          >
            $45 Dinner
          </Button>
          <Button
            variant={filters.menuTypes.dinner60 ? "default" : "outline"}
            size="sm"
            onClick={() => toggleMenuType("dinner60")}
            className={
              filters.menuTypes.dinner60
                ? "bg-[#d4a853] hover:bg-[#c49943]"
                : "border-[#d4a853] text-[#d4a853] hover:bg-[#d4a853]/10"
            }
          >
            $60 Dinner
          </Button>
        </div>
      </div>

      <Separator className="bg-[#1a2744]/10" />

      {/* Minimum Rating */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#1a2744]">Minimum Rating</Label>
        <div className="flex gap-2">
          {[4.0, 4.3, 4.5, 4.7].map((rating) => (
            <Button
              key={rating}
              variant={filters.minRating === rating ? "default" : "outline"}
              size="sm"
              onClick={() => setMinRating(filters.minRating === rating ? undefined : rating)}
              className={
                filters.minRating === rating
                  ? "bg-[#d4a853] hover:bg-[#c49943]"
                  : "border-[#1a2744]/20 hover:bg-[#1a2744]/10"
              }
            >
              <Star className="h-3 w-3 mr-1 fill-current" />
              {rating}+
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-[#1a2744]/10" />

      {/* Dietary Options */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#1a2744]">
          Dietary Options
        </Label>
        <div className="space-y-2">
          {allDietaryOptions.slice(0, 8).map((option) => (
            <div key={option} className="flex items-center gap-2">
              <Checkbox
                id={`dietary-${option}`}
                checked={filters.dietaryOptions.includes(option)}
                onCheckedChange={() => toggleDietary(option)}
                className="border-[#4a9c6d] data-[state=checked]:bg-[#4a9c6d]"
              />
              <Label
                htmlFor={`dietary-${option}`}
                className="text-sm text-[#1a2744]/80 cursor-pointer"
              >
                {option}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator className="bg-[#1a2744]/10" />

      {/* Dining Options */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#1a2744]">
          Dining Options
        </Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="indoor"
              checked={filters.diningOptions.indoor}
              onCheckedChange={() => toggleDiningOption("indoor")}
              className="border-[#1a2744]/40 data-[state=checked]:bg-[#1a2744]"
            />
            <Label
              htmlFor="indoor"
              className="text-sm text-[#1a2744]/80 cursor-pointer"
            >
              Indoor Dining
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="outdoor"
              checked={filters.diningOptions.outdoor}
              onCheckedChange={() => toggleDiningOption("outdoor")}
              className="border-[#1a2744]/40 data-[state=checked]:bg-[#1a2744]"
            />
            <Label
              htmlFor="outdoor"
              className="text-sm text-[#1a2744]/80 cursor-pointer"
            >
              Outdoor Seating
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="takeout"
              checked={filters.diningOptions.takeout}
              onCheckedChange={() => toggleDiningOption("takeout")}
              className="border-[#1a2744]/40 data-[state=checked]:bg-[#1a2744]"
            />
            <Label
              htmlFor="takeout"
              className="text-sm text-[#1a2744]/80 cursor-pointer"
            >
              Takeout Available
            </Label>
          </div>
        </div>
      </div>

      <Separator className="bg-[#1a2744]/10" />

      {/* Policies */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#1a2744]">
          Policies
        </Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="byob"
              checked={filters.policies.byob}
              onCheckedChange={() => togglePolicy("byob")}
              className="border-[#4a9c6d] data-[state=checked]:bg-[#4a9c6d]"
            />
            <Label
              htmlFor="byob"
              className="text-sm text-[#1a2744]/80 cursor-pointer"
            >
              BYOB
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="noSaturdays"
              checked={filters.policies.noSaturdays}
              onCheckedChange={() => togglePolicy("noSaturdays")}
              className="border-[#1a2744]/40 data-[state=checked]:bg-[#1a2744]"
            />
            <Label
              htmlFor="noSaturdays"
              className="text-sm text-[#1a2744]/80 cursor-pointer"
            >
              Available on Saturdays
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
