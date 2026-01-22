"use client";

import { Restaurant } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Globe,
  Users,
  Leaf,
  Sun,
  Home,
  ShoppingBag,
  X,
  Star,
  Wine,
  Calendar,
  FileText,
} from "lucide-react";

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClose?: () => void;
  variant?: "popup" | "list";
}

export function RestaurantCard({
  restaurant,
  onClose,
  variant = "popup",
}: RestaurantCardProps) {
  const isPopup = variant === "popup";

  // Determine price tiers
  const priceTiers: string[] = [];
  if (restaurant.offersLunch20) priceTiers.push("$20 Lunch");
  if (restaurant.offersDinner45) priceTiers.push("$45 Dinner");
  if (restaurant.offersDinner60) priceTiers.push("$60 Dinner");

  return (
    <Card
      className={`
        ${isPopup ? "w-full max-w-[380px] shadow-xl" : "w-full max-w-full"} 
        border-2 border-[#1a2744]/10 bg-[#faf8f5] gap-3
      `}
    >
      <CardHeader className="pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl font-semibold text-[#1a2744]">
              {restaurant.name}
            </CardTitle>
            {/* Google Rating */}
            {restaurant.googleRating && (
              <div className="flex items-center gap-1 mt-1">
                <Star className="h-4 w-4 fill-[#d4a853] text-[#d4a853]" />
                <span className="text-sm font-medium text-[#1a2744]">
                  {restaurant.googleRating}
                </span>
                {restaurant.googleReviewCount && (
                  <span className="text-sm text-[#1a2744]/60">
                    ({restaurant.googleReviewCount.toLocaleString()} reviews)
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isPopup && onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#1a2744]/60 hover:text-[#1a2744]"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {/* Price Tiers */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {restaurant.offersLunch20 && (
            <Badge
              asChild={Boolean(restaurant.Lunch20MenuLink)}
              className="bg-[#4a9c6d] hover:bg-[#3a8c5d] text-white text-xs"
            >
              {restaurant.Lunch20MenuLink ? (
                <a
                  href={restaurant.Lunch20MenuLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  $20 Lunch
                  <FileText className="h-3 w-3 ml-1" />
                </a>
              ) : (
                "$20 Lunch"
              )}
            </Badge>
          )}
          {restaurant.offersDinner45 && (
            <Badge
              asChild={Boolean(restaurant.Dinner45MenuLink)}
              className="bg-[#1a2744] hover:bg-[#1a2744]/80 text-white text-xs"
            >
              {restaurant.Dinner45MenuLink ? (
                <a
                  href={restaurant.Dinner45MenuLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  $45 Dinner
                  <FileText className="h-3 w-3 ml-1" />
                </a>
              ) : (
                "$45 Dinner"
              )}
            </Badge>
          )}
          {restaurant.offersDinner60 && (
            <Badge
              asChild={Boolean(restaurant.Dinner60MenuLink)}
              className="bg-[#d4a853] hover:bg-[#c49943] text-white text-xs"
            >
              {restaurant.Dinner60MenuLink ? (
                <a
                  href={restaurant.Dinner60MenuLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  $60 Dinner
                  <FileText className="h-3 w-3 ml-1" />
                </a>
              ) : (
                "$60 Dinner"
              )}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Address */}
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 mt-0.5 text-[#d4a853]" />
          <span className="text-[#1a2744]/80">{restaurant.address}</span>
        </div>

        {/* Phone */}
        {restaurant.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-[#d4a853]" />
            <a
              href={`tel:${restaurant.phone}`}
              className="text-[#1a2744]/80 hover:text-[#1a2744] hover:underline"
            >
              {restaurant.phone}
            </a>
          </div>
        )}

        {/* Dining Options */}
        <div className="flex flex-wrap gap-2">
          {restaurant.offersIndoorDining && (
            <Badge variant="outline" className="text-xs border-[#1a2744]/20">
              <Home className="h-3 w-3 mr-1" />
              Indoor
            </Badge>
          )}
          {restaurant.offersOutdoorDining && (
            <Badge variant="outline" className="text-xs border-[#1a2744]/20">
              <Sun className="h-3 w-3 mr-1" />
              Outdoor
            </Badge>
          )}
          {restaurant.offersTakeout && (
            <Badge variant="outline" className="text-xs border-[#1a2744]/20">
              <ShoppingBag className="h-3 w-3 mr-1" />
              Takeout
            </Badge>
          )}
          {restaurant.isBYOB && (
            <Badge variant="outline" className="text-xs border-[#4a9c6d] text-[#4a9c6d]">
              <Wine className="h-3 w-3 mr-1" />
              BYOB
            </Badge>
          )}
        </div>

        {/* Dietary Options */}
        {restaurant.dietaryOptions && restaurant.dietaryOptions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {restaurant.dietaryOptions.map((option) => (
              <Badge
                key={option}
                variant="secondary"
                className="text-xs bg-[#4a9c6d]/10 text-[#4a9c6d] hover:bg-[#4a9c6d]/20"
              >
                <Leaf className="h-3 w-3 mr-1" />
                {option}
              </Badge>
            ))}
          </div>
        )}

        {/* Policies */}
        {(restaurant.excludesSaturdays || restaurant.closedDays?.length) && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
            <Calendar className="h-3.5 w-3.5 mt-0.5" />
            <div>
              {restaurant.excludesSaturdays && <span>Not available on Saturdays. </span>}
              {restaurant.closedDays && restaurant.closedDays.length > 0 && (
                <span>Closed: {restaurant.closedDays.join(", ")}</span>
              )}
            </div>
          </div>
        )}

        {/* Large Party Notes */}
        {restaurant.largePartyNote && (
          <div className="flex items-start gap-2 text-xs text-[#1a2744]/60 bg-[#1a2744]/5 p-2 rounded">
            <Users className="h-3.5 w-3.5 mt-0.5" />
            <span>{restaurant.largePartyNote}</span>
          </div>
        )}

        {/* Auto Gratuity Notice */}
        {restaurant.autoGratuity && (
          <p className="text-xs text-[#1a2744]/60 italic">
            ⚠️ Gratuity automatically added to checks
          </p>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {restaurant.website ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-[#1a2744]/20 hover:bg-[#1a2744] hover:text-white gap-1"
              asChild
            >
              <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4" />
                Site
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-[#1a2744]/20 opacity-50 cursor-not-allowed gap-1"
              disabled
            >
              <Globe className="h-4 w-4" />
              Site
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full border-[#1a2744]/20 hover:bg-[#1a2744] hover:text-white gap-1"
            asChild
          >
            <a href={`https://centercityphila.org/explore-center-city/ccd-restaurant-week#${restaurant.id}`} target="_blank" rel="noopener noreferrer">
              <FileText className="h-4 w-4" />
              Details
            </a>
          </Button>
          <Button
            size="sm"
            className="w-full bg-[#d4a853] hover:bg-[#c49943] text-white gap-1"
            asChild
          >
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                restaurant.name + ", " + restaurant.address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin className="h-4 w-4" />
              Map
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
