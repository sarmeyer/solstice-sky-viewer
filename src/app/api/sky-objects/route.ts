import { NextRequest, NextResponse } from "next/server"
import type {
  SkyObjectsResponse,
  SkyObjectsErrorResponse,
  Location,
} from "../../../../types/skyObjects"
import { geocodeLocation } from "./geocode"
import { fetchAstronomyData, mapAstronomyDataToSkyObjects } from "./astronomy"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const locationQuery = searchParams.get("location")

  // Check if location parameter is missing
  if (!locationQuery || locationQuery.trim() === "") {
    const errorResponse: SkyObjectsErrorResponse = {
      error: {
        code: "INVALID_LOCATION",
        message: "Location parameter is required.",
      },
    }
    return NextResponse.json(errorResponse, { status: 400 })
  }

  try {
    // Step 1: Geocode location to get lat/lon
    let geocodeResult
    try {
      geocodeResult = await geocodeLocation(locationQuery.trim())
    } catch (error) {
      const errorResponse: SkyObjectsErrorResponse = {
        error: {
          code: "INVALID_LOCATION",
          message: `Could not resolve location: ${error}`,
        },
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const location: Location = {
      query: locationQuery,
      resolvedName: geocodeResult.resolvedName,
      lat: geocodeResult.lat,
      lon: geocodeResult.lon,
    }

    // Step 2: Get current date in ISO format (YYYY-MM-DD)
    const today = new Date()
    const date = today.toISOString().split("T")[0]

    // Step 3: Fetch astronomy data from USNO RSTT API
    let astronomyData
    try {
      astronomyData = await fetchAstronomyData(
        geocodeResult.lat,
        geocodeResult.lon,
        date
      )
    } catch (error) {
      const errorResponse: SkyObjectsErrorResponse = {
        error: {
          code: "UPSTREAM_ERROR",
          message: `Failed to fetch astronomy data: ${error}`,
        },
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // Step 4: Map astronomy data to SkyObjects
    let objects
    try {
      objects = await mapAstronomyDataToSkyObjects(astronomyData, date)
    } catch (error) {
      const errorResponse: SkyObjectsErrorResponse = {
        error: {
          code: "UPSTREAM_ERROR",
          message: `Failed to process astronomy data: ${error}`,
        },
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    // Ensure we have at least 1 object (should always have Sun and Moon)
    if (objects.length === 0) {
      const errorResponse: SkyObjectsErrorResponse = {
        error: {
          code: "UPSTREAM_ERROR",
          message: "No astronomy data available.",
        },
      }
      return NextResponse.json(errorResponse, { status: 500 })
    }

    const response: SkyObjectsResponse = {
      location,
      date,
      objects,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    // Catch any unexpected errors
    const errorResponse: SkyObjectsErrorResponse = {
      error: {
        code: "UNKNOWN",
        message: `An unexpected error occurred: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
