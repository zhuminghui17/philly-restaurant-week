import { z } from "zod";
import { Restaurant } from "@/lib/types";
import restaurantsData from "@/data/restaurants.json";

const restaurants = restaurantsData as Restaurant[];

// Get all unique cuisine types
const allCuisines = [...new Set(restaurants.flatMap((r) => r.cuisineTypes || []))].sort();

// Get all unique dietary options
const allDietaryOptions = [...new Set(restaurants.flatMap((r) => r.dietaryOptions || []))].filter(
  (opt) => opt && opt.length < 30
);

// Map common food items/keywords to cuisine types for smarter searching
const foodToCuisineMap: Record<string, string[]> = {
  pasta: ["Italian"],
  pizza: ["Italian"],
  spaghetti: ["Italian"],
  lasagna: ["Italian"],
  risotto: ["Italian"],
  sushi: ["Japanese", "Asian"],
  ramen: ["Japanese", "Asian"],
  tacos: ["Mexican", "Latin American", "Tex-Mex"],
  burritos: ["Mexican", "Latin American", "Tex-Mex"],
  curry: ["Indian", "Thai", "Asian"],
  noodles: ["Asian", "Thai", "Japanese"],
  steak: ["American", "Southern"],
  burger: ["American"],
  seafood: ["Seafood"],
  fish: ["Seafood"],
  tapas: ["Spanish"],
  gyros: ["Greek", "Mediterranean"],
  falafel: ["Mediterranean", "Greek"],
  pho: ["Asian"],
  thai: ["Thai", "Asian"],
};

// Helper to expand search terms to include related cuisines
function expandSearchToCuisines(searchTerm: string): string[] {
  const termLower = searchTerm.toLowerCase();
  const cuisines: string[] = [];
  
  // Check if the term directly matches a cuisine
  for (const cuisine of allCuisines) {
    if (termLower.includes(cuisine.toLowerCase())) {
      cuisines.push(cuisine);
    }
  }
  
  // Check food-to-cuisine mappings
  for (const [food, mappedCuisines] of Object.entries(foodToCuisineMap)) {
    if (termLower.includes(food)) {
      cuisines.push(...mappedCuisines);
    }
  }
  
  return [...new Set(cuisines)];
}

// Helper to format price tiers
function getPriceTiers(r: Restaurant): string[] {
  const tiers: string[] = [];
  if (r.offersLunch20) tiers.push("$20 Lunch");
  if (r.offersDinner45) tiers.push("$45 Dinner");
  if (r.offersDinner60) tiers.push("$60 Dinner");
  return tiers;
}

// Define parameter schemas
const searchRestaurantsParams = z.object({
  cuisine: z.string().optional().describe("Filter by cuisine type OR food item (e.g., Italian, Asian, Mexican, pasta, sushi, tacos). Food items are automatically mapped to cuisines."),
  pricePoint: z.enum(["lunch20", "dinner45", "dinner60"]).optional().describe("Filter by price: lunch20 ($20 lunch), dinner45 ($45 dinner), dinner60 ($60 dinner)"),
  dietaryOption: z.string().optional().describe("Filter by dietary option (e.g., Vegetarian, Vegan, Gluten-free)"),
  hasOutdoorSeating: z.boolean().optional().describe("Filter for outdoor seating"),
  isBYOB: z.boolean().optional().describe("Filter for BYOB restaurants"),
  offersTakeout: z.boolean().optional().describe("Filter for takeout availability"),
  minRating: z.number().optional().describe("Minimum Google rating (1-5)"),
  query: z.string().optional().describe("Free text search for restaurant name, address, or food type"),
});

const getRestaurantDetailsParams = z.object({
  nameOrId: z.string().describe("The restaurant name or ID to look up"),
});

const compareRestaurantsParams = z.object({
  names: z.array(z.string()).min(2).max(4).describe("Array of restaurant names to compare"),
});

const getRecommendationsParams = z.object({
  preferences: z.string().describe("What the user is looking for (e.g., 'romantic Italian dinner', 'quick lunch with vegan options', 'group dinner for 8')"),
  budget: z.enum(["lunch", "dinner45", "dinner60", "any"]).optional().describe("Budget preference"),
  groupSize: z.number().optional().describe("Size of the dining party"),
});

