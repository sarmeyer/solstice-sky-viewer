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

interface CelnavResponse {
  apiversion: string
  geometry: {
    coordinates: [number, number]
    type: string
  }
  properties: {
    data: Array<{
      object: string
      almanac_data: {
        dec: number
        gha: number
        hc: number
        zn: number
      }
      altitude_corrections: {
        isCorrected: boolean
        pa: number
        refr: number
        sd: number
        sum: number
      }
      nav_star_number?: number
    }>
  }
}

/**
 * Known celestial objects to include from celnav data
 * Filters out unknown stars and objects that aren't notable
 */
const KNOWN_OBJECTS = new Set([
  // planets
  "Mercury",
  "Venus",
  "Mars",
  "Jupiter",
  "Saturn",
  // constellations
  "Orion",
  "Ursa Major",
  "Ursa Minor",
  "Cassiopeia",
  "Cygnus",
  "Lyra",
  "Andromeda",
  "Perseus",
  "Taurus",
  "Gemini",
  "Leo",
  "Scorpius",
  "Sagittarius",
  "Pegasus",
  // asterisms/clusters
  "Big Dipper",
  "Orion's Belt",
  "Pleiades",
  // southern
  "Crux",
])

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
 * Fetches celestial navigation data from USNO celnav API
 * Returns null if the request fails (graceful degradation)
 */
async function fetchCelnavData(
  lat: number,
  lon: number,
  date: string,
  time: string
): Promise<CelnavResponse | null> {
  try {
    // Format date as YYYY-MM-DD
    const formattedDate = date.split("T")[0]
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
      return null
    }

    // Format time as HH:MM (24-hour)
    const formattedTime = time.match(/^(\d{2}):(\d{2})/)
      ? time.substring(0, 5)
      : time
    if (!/^\d{2}:\d{2}$/.test(formattedTime)) {
      return null
    }

    // Build URL with encoded parameters
    const coords = `${lat},${lon}`
    const url = `https://aa.usno.navy.mil/api/celnav?date=${encodeURIComponent(
      formattedDate
    )}&time=${encodeURIComponent(formattedTime)}&coords=${encodeURIComponent(
      coords
    )}`

    const response = await fetch(url)

    if (!response.ok) {
      // Log but don't throw - graceful degradation
      console.warn(
        `USNO celnav API error: ${response.status} ${response.statusText}`
      )
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    // Log but don't throw - graceful degradation
    console.warn(`Failed to fetch celnav data: ${error}`)
    return null
  }
}

/**
 * Converts HH:MM time string to ISO datetime string by combining with date
 */
function timeToISO(date: string, time: string): string {
  return `${date}T${time}:00.000Z`
}

/**
 * Formats ISO datetime string to readable current time (HH:MM)
 */
function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
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
 * Determines the type of celestial object based on its name
 */
function getObjectType(
  objectName: string,
  navStarNumber?: number
): "star" | "planet" | "constellation" | "other" {
  const name = objectName.toLowerCase()

  // Known planets
  const planets = [
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
  ]
  if (planets.includes(name)) {
    return "planet"
  }

  // If it has a nav_star_number, it's a star
  if (navStarNumber !== undefined) {
    return "star"
  }

  // Default to "other" for unknown objects
  return "other"
}

/**
 * Determines visibility based on altitude (hc) from celnav data
 */
function getCelnavVisibility(hc: number): "good" | "ok" | "poor" {
  if (hc > 30) {
    return "good"
  } else if (hc > 0) {
    return "ok"
  } else {
    return "poor"
  }
}

/**
 * Estimates rise and set times based on current altitude and time
 * Since celnav doesn't provide explicit rise/set times, we estimate them
 */
