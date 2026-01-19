import * as fs from "fs";
import * as path from "path";

interface BasicRestaurant {
  name: string;
  url: string;
  address: string;
  phone: string;
}

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
  // Dining options
  offersIndoorDining: boolean;
  offersOutdoorDining: boolean;
  // Policies
  isBYOB: boolean;
  autoGratuity: boolean;
  excludesSaturdays: boolean;
  closedDays?: string[];
  largePartyNote?: string;
  dietaryOptions?: string[];
  notes?: string;
}

// Simple slugify for ID generation
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Parse HTML to extract text content
function extractText(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match ? match[1].trim() : null;
}

// Geocode address using Nominatim (free, no API key required)
async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number }> {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          "User-Agent": "PhillyRestaurantWeekScraper/1.0",
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch (error) {
    console.error(`Geocoding failed for ${address}:`, error);
  }
  return { lat: 0, lng: 0 };
}

// Scrape a single restaurant page
async function scrapeRestaurant(
  basic: BasicRestaurant
): Promise<RestaurantInfo> {
  console.log(`Scraping: ${basic.name}`);

  const info: RestaurantInfo = {
    id: slugify(basic.name),
    name: basic.name.replace(/\*$/, ""), // Remove trailing asterisk
    url: basic.url,
    address: basic.address,
    lat: 0,
    lng: 0,
    phone: basic.phone,
    offersLunch20: false,
    offersDinner45: false,
    offersDinner60: false,
    offersTakeout: false,
    // Dining options - default to false, will be extracted from details
    offersIndoorDining: false,
    offersOutdoorDining: false,
    // Policies - default to false
    isBYOB: false,
    autoGratuity: false,
    excludesSaturdays: false,
  };

  try {
    const response = await fetch(basic.url);
    const html = await response.text();

    // Extract website link
    const websiteMatch = html.match(
      /<a[^>]+href="(https?:\/\/(?!centercityphila)[^"]+)"[^>]*>([^<]+\.com[^<]*)<\/a>/i
    );
    if (websiteMatch) {
      info.website = websiteMatch[1];
    }

    // Extract restaurant week details
    const detailsSection = html.match(
      /Restaurant Week [Dd]etails[:\s]*<\/strong>([^]*?)(?:<strong>RESTAURANT WEEK MENU|<\/p>)/i
    );
    if (detailsSection) {
      const detailsText = detailsSection[1]
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .trim();
      const details = detailsText
        .split(/[\n-]/)
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
      if (details.length > 0) {
        info.restaurantWeekDetails = details;
      }
    }

    // Extract menu links - handle various HTML structures
    // $20 LUNCH - try multiple patterns
    const lunch20Patterns = [
      /<a[^>]+href="([^"]+)"[^>]*>\s*\$20\s*LUNCH\s*<\/a>/i,
      /href="([^"]+)"[^>]*>\s*\$20\s*LUNCH/i,
    ];
    for (const pattern of lunch20Patterns) {
      const match = html.match(pattern);
      if (match) {
        info.offersLunch20 = true;
        info.Lunch20MenuLink = match[1];
        break;
      }
    }

    // $45 DINNER - try multiple patterns
    const dinner45Patterns = [
      /<a[^>]+href="([^"]+)"[^>]*>\s*\$45\s*DINNER\s*<\/a>/i,
      /href="([^"]+)"[^>]*>\s*\$45\s*DINNER/i,
    ];
    for (const pattern of dinner45Patterns) {
      const match = html.match(pattern);
      if (match) {
        info.offersDinner45 = true;
        info.Dinner45MenuLink = match[1];
        break;
      }
    }

    // $60 DINNER - try multiple patterns
    const dinner60Patterns = [
      /<a[^>]+href="([^"]+)"[^>]*>\s*\$60\s*DINNER\s*<\/a>/i,
      /href="([^"]+)"[^>]*>\s*\$60\s*DINNER/i,
    ];
    for (const pattern of dinner60Patterns) {
      const match = html.match(pattern);
      if (match) {
        info.offersDinner60 = true;
        info.Dinner60MenuLink = match[1];
        break;
      }
    }

    // TAKEOUT - try multiple patterns
    const takeoutPatterns = [
      /<a[^>]+href="([^"]+)"[^>]*>\s*(?:\$\d+\s*)?TAKEOUT\s*<\/a>/i,
      /href="([^"]+)"[^>]*>\s*(?:\$\d+\s*)?TAKEOUT/i,
    ];
    for (const pattern of takeoutPatterns) {
      const match = html.match(pattern);
      if (match) {
        info.offersTakeout = true;
        info.TakeoutMenuLink = match[1];
        break;
      }
    }

    // Also check for takeout mention in details
    if (
      !info.offersTakeout &&
      info.restaurantWeekDetails?.some((d) =>
        d.toLowerCase().includes("takeout")
      )
    ) {
      info.offersTakeout = true;
    }

    // Extract structured fields from restaurantWeekDetails
    if (info.restaurantWeekDetails) {
      const detailsText = info.restaurantWeekDetails.join(" ").toLowerCase();

      // Dining options
      info.offersIndoorDining = detailsText.includes("indoor");
      info.offersOutdoorDining = detailsText.includes("outdoor");

      // BYOB
      info.isBYOB = detailsText.includes("byob");

      // Auto gratuity
      info.autoGratuity = detailsText.includes("gratuity");

      // Excludes Saturdays
      info.excludesSaturdays =
        detailsText.includes("saturday") &&
        (detailsText.includes("not") ||
          detailsText.includes("will not") ||
          detailsText.includes("won't"));

      // Closed days - extract day names
      const daysOfWeek = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ];
      const closedDays: string[] = [];
      for (const detail of info.restaurantWeekDetails) {
        const lowerDetail = detail.toLowerCase();
        if (lowerDetail.includes("closed")) {
          for (const day of daysOfWeek) {
            if (lowerDetail.includes(day)) {
              closedDays.push(day.charAt(0).toUpperCase() + day.slice(1));
            }
          }
        }
      }
      if (closedDays.length > 0) {
        info.closedDays = [...new Set(closedDays)]; // Remove duplicates
      }

      // Large party note - find details mentioning parties/groups
      for (const detail of info.restaurantWeekDetails) {
        const lowerDetail = detail.toLowerCase();
        if (
          lowerDetail.includes("party") ||
          lowerDetail.includes("parties") ||
          lowerDetail.includes("group") ||
          lowerDetail.includes("guest")
        ) {
          info.largePartyNote = detail;
          break;
        }
      }
    }

    // Extract dietary options
    const dietaryMatch = html.match(
      /Additional [Dd]ietary [Oo]fferings?[:\s]*<\/strong>([^<]+)/i
    );
    if (dietaryMatch) {
      const dietaryText = dietaryMatch[1].trim();
      const options = dietaryText
        .split(/[,\s]+and\s+|,\s*/)
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
      if (options.length > 0) {
        info.dietaryOptions = options;
      }
    }

    // Extract notes
    const noteMatch = html.match(/<strong>Note:<\/strong>([^<]+)/i);
    if (noteMatch) {
      info.notes = noteMatch[1].trim();
    }
  } catch (error) {
    console.error(`Failed to scrape ${basic.name}:`, error);
  }

  return info;
}

// Main function
async function main() {
  // Read basic.json
  const basicPath = path.join(__dirname, "..", "data", "basic.json");
  const basicData: BasicRestaurant[] = JSON.parse(
    fs.readFileSync(basicPath, "utf-8")
  );

  console.log(`Found ${basicData.length} restaurants to scrape`);

  const restaurants: RestaurantInfo[] = [];

  // Process restaurants in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < basicData.length; i += batchSize) {
    const batch = basicData.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(scrapeRestaurant));
    restaurants.push(...batchResults);

    // Add a small delay between batches
    if (i + batchSize < basicData.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Skip geocoding for now - coordinates will be set to 0,0
  // To add geocoding later, use Google Maps Geocoding API or batch process
  console.log("\nSkipping geocoding (coordinates will be 0,0)...");
  console.log("To add coordinates, use Google Maps Geocoding API separately.");

  // Save to new JSON file
  const outputPath = path.join(
    __dirname,
    "..",
    "data",
    "restaurants-full.json"
  );
  fs.writeFileSync(outputPath, JSON.stringify(restaurants, null, 2));
  console.log(`\nSaved ${restaurants.length} restaurants to ${outputPath}`);
}

main().catch(console.error);
