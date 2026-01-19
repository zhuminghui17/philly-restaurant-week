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
  American: "#d4a665",      // tan
  Asian: "#dd3002",         // red
  Brazilian: "#64b6b8",     // teal
  Cuban: "#a27824",         // brown
  European: "#9ab8c7",      // soft blue
  French: "#d8bdc5",        // soft pink
  Greek: "#026d8a",         // deep teal
  Indian: "#e29712",        // amber
  Italian: "#505a1f",       // olive
  Japanese: "#0f234d",      // navy
  "Latin American": "#da575a", // coral
  Mediterranean: "#2291a5", // blue teal
  Mexican: "#d77019",       // orange
  Seafood: "#a7d3d9",       // light aqua
  Southern: "#6a564d",      // warm brown
  Spanish: "#a82a19",       // deep red
  "Tex-Mex": "#e3e569",     // yellow-green
  Thai: "#a1595c",          // dusty rose
  Vegan: "#bbc1ab",         // sage
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
