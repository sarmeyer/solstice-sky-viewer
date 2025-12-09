/**
 * Geocoding helper function using Open-Meteo Geocoding API
 * Free service: https://open-meteo.com/en/docs/geocoding-api
 */

export interface GeocodeResult {
  lat: number
  lon: number
  resolvedName: string
}

interface OpenMeteoGeocodeResponse {
  results?: Array<{
    id: number
    name: string
    latitude: number
    longitude: number
    country?: string
    admin1?: string
  }>
}

/**
 * Geocodes a location query to latitude/longitude using Open-Meteo API
 */
export async function geocodeLocation(
  locationQuery: string
): Promise<GeocodeResult> {
  try {
    // Normalize location query - add space after comma if missing
    const normalizedQuery = locationQuery.replace(/,([^\s])/g, ", $1")

    const url = new URL("https://geocoding-api.open-meteo.com/v1/search")
    url.searchParams.set("name", normalizedQuery)
    url.searchParams.set("count", "1")
    url.searchParams.set("language", "en")
    url.searchParams.set("format", "json")

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`)
    }

    const data: OpenMeteoGeocodeResponse = await response.json()
    if (!data.results || data.results.length === 0) {
      throw new Error("No location found")
    }

    const result = data.results[0]

    const parts = [result.name]
    if (result.admin1) parts.push(result.admin1)
    if (result.country) parts.push(result.country)
    const resolvedName = parts.join(", ")

    return {
      lat: result.latitude,
      lon: result.longitude,
      resolvedName,
    }
  } catch (error) {
    // If geocoding fails, throw to be caught by route handler
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Geocoding request timed out")
    }
    throw new Error(
      `Failed to geocode location: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    )
  }
}
