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
 * Gets moon phase description from phase value
 * Open-Meteo moon_phase values:
 * - 0 = New Moon
 * - 0.25 = First Quarter
 * - 0.5 = Full Moon
 * - 0.75 = Last Quarter
 */
function getMoonPhaseDescription(phase: number): string {
  if (phase < 0.125) return "New Moon"
  if (phase < 0.375) return "Waxing Crescent"
  if (phase < 0.625) return phase < 0.5 ? "First Quarter" : "Waxing Gibbous"
  if (phase < 0.875) return phase < 0.75 ? "Full Moon" : "Waning Gibbous"
  return "Last Quarter"
}

/**
 * Determines moon visibility based on phase
 */
function getMoonVisibility(phase: number): "good" | "ok" | "poor" {
  // Full moon and waxing/waning gibbous are most visible
  if (phase > 0.4 && phase < 0.6) return "good" // Full moon
  if ((phase > 0.25 && phase < 0.5) || (phase > 0.5 && phase < 0.75))
    return "good" // Gibbous phases
  if (phase > 0.1 && phase < 0.9) return "ok" // Quarter and crescent
  return "poor" // New moon
}

/**
 * Formats ISO datetime string to readable time (HH:MM)
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const hours = date.getUTCHours().toString().padStart(2, "0")
  const minutes = date.getUTCMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

/**
 * Converts Open-Meteo astronomy data to SkyObject array
 */
export function mapAstronomyDataToSkyObjects(
  data: OpenMeteoResponse,
  date: string
): SkyObject[] {
  const objects: SkyObject[] = []

  // Get today's data (first element in arrays)
  const sunrise = data.daily.sunrise[0]
  const sunset = data.daily.sunset[0]

  // Sun object
  if (sunrise && sunset) {
    objects.push({
      id: "sun",
      name: "Sun",
      type: "other",
      visibility: "good",
      riseTime: sunrise,
      setTime: sunset,
      note: `Sunrise at ${formatTime(sunrise)} / Sunset at ${formatTime(
        sunset
      )}`,
    })
  }

  // Moon object
  // if (moonrise && moonset) {
  //   const phaseDesc = getMoonPhaseDescription(moonPhase)
  //   const visibility = getMoonVisibility(moonPhase)

  //   objects.push({
  //     id: "moon",
  //     name: "Moon",
  //     type: "other",
  //     visibility,
  //     riseTime: moonrise,
  //     setTime: moonset,
  //     note: `Moonrise at ${formatTime(moonrise)} / Moonset at ${formatTime(
  //       moonset
  //     )} / Phase: ${phaseDesc}`,
  //   })
  // }

  return objects
}
