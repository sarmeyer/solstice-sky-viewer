import { NextRequest, NextResponse } from "next/server";
import type {
  SkyObjectsResponse,
  SkyObjectsErrorResponse,
  SkyObject,
  Location,
} from "@/types/skyObjects";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locationQuery = searchParams.get("location");

  // Check if location parameter is missing
  if (!locationQuery || locationQuery.trim() === "") {
    const errorResponse: SkyObjectsErrorResponse = {
      error: {
        code: "INVALID_LOCATION",
        message: "Location parameter is required.",
      },
    };
    return NextResponse.json(errorResponse, { status: 400 });
  }

  // Generate current date in ISO format (YYYY-MM-DD)
  const today = new Date();
  const date = today.toISOString().split("T")[0];

  // Fake location resolution - just echo back the query with a resolved name
  const location: Location = {
    query: locationQuery,
    resolvedName: `${locationQuery}, USA`,
    lat: 39.7392, // Default to Denver coordinates for fake data
    lon: -104.9903,
  };

  // Generate fake sky objects (1-5 objects as per tests)
  // Calculate next day for setTime
  const nextDay = new Date(today);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDate = nextDay.toISOString().split("T")[0];

  const objects: SkyObject[] = [
    {
      id: "jupiter",
      name: "Jupiter",
      type: "planet",
      visibility: "good",
      riseTime: `${date}T19:03:00Z`,
      setTime: `${nextDate}T06:15:00Z`,
      magnitude: -2.3,
      note: "Bright in the southeast after sunset.",
    },
    {
      id: "sirius",
      name: "Sirius",
      type: "star",
      visibility: "good",
      riseTime: `${date}T18:30:00Z`,
      setTime: `${nextDate}T05:45:00Z`,
      magnitude: -1.46,
      note: "The brightest star in the night sky.",
    },
    {
      id: "orion",
      name: "Orion",
      type: "constellation",
      visibility: "ok",
      riseTime: `${date}T20:00:00Z`,
      setTime: `${nextDate}T07:30:00Z`,
      note: "Visible in the eastern sky.",
    },
  ];

  const response: SkyObjectsResponse = {
    location,
    date,
    objects,
  };

  return NextResponse.json(response, { status: 200 });
}

