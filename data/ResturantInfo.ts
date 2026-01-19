// Restaurant data types - flexible schema with optional fields
// Core fields are required, everything else is optional and can be added as we explore data

export interface RestaurantInfo {
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
  notes?: string; // any notes about the restaurant
}