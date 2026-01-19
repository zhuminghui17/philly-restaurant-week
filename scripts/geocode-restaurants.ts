import * as fs from "fs";
import * as path from "path";

interface RestaurantInfo {
  id: string;
  name: string;
  url: string;
  address: string;
  lat: number;
  lng: number;
  website?: string;
  phone?: string;
  restaurantWeekDetails?: string[];
  offersLunch20: boolean;
  Lunch20MenuLink?: string;
  offersDinner45: boolean;
  Dinner45MenuLink?: string;
  offersDinner60: boolean;
  Dinner60MenuLink?: string;
  offersTakeout: boolean;
  TakeoutMenuLink?: string;
  dietaryOptions?: string[];
  notes?: string;
}

// Geocode using Google Maps Geocoding API
async function geocodeWithGoogle(
  address: string,
  apiKey: string
): Promise<{ lat: number; lng: number }> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    );
    const data = await response.json();
    if (data.status === "OK" && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
      };
    } else {
      console.error(`  Geocoding error for "${address}": ${data.status}`);
    }
  } catch (error) {
    console.error(`  Failed to geocode "${address}":`, error);
  }
  return { lat: 0, lng: 0 };
}

async function main() {
  // Get Google Maps API key from environment
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error("Error: GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is required");
    console.log("\nUsage: GOOGLE_MAPS_API_KEY=your_key npm run geocode");
    process.exit(1);
  }

  // Read restaurants-full.json
  const inputPath = path.join(__dirname, "..", "data", "restaurants-full.json");
  const restaurants: RestaurantInfo[] = JSON.parse(
    fs.readFileSync(inputPath, "utf-8")
  );

  console.log(`Geocoding ${restaurants.length} restaurants...`);

  // Geocode addresses that don't have coordinates
  let geocodedCount = 0;
  for (let i = 0; i < restaurants.length; i++) {
    const restaurant = restaurants[i];
    
    // Skip if already geocoded
    if (restaurant.lat !== 0 && restaurant.lng !== 0) {
      console.log(`  [${i + 1}/${restaurants.length}] ${restaurant.name} - already has coordinates`);
      continue;
    }

    console.log(`  [${i + 1}/${restaurants.length}] ${restaurant.name}...`);
    const coords = await geocodeWithGoogle(restaurant.address, apiKey);
    restaurant.lat = coords.lat;
    restaurant.lng = coords.lng;
    
    if (coords.lat !== 0) {
      geocodedCount++;
      console.log(`    ✓ ${coords.lat}, ${coords.lng}`);
    } else {
      console.log(`    ✗ Failed to geocode`);
    }

    // Small delay to avoid rate limiting (50 requests per second limit for Google)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Save updated data
  fs.writeFileSync(inputPath, JSON.stringify(restaurants, null, 2));
  console.log(`\n✓ Geocoded ${geocodedCount} restaurants`);
  console.log(`✓ Saved to ${inputPath}`);
}

main().catch(console.error);
