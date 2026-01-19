import * as fs from "fs";
import * as path from "path";

interface RestaurantInfo {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  googlePlaceId?: string;
  googleRating?: number;
  googleReviewCount?: number;
  [key: string]: unknown;
}

interface PlaceSearchResult {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
}

interface PlacesResponse {
  status: string;
  candidates?: PlaceSearchResult[];
  error_message?: string;
}

// Find place using Google Places API
async function findPlace(
  name: string,
  address: string,
  apiKey: string
): Promise<{ placeId: string; rating?: number; reviewCount?: number } | null> {
  try {
    // Use Find Place from Text API with name and address
    const query = encodeURIComponent(`${name} ${address}`);
    const fields = "place_id,name,rating,user_ratings_total";
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=${fields}&key=${apiKey}`;

    const response = await fetch(url);
    const data: PlacesResponse = await response.json();

    if (data.status === "OK" && data.candidates && data.candidates.length > 0) {
      const place = data.candidates[0];
      return {
        placeId: place.place_id,
        rating: place.rating,
        reviewCount: place.user_ratings_total,
      };
    } else if (data.status === "ZERO_RESULTS") {
      // Try with just the name in Philadelphia
      const fallbackQuery = encodeURIComponent(`${name} Philadelphia PA`);
      const fallbackUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${fallbackQuery}&inputtype=textquery&fields=${fields}&key=${apiKey}`;

      const fallbackResponse = await fetch(fallbackUrl);
      const fallbackData: PlacesResponse = await fallbackResponse.json();

      if (
        fallbackData.status === "OK" &&
        fallbackData.candidates &&
        fallbackData.candidates.length > 0
      ) {
        const place = fallbackData.candidates[0];
        return {
          placeId: place.place_id,
          rating: place.rating,
          reviewCount: place.user_ratings_total,
        };
      }
    } else if (data.error_message) {
      console.error(`  API Error: ${data.error_message}`);
    }
  } catch (error) {
    console.error(`  Failed to find place for "${name}":`, error);
  }
  return null;
}

async function main() {
  // Get Google Maps API key from environment
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error(
      "Error: GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is required"
    );
    console.log("\nUsage: GOOGLE_MAPS_API_KEY=your_key npm run fetch-places");
    console.log(
      "\nNote: Make sure the Places API is enabled in your Google Cloud Console"
    );
    process.exit(1);
  }

  // Read restaurants-full.json
  const inputPath = path.join(__dirname, "..", "data", "restaurants-full.json");
  const restaurants: RestaurantInfo[] = JSON.parse(
    fs.readFileSync(inputPath, "utf-8")
  );

  console.log(`Fetching Google Places data for ${restaurants.length} restaurants...\n`);

  let found = 0;
  let notFound = 0;

  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];

    // Skip if already has Google data
    if (restaurant.googlePlaceId) {
      console.log(
        `  [${i + 1}/${restaurants.length}] ${restaurant.name} - already has Places data`
      );
      found++;
      continue;
    }

    console.log(`  [${i + 1}/${restaurants.length}] ${restaurant.name}...`);

    const placeData = await findPlace(restaurant.name, restaurant.address, apiKey);

    if (placeData) {
      restaurant.googlePlaceId = placeData.placeId;
      if (placeData.rating !== undefined) {
        restaurant.googleRating = placeData.rating;
      }
      if (placeData.reviewCount !== undefined) {
        restaurant.googleReviewCount = placeData.reviewCount;
      }
      console.log(
        `    ✓ Rating: ${placeData.rating ?? "N/A"} (${placeData.reviewCount ?? 0} reviews)`
      );
      found++;
    } else {
      console.log(`    ✗ Not found`);
      notFound++;
    }

    // Small delay to avoid rate limiting (QPS limit is typically 100)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Save updated data
  fs.writeFileSync(inputPath, JSON.stringify(restaurants, null, 2));

  console.log(`\n✓ Found: ${found} restaurants`);
  console.log(`✗ Not found: ${notFound} restaurants`);
  console.log(`✓ Saved to ${inputPath}`);
}

main().catch(console.error);