// Tool execution functions
async function executeSearchRestaurants(params: z.infer<typeof searchRestaurantsParams>) {
  const { cuisine, pricePoint, dietaryOption, hasOutdoorSeating, isBYOB, offersTakeout, minRating, query } = params;
  let results = [...restaurants];

  if (cuisine) {
    const cuisineLower = cuisine.toLowerCase();
    // Expand cuisine search to include related cuisines (e.g., "pasta" -> "Italian")
    const expandedCuisines = expandSearchToCuisines(cuisine);
    
    results = results.filter((r) =>
      r.cuisineTypes?.some((c) => {
        const cLower = c.toLowerCase();
        // Direct match
        if (cLower.includes(cuisineLower) || cuisineLower.includes(cLower)) {
          return true;
        }
        // Expanded match (e.g., searching "pasta" matches "Italian" restaurants)
        if (expandedCuisines.some(ec => ec.toLowerCase() === cLower)) {
          return true;
        }
        return false;
      })
    );
  }

  if (pricePoint === "lunch20") {
    results = results.filter((r) => r.offersLunch20);
  } else if (pricePoint === "dinner45") {
    results = results.filter((r) => r.offersDinner45);
  } else if (pricePoint === "dinner60") {
    results = results.filter((r) => r.offersDinner60);
  }

  if (dietaryOption) {
    const dietLower = dietaryOption.toLowerCase();
    results = results.filter((r) =>
      r.dietaryOptions?.some((d) => d.toLowerCase().includes(dietLower))
    );
  }

  if (hasOutdoorSeating) {
    results = results.filter((r) => r.offersOutdoorDining);
  }

  if (isBYOB) {
    results = results.filter((r) => r.isBYOB);
  }

  if (offersTakeout) {
    results = results.filter((r) => r.offersTakeout);
  }

  if (minRating) {
    results = results.filter((r) => (r.googleRating || 0) >= minRating);
  }

  if (query) {
    const q = query.toLowerCase();
    // Also expand query to cuisines in case user searches for food items like "pasta"
    const queryCuisines = expandSearchToCuisines(query);
    
    results = results.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        // Also match if query maps to a cuisine type
        (queryCuisines.length > 0 && r.cuisineTypes?.some(c => 
          queryCuisines.some(qc => qc.toLowerCase() === c.toLowerCase())
        ))
    );
  }

  results.sort((a, b) => (b.googleRating || 0) - (a.googleRating || 0));

  return {
    count: results.length,
    restaurants: results.slice(0, 8).map((r) => ({
      id: r.id,
      name: r.name,
      cuisines: r.cuisineTypes?.join(", ") || "Not specified",
      address: r.address,
      priceTiers: getPriceTiers(r).join(", ") || "See menu",
      rating: r.googleRating ? `${r.googleRating} (${r.googleReviewCount} reviews)` : "No rating",
      features: [
        r.offersOutdoorDining && "Outdoor seating",
        r.isBYOB && "BYOB",
        r.offersTakeout && "Takeout",
      ].filter(Boolean).join(", ") || "Indoor dining",
      dietaryOptions: r.dietaryOptions?.join(", ") || "Ask restaurant",
    })),
  };
}

