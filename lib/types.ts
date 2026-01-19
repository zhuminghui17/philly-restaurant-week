// Restaurant data types - flexible schema with optional fields
// Core fields are required, everything else is optional and can be added as we explore data

export interface Restaurant {
  // Core required fields
  id: string;
  name: string;
  url: string;
  address: string;
  lat: number; // generated from address
  lng: number; // generated from address

  // retrieve below from calling the url using axios
  website?: string;
  phone?: string;
  restaurantWeekDetails?: string[]; // raw array of strings from page

  // Menu offerings
  offersLunch20: boolean;
  Lunch20MenuLink?: string;

  offersDinner45: boolean;
  Dinner45MenuLink?: string;

  offersDinner60: boolean;
  Dinner60MenuLink?: string;

  offersTakeout: boolean;
  TakeoutMenuLink?: string;

  // Dining options (extracted from restaurantWeekDetails)
  offersIndoorDining: boolean;
  offersOutdoorDining: boolean;

  // Policies (extracted from restaurantWeekDetails)
  isBYOB: boolean;
  autoGratuity: boolean; // gratuity automatically added to checks
  excludesSaturdays: boolean; // RW menu not available on Saturdays
  closedDays?: string[]; // e.g. ["Monday", "Tuesday"]
  largePartyNote?: string; // policy for large groups

  dietaryOptions?: string[]; // array of strings

  // Google Places integration
  googlePlaceId?: string;
  googleRating?: number; // 1-5 stars
  googleReviewCount?: number;

  // Cuisine classification (can have multiple)
  cuisineTypes?: string[];
}

// Filter state for the UI
export interface FilterState {
  cuisineTypes: string[];
  menuTypes: {
    lunch20: boolean;
    dinner45: boolean;
    dinner60: boolean;
  };
  dietaryOptions: string[];
  diningOptions: {
    indoor: boolean;
    outdoor: boolean;
    takeout: boolean;
  };
  policies: {
    byob: boolean;
    noSaturdays: boolean; // exclude restaurants that don't participate on Saturdays
  };
  minRating?: number;
  searchQuery: string;
}

// Cuisine color mapping for map pins and UI
export const CUISINE_COLORS: Record<string, string> = {
  American: "#3b82f6",      // Blue
  Asian: "#ef4444",         // Red
  Brazilian: "#22c55e",     // Green
  Cuban: "#f97316",         // Orange
  European: "#8b5cf6",      // Purple
  French: "#ec4899",        // Pink
  Greek: "#06b6d4",         // Cyan
  Indian: "#f59e0b",        // Amber
  Italian: "#10b981",       // Emerald
  Japanese: "#e11d48",      // Rose
  "Latin American": "#84cc16", // Lime
  Mediterranean: "#14b8a6", // Teal
  Mexican: "#eab308",       // Yellow
  Seafood: "#0ea5e9",       // Sky
  Southern: "#a855f7",      // Violet
  Spanish: "#dc2626",       // Red-600
  "Tex-Mex": "#facc15",     // Yellow-400
  Thai: "#f472b6",          // Pink-400
  Vegan: "#4ade80",         // Green-400
};

// For the AI chat tools
// export interface RestaurantSearchParams {
//   pricePoint?: "lunch20" | "dinner45" | "dinner60";
//   dietaryOptions?: string[];
//   hasOutdoorSeating?: boolean;
//   isBYOB?: boolean;
//   minRating?: number;
//   query?: string;
// }
