import type { SkyObject } from "../../../../types/skyObjects"

interface OpenMeteoResponse {
  daily: {
    sunrise: string[]
    sunset: string[]
    moonrise: string[]
    moonset: string[]
    moon_phase: number[]
  }
}

/**
 * Fetches astronomy data from Open-Meteo API
 */
export async function fetchAstronomyData(
  lat: number,
  lon: number
): Promise<OpenMeteoResponse> {
  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.searchParams.set("latitude", lat.toString())
  url.searchParams.set("longitude", lon.toString())
  url.searchParams.set("daily", "sunrise,sunset")
  url.searchParams.set("timezone", "auto")
  console.log(url.toString())

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Formats ISO datetime string to readable time (HH:MM)
 */
function formatTime(isoString: string): string {
  // Extract time portion from ISO string (format: YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS)
  const timeMatch = isoString.match(/T(\d{2}):(\d{2})/)
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`
  }

  // Fallback: try parsing as Date (for full ISO strings with timezone)
  try {
    const date = new Date(isoString)
    if (!isNaN(date.getTime())) {
      const hours = date.getUTCHours().toString().padStart(2, "0")
      const minutes = date.getUTCMinutes().toString().padStart(2, "0")
      return `${hours}:${minutes}`
    }
  } catch {
    // Ignore parsing errors
  }

  // If all else fails, return the original string
  return isoString
}

/**
 * Determines sun visibility based on current time relative to sunset/sunrise
 * If past sunset but before next sunrise, visibility is "poor"
 */
function getSunVisibility(
  sunset: string,
  nextSunrise: string | undefined
): "good" | "poor" {
  const now = new Date()
  const sunsetTime = new Date(sunset)
  const nextSunriseTime = nextSunrise ? new Date(nextSunrise) : null

  // If we're past sunset
  if (now > sunsetTime) {
    // Check if we're before the next sunrise
    if (nextSunriseTime && now < nextSunriseTime) {
      return "poor" // Sun is below horizon
    }
    // If no next sunrise data, assume we're in night (poor visibility)
    if (!nextSunriseTime) {
      return "poor"
    }
  }

  // Sun is above horizon or we don't have enough data
  return "good"
}

/**
 * Converts Open-Meteo astronomy data to SkyObject array
 */
export function mapAstronomyDataToSkyObjects(
  data: OpenMeteoResponse,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  date: string
): SkyObject[] {
  const objects: SkyObject[] = []

  // Get today's data (first element in arrays)
  const sunrise = data.daily.sunrise[0]
  const sunset = data.daily.sunset[0]
  // Get tomorrow's sunrise (second element) for visibility calculation
  const nextSunrise = data.daily.sunrise[1]

  // Sun object
  if (sunrise && sunset) {
    const visibility = getSunVisibility(sunset, nextSunrise)

    objects.push({
      id: "sun",
      name: "Sun",
      type: "star",
      visibility,
      riseTime: sunrise,
      setTime: sunset,
      note: `Sunrise at ${formatTime(sunrise)} / Sunset at ${formatTime(
        sunset
      )}`,
    })
  }

  return objects
}