async function executeGetRestaurantDetails(params: z.infer<typeof getRestaurantDetailsParams>) {
  const { nameOrId } = params;
  const nameLower = nameOrId.toLowerCase();
  const restaurant = restaurants.find(
    (r) => r.id === nameOrId || r.name.toLowerCase().includes(nameLower)
  );

  if (!restaurant) {
    return { error: `Restaurant "${nameOrId}" not found. Try searching with different terms.` };
  }

  return {
    name: restaurant.name,
    cuisines: restaurant.cuisineTypes?.join(", ") || "Not specified",
    address: restaurant.address,
    phone: restaurant.phone || "Not available",
    website: restaurant.website || "Not available",
    priceTiers: getPriceTiers(restaurant),
    menuLinks: {
      lunch20: restaurant.Lunch20MenuLink || null,
      dinner45: restaurant.Dinner45MenuLink || null,
      dinner60: restaurant.Dinner60MenuLink || null,
    },
    rating: restaurant.googleRating,
    reviewCount: restaurant.googleReviewCount,
    diningOptions: {
      indoor: restaurant.offersIndoorDining,
      outdoor: restaurant.offersOutdoorDining,
      takeout: restaurant.offersTakeout,
    },
    policies: {
      isBYOB: restaurant.isBYOB,
      autoGratuity: restaurant.autoGratuity,
      excludesSaturdays: restaurant.excludesSaturdays,
      closedDays: restaurant.closedDays || [],
    },
    dietaryOptions: restaurant.dietaryOptions || [],
    largePartyNote: restaurant.largePartyNote || null,
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`,
  };
}

async function executeCompareRestaurants(params: z.infer<typeof compareRestaurantsParams>) {
  const { names } = params;
  const found = names.map((name: string) => {
    const nameLower = name.toLowerCase();
    return restaurants.find(
      (r) => r.id === name || r.name.toLowerCase().includes(nameLower)
    );
  }).filter((r): r is Restaurant => r !== undefined);

  if (found.length < 2) {
    return { error: `Could only find ${found.length} restaurant(s). Need at least 2 to compare.` };
  }

  return {
    restaurants: found.map((r: Restaurant) => ({
      name: r.name,
      cuisines: r.cuisineTypes?.join(", ") || "Not specified",
      priceTiers: getPriceTiers(r).join(", ") || "See menu",
      rating: r.googleRating || "No rating",
      reviewCount: r.googleReviewCount || 0,
      hasOutdoor: r.offersOutdoorDining,
      hasTakeout: r.offersTakeout,
      isBYOB: r.isBYOB,
      dietaryOptions: r.dietaryOptions?.join(", ") || "Ask restaurant",
      closedDays: r.closedDays?.join(", ") || "None",
      excludesSaturdays: r.excludesSaturdays,
    })),
  };
}

async function executeGetRecommendations(params: z.infer<typeof getRecommendationsParams>) {
  const { preferences, budget, groupSize } = params;
  let candidates = [...restaurants];
  const prefLower = preferences.toLowerCase();
  
  // Expand preferences to include related cuisines (e.g., "pasta" -> "Italian")
  const expandedCuisines = expandSearchToCuisines(preferences);

  if (budget === "lunch") {
    candidates = candidates.filter((r) => r.offersLunch20);
  } else if (budget === "dinner45") {
    candidates = candidates.filter((r) => r.offersDinner45);
  } else if (budget === "dinner60") {
    candidates = candidates.filter((r) => r.offersDinner60);
  }

  const scored = candidates.map((r) => {
    let score = r.googleRating ? r.googleRating * 2 : 0;

    if (r.cuisineTypes) {
      for (const cuisine of r.cuisineTypes) {
        // Check direct cuisine match
        if (prefLower.includes(cuisine.toLowerCase())) {
          score += 10;
        }
        // Check expanded cuisine match (e.g., "pasta" matches "Italian")
        if (expandedCuisines.some(ec => ec.toLowerCase() === cuisine.toLowerCase())) {
          score += 10;
        }
      }
    }

    if (prefLower.includes("outdoor") && r.offersOutdoorDining) score += 8;
    if (prefLower.includes("romantic") && r.offersOutdoorDining) score += 5;
    if (prefLower.includes("byob") && r.isBYOB) score += 10;
    if (prefLower.includes("takeout") && r.offersTakeout) score += 8;

    if (prefLower.includes("vegan") && r.dietaryOptions?.some((d) => d.toLowerCase().includes("vegan"))) score += 10;
    if (prefLower.includes("vegetarian") && r.dietaryOptions?.some((d) => d.toLowerCase().includes("vegetarian"))) score += 8;
    if (prefLower.includes("gluten") && r.dietaryOptions?.some((d) => d.toLowerCase().includes("gluten"))) score += 8;

    if (groupSize && groupSize >= 6 && r.largePartyNote) {
      score -= 2;
    }

    return { restaurant: r, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 5);

  return {
    recommendations: top.map((s, i) => ({
      rank: i + 1,
      name: s.restaurant.name,
      cuisines: s.restaurant.cuisineTypes?.join(", ") || "Not specified",
      priceTiers: getPriceTiers(s.restaurant).join(", ") || "See menu",
      rating: s.restaurant.googleRating ? `${s.restaurant.googleRating} stars` : "No rating",
      whyRecommended: s.score > 15
        ? "Excellent match for your preferences!"
        : s.score > 10
        ? "Good match with solid ratings"
        : "Popular Restaurant Week choice",
      features: [
        s.restaurant.offersOutdoorDining && "Outdoor",
        s.restaurant.isBYOB && "BYOB",
        s.restaurant.offersTakeout && "Takeout",
      ].filter(Boolean).join(", "),
      dietaryOptions: s.restaurant.dietaryOptions?.slice(0, 3).join(", ") || "Ask restaurant",
      largePartyNote: groupSize && groupSize >= 6 ? s.restaurant.largePartyNote : undefined,
    })),
    searchCriteria: { preferences, budget, groupSize, expandedCuisines },
  };
}

// Export tools in format expected by AI SDK v6 (using inputSchema instead of parameters)
export const restaurantTools = {
  searchRestaurants: {
    description: `Search for restaurants. Supports food items like "pasta", "sushi", "tacos" which map to cuisines automatically. Available cuisines: ${allCuisines.join(", ")}. Dietary options: ${allDietaryOptions.slice(0, 10).join(", ")}. Use pricePoint: "lunch20" for $20 lunch, "dinner45" for $45 dinner, "dinner60" for $60 dinner.`,
    inputSchema: searchRestaurantsParams,
    execute: executeSearchRestaurants,
  },
  getRestaurantDetails: {
    description: "Get complete details about a specific restaurant by name or ID",
    inputSchema: getRestaurantDetailsParams,
    execute: executeGetRestaurantDetails,
  },
  compareRestaurants: {
    description: "Compare 2-4 restaurants side by side",
    inputSchema: compareRestaurantsParams,
    execute: executeCompareRestaurants,
  },
  getRecommendations: {
    description: "Get personalized restaurant recommendations based on preferences",
    inputSchema: getRecommendationsParams,
    execute: executeGetRecommendations,
  },
};
