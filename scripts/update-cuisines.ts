import * as fs from "fs";
import * as path from "path";

// Cuisine mappings from the user data
const cuisineData: Record<string, string[]> = {
  American: [
    "a.kitchen*",
    "Bank & Bourbon",
    "Bridget Foy's",
    "Bud & Marilyn's",
    "Butcher Bar",
    "Charlie was a sinner.",
    "City Winery*",
    "Con Murphy's Irish Pub",
    "Darling Jack's Tavern",
    "Del Frisco's Double Eagle Steakhouse*",
    "Devil's Alley",
    "Fork*",
    "Fringe Bar",
    "Hard Rock Cafe",
    "Harp & Crown",
    "Harper's Garden",
    "The Hayes",
    "High Street",
    "McCormick & Schmick's",
    "Monster Vegan",
    "Moshulu*",
    "Ocean Prime*",
    "Oyster House*",
    "Pearl & Mary",
    "PJ Clarkes at the Curtis",
    "Pub & Kitchen",
    "Rockwell & Rose*",
    "SOUTH Restaurant & Jazz Club",
    "Square 1682",
    "Topside Tavern",
    "The Twisted Tail",
    "Village Whiskey",
  ],
  Asian: [
    "Aki Nom Nom",
    "Bleu Sushi",
    "Buddakan",
    "Dim Sum House by Jane G's",
    "Double Knot",
    "Fat Salmon",
    "Fuji Mountain",
    "Grandma's Philly",
    "Jasmine Rice Rittenhouse",
    "Kinme",
    "Kirin House",
    "Koto Sushi",
    "Miss Saigon Vietnamese Restaurant and Lounge",
    "Sampan",
  ],
  Brazilian: ["Nabrasa Brazilian Steakhouse*", "Samba Steakhouse Philly"],
  Cuban: ["Cuba Libre Restaurant & Rum Bar", "Mixto Restaurant"],
  European: ["Restaurant Aleksandar*", "Superfolie"],
  French: [
    "Caribou Café",
    "Château Rouge",
    "Forsythia*",
    "The Lesieur*",
    "Liberté Restobar",
  ],
  Greek: ["Estia Restaurant*", "Kanella Restaurant"],
  Indian: [
    "Sura Indian Bistro",
    "Thanal Indian Tavern",
    "Veda - Modern Indian Bistro",
  ],
  Italian: [
    "Alice Pizza",
    "Ambrosia Ristorante",
    "Barra Rossa",
    "Bellini",
    "Bistro La Baia",
    "Bistro Romano",
    "Buca D'oro Ristorante",
    "Cry Baby Pasta",
    "D'Angelo's Ristorante Italiano & Lounge",
    "Dolce Italian",
    "Farina Pasta Bar",
    "Giuseppe & Sons",
    "Gran Caffe L'Aquila",
    "La Famiglia Ristorante",
    "La Fontana Della Citta",
    "La Nonna",
    "La Sera Italiana",
    "La Viola Bistro",
    "La Viola Ovest",
    "LaScala's Fire",
    "Little Nonna's",
    "Melograno BYOB",
    "Mercato BYOB",
    "Osteria",
    "Osteria Ama Philly",
    "Panorama",
    "Pizzeria Vetri",
    "Porcini",
    "Positano Coast by Aldo Lamberti",
    "Prunella",
    "Radicchio Cafe",
    "Rhythm and Spirits Philadelphia",
    "Spasso Italian Grill",
    "Trattoria Carina",
    "Via Locusta",
    "Vita*",
  ],
  Japanese: ["Kirin House"],
  "Latin American": [
    "Bar Bombon",
    "Bodega Taco Bar",
    "Bolo",
    "Malbec Argentine Steakhouse",
    "Nabrasa Brazilian Steakhouse*",
    "Samba Steakhouse Philly",
  ],
  Mediterranean: ["Barbuzzo", "Dear Daphni", "Dizengoff", "Spice Finch"],
  Mexican: ["Condesa", "El Vez", "Las Bugambilias", "Tequila's Casa Mexicana"],
  Seafood: ["Loch Bar*", "Oltremare", "Oyster House*", "Seafood Unlimited"],
  Southern: ["Rex at The Royal"],
  Spanish: ["Amada Philadelphia", "Oloroso"],
  "Tex-Mex": ["Hi-Lo Taco Co."],
  Thai: ["Grandma's Philly"],
  Vegan: ["Charlie was a sinner."],
};

// Build a reverse mapping: restaurant name -> cuisines[]
function buildCuisineMapping(): Map<string, string[]> {
  const mapping = new Map<string, string[]>();

  for (const [cuisine, restaurants] of Object.entries(cuisineData)) {
    for (const restaurantName of restaurants) {
      // Remove asterisks for matching
      const normalizedName = restaurantName.replace(/\*$/, "").trim();

      if (mapping.has(normalizedName)) {
        mapping.get(normalizedName)!.push(cuisine);
      } else {
        mapping.set(normalizedName, [cuisine]);
      }
    }
  }

  return mapping;
}

// Normalize name for fuzzy matching
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function updateCuisines() {
  const dataPath = path.join(__dirname, "../data/restaurants.json");
  const restaurants = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const cuisineMapping = buildCuisineMapping();

  // Create a normalized map for fuzzy matching
  const normalizedMapping = new Map<string, string[]>();
  for (const [name, cuisines] of cuisineMapping) {
    normalizedMapping.set(normalizeName(name), cuisines);
  }

  let matched = 0;
  let unmatched = 0;
  const unmatchedNames: string[] = [];

  for (const restaurant of restaurants) {
    // Remove old cuisineType field
    delete restaurant.cuisineType;

    const normalizedRestName = normalizeName(restaurant.name);

    // Try exact match first
    let cuisines = normalizedMapping.get(normalizedRestName);

    // Try partial matching if no exact match
    if (!cuisines) {
      for (const [mappedName, mappedCuisines] of normalizedMapping) {
        if (
          normalizedRestName.includes(mappedName) ||
          mappedName.includes(normalizedRestName)
        ) {
          cuisines = mappedCuisines;
          break;
        }
      }
    }

    if (cuisines) {
      restaurant.cuisineTypes = cuisines;
      matched++;
    } else {
      unmatched++;
      unmatchedNames.push(restaurant.name);
    }
  }

  // Write back
  fs.writeFileSync(dataPath, JSON.stringify(restaurants, null, 2));

  console.log(`\nCuisine update complete!`);
  console.log(`Matched: ${matched} restaurants`);
  console.log(`Unmatched: ${unmatched} restaurants`);

  if (unmatchedNames.length > 0) {
    console.log(`\nUnmatched restaurants:`);
    unmatchedNames.forEach((name) => console.log(`  - ${name}`));
  }
}

updateCuisines().catch(console.error);
