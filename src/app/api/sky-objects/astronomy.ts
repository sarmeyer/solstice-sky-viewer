import type { SkyObject } from "../../../../types/skyObjects"

interface USNOResponse {
  apiversion: string
  geometry: {
    coordinates: [number, number]
    type: string
  }
  properties: {
    data: {
      sundata: Array<{
        phen: string
        time: string
      }>
      moondata?: Array<{
        phen: string
        time: string
      }>
      curphase?: string
      fracillum?: string
      day: number
      month: number
      year: number
      tz: number
    }
  }
  type: string
}

/**
 * Fetches astronomy data from USNO RSTT oneday API
 */
export async function fetchAstronomyData(
  lat: number,
  lon: number,
  date: string
): Promise<USNOResponse> {
  // Format date as YYYY-MM-DD
  const formattedDate = date.split("T")[0] // Extract date part if ISO datetime string
  if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
    throw new Error(`Invalid date format. Expected YYYY-MM-DD, got: ${date}`)
  }

  // Build URL with encoded parameters
  const coords = `${lat},${lon}`
  const url = `https://aa.usno.navy.mil/api/rstt/oneday?date=${encodeURIComponent(
    formattedDate
  )}&coords=${encodeURIComponent(coords)}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`USNO API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Converts HH:MM time string to ISO datetime string by combining with date
 */
function timeToISO(date: string, time: string): string {
  // date is YYYY-MM-DD, time is HH:MM
  return `${date}T${time}:00`
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
 * Determines moon visibility based on current time relative to moonrise/moonset
 * Moon is visible if current time is between moonrise and moonset
 */
function getMoonVisibility(
  moonrise: string,
  moonset: string
): "good" | "ok" | "poor" {
  const now = new Date()
  const riseTime = new Date(moonrise)
  const setTime = new Date(moonset)

  // Handle case where moonset is next day (moonset time < moonrise time)
  if (setTime < riseTime) {
    // Moon sets the next day, so it's visible if we're past moonrise or before moonset
    if (now >= riseTime || now < setTime) {
      return "good"
    }
    return "poor"
  }

  // Normal case: moonrise < moonset on same day
  if (now >= riseTime && now < setTime) {
    return "good"
  }

  // Moon is below horizon
  return "poor"
}

/**
 * Converts USNO astronomy data to SkyObject array
 */
export async function mapAstronomyDataToSkyObjects(
  data: USNOResponse,
  date: string
): Promise<SkyObject[]> {
  const objects: SkyObject[] = []
  console.log(data.properties.data)

  // Extract date in YYYY-MM-DD format
  const formattedDate = date.split("T")[0]

  // Get sun rise and set times from sundata
  const sunRiseEvent = data.properties.data.sundata.find(
    event => event.phen === "Rise"
  )
  const sunSetEvent = data.properties.data.sundata.find(
    event => event.phen === "Set"
  )

  if (sunRiseEvent && sunSetEvent) {
    // Convert HH:MM times to ISO datetime strings
    const sunrise = timeToISO(formattedDate, sunRiseEvent.time)
    const sunset = timeToISO(formattedDate, sunSetEvent.time)

    // Get tomorrow's sunrise for visibility calculation
    // Calculate tomorrow's date
    const tomorrow = new Date(formattedDate)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split("T")[0]

    // Fetch tomorrow's data to get next sunrise
    let nextSunrise: string | undefined
    try {
      const coords = `${data.geometry.coordinates[1]},${data.geometry.coordinates[0]}`
      const tomorrowUrl = `https://aa.usno.navy.mil/api/rstt/oneday?date=${encodeURIComponent(
        tomorrowDate
      )}&coords=${encodeURIComponent(coords)}`
      const tomorrowResponse = await fetch(tomorrowUrl)
      if (tomorrowResponse.ok) {
        const tomorrowData: USNOResponse = await tomorrowResponse.json()
        const tomorrowSunRiseEvent = tomorrowData.properties.data.sundata.find(
          event => event.phen === "Rise"
        )
        if (tomorrowSunRiseEvent) {
          nextSunrise = timeToISO(tomorrowDate, tomorrowSunRiseEvent.time)
        }
      }
    } catch {
      // If we can't fetch tomorrow's data, continue without it
    }

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

  // Get moon rise and set times from moondata
  if (data.properties.data.moondata) {
    const moonRiseEvent = data.properties.data.moondata.find(
      event => event.phen === "Rise"
    )
    const moonSetEvent = data.properties.data.moondata.find(
      event => event.phen === "Set"
    )

    if (moonRiseEvent && moonSetEvent) {
      // Convert HH:MM times to ISO datetime strings
      const moonrise = timeToISO(formattedDate, moonRiseEvent.time)
      let moonset = timeToISO(formattedDate, moonSetEvent.time)

      // Handle case where moonset is next day (moonset time < moonrise time)
      if (moonSetEvent.time < moonRiseEvent.time) {
        const tomorrow = new Date(formattedDate)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowDate = tomorrow.toISOString().split("T")[0]
        moonset = timeToISO(tomorrowDate, moonSetEvent.time)
      }

      const moonVisibility = getMoonVisibility(moonrise, moonset)

      // Build note with moon phase information if available
      let moonNote = `Moonrise at ${formatTime(
        moonrise
      )} / Moonset at ${formatTime(moonset)}`
      if (data.properties.data.curphase) {
        moonNote += ` (${data.properties.data.curphase}`
        if (data.properties.data.fracillum) {
          moonNote += `, ${data.properties.data.fracillum} illuminated`
        }
        moonNote += ")"
      }

      objects.push({
        id: "moon",
        name: "Moon",
        type: "other",
        visibility: moonVisibility,
        riseTime: moonrise,
        setTime: moonset,
        note: moonNote,
      })
    }
  }

  return objects
}