function estimateRiseSetTimes(
  date: string,
  time: string,
  hc: number
): { riseTime: string; setTime: string } {
  const formattedDate = date.split("T")[0]
  const [hours, minutes] = time.split(":").map(Number)

  // If object is above horizon (hc > 0), estimate it rose ~6 hours ago and will set ~6 hours later
  // If below horizon, estimate it will rise ~6 hours later and set ~18 hours later
  let riseHours: number
  let setHours: number
  let riseDateOffset = 0
  let setDateOffset = 0

  if (hc > 0) {
    // Above horizon: estimate it rose earlier
    riseHours = hours - 6
    if (riseHours < 0) {
      riseHours += 24
      riseDateOffset = -1
    }
    setHours = hours + 6
    if (setHours >= 24) {
      setHours -= 24
      setDateOffset = 1
    }
  } else {
    // Below horizon: estimate it will rise later
    riseHours = hours + 6
    if (riseHours >= 24) {
      riseHours -= 24
      riseDateOffset = 1
    }
    setHours = hours + 18
    if (setHours >= 24) {
      setHours -= 24
      setDateOffset = 1
    }
  }

  const baseDate = new Date(formattedDate)

  const riseDate = new Date(baseDate)
  riseDate.setDate(riseDate.getDate() + riseDateOffset)
  const riseDateStr = riseDate.toISOString().split("T")[0]

  const setDate = new Date(baseDate)
  setDate.setDate(setDate.getDate() + setDateOffset)
  const setDateStr = setDate.toISOString().split("T")[0]

  return {
    riseTime: `${riseDateStr}T${String(riseHours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:00`,
    setTime: `${setDateStr}T${String(setHours).padStart(2, "0")}:${String(
      minutes
    ).padStart(2, "0")}:00`,
  }
}

/**
 * Maps celnav objects to SkyObject array
 */
function mapCelnavObjectsToSkyObjects(
  celnavData: CelnavResponse,
  date: string,
  time: string
): SkyObject[] {
  const objects: SkyObject[] = []

  if (
    !celnavData.properties?.data ||
    !Array.isArray(celnavData.properties.data)
  ) {
    return objects
  }

  for (const item of celnavData.properties.data) {
    // Skip Sun and Moon as they're already handled by the RSTT API
    const objectName = item.object
    if (
      !objectName ||
      objectName.toLowerCase() === "sun" ||
      objectName.toLowerCase() === "moon"
    ) {
      continue
    }

    // Only include known objects from our curated list (case-insensitive)
    const normalizedName = objectName.trim()
    const isKnown = Array.from(KNOWN_OBJECTS).some(
      known => known.toLowerCase() === normalizedName.toLowerCase()
    )
    if (!isKnown) {
      continue
    }

    const type = getObjectType(objectName, item.nav_star_number)
    const visibility = getCelnavVisibility(item.almanac_data.hc)
    const { riseTime, setTime } = estimateRiseSetTimes(
      date,
      time,
      item.almanac_data.hc
    )

    // Generate a descriptive note
    const altitude = item.almanac_data.hc
    let note = ""
    if (altitude > 0) {
      note = `Visible tonight at ${altitude.toFixed(1)}° altitude`
    } else {
      note = `Below horizon, will rise later tonight`
    }

    // Create a simple ID from the object name
    const id = objectName.toLowerCase().replace(/\s+/g, "-")

    objects.push({
      id,
      name: objectName,
      type,
      visibility,
      riseTime,
      setTime,
      note,
    })
  }

  return objects
}

/**
 * Converts USNO astronomy data to SkyObject array
 */
export async function mapAstronomyDataToSkyObjects(
  data: USNOResponse,
  date: string
): Promise<SkyObject[]> {
  const objects: SkyObject[] = []
  // Extract date in YYYY-MM-DD format
  const formattedDate = date.split("T")[0]

  // Extract coordinates from data (geometry.coordinates is [lon, lat])
  const lon = data.geometry.coordinates[0]
  const lat = data.geometry.coordinates[1]

  // Get current UTC time in HH:MM format for celnav API
  const now = new Date()
  const utcHours = now.getUTCHours().toString().padStart(2, "0")
  const utcMinutes = now.getUTCMinutes().toString().padStart(2, "0")
  const currentTime = `${utcHours}:${utcMinutes}`

  // Fetch celnav data (gracefully handles failures)
  const celnavData = await fetchCelnavData(lat, lon, formattedDate, currentTime)

  // Map celnav objects if available
  if (celnavData) {
    const celnavObjects = mapCelnavObjectsToSkyObjects(
      celnavData,
      formattedDate,
      currentTime
    )
    objects.push(...celnavObjects)
  }

  // Get sun rise and set times from sundata
  const sunRiseEvent = data.properties.data.sundata.find(
    event => event.phen === "Rise"
  )
  const sunSetEvent = data.properties.data.sundata.find(
    event => event.phen === "Set"
  )

  if (sunRiseEvent && sunSetEvent) {
    // sunRiseEvent { phen: 'Rise', time: '14:15' }
    // sunSetEvent { phen: 'Set', time: '23:44' }

    // Convert HH:MM times to ISO datetime strings
    const sunrise = timeToISO(formattedDate, sunRiseEvent.time)
    const sunset = timeToISO(formattedDate, sunSetEvent.time)

    // sunrise 2025-12-09T14:15:00
    // sunset 2025-12-09T23:44:00

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
