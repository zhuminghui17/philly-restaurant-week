"use client";

import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Restaurant, CUISINE_COLORS } from "@/lib/types";
import { useState, useCallback } from "react";

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  onRestaurantSelect: (restaurant: Restaurant | null) => void;
  apiKey: string;
}

// Center of Philadelphia Center City
const PHILLY_CENTER = { lat: 39.9526, lng: -75.1652 };

// Determine marker color based on cuisine (first cuisine type)
function getMarkerColor(restaurant: Restaurant): string {
  const primaryCuisine = restaurant.cuisineTypes?.[0];
  if (primaryCuisine && CUISINE_COLORS[primaryCuisine]) {
    return CUISINE_COLORS[primaryCuisine];
  }
  return "#6b7280"; // Gray fallback for restaurants without cuisine
}

export function RestaurantMap({
  restaurants,
  selectedRestaurant,
  onRestaurantSelect,
  apiKey,
}: RestaurantMapProps) {
  const [mapLoaded, setMapLoaded] = useState(false);

  const handleMarkerClick = useCallback(
    (restaurant: Restaurant) => {
      onRestaurantSelect(restaurant);
    },
    [onRestaurantSelect]
  );

  return (
    <APIProvider apiKey={apiKey} onLoad={() => setMapLoaded(true)}>
      <Map
        defaultCenter={PHILLY_CENTER}
        defaultZoom={14}
        mapId="philly-restaurant-week-map"
        className="w-full h-full rounded-lg"
        gestureHandling="greedy"
        disableDefaultUI={false}
      >
        {mapLoaded &&
          restaurants.map((restaurant) => (
            <AdvancedMarker
              key={restaurant.id}
              position={{ lat: restaurant.lat, lng: restaurant.lng }}
              onClick={() => handleMarkerClick(restaurant)}
              title={restaurant.name}
            >
              <Pin
                background={
                  selectedRestaurant?.id === restaurant.id
                    ? "#e63946" // Red when selected
                    : getMarkerColor(restaurant)
                }
                borderColor={
                  selectedRestaurant?.id === restaurant.id ? "#ffffff" : "#1a2744"
                }
                glyphColor="#ffffff"
                scale={selectedRestaurant?.id === restaurant.id ? 1 : 0.7}
              />
            </AdvancedMarker>
          ))}
      </Map>
    </APIProvider>
  );
}

// Note: Map styling is controlled via Google Cloud Console when using mapId
// To customize the map appearance, create a Map Style in the Cloud Console
// and associate it with the mapId "philly-restaurant-week-map"
