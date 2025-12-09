/**
 * Fetches a star chart image URL for a constellation from AstronomyAPI
 */

interface StarChartResponse {
  data: {
    imageUrl: string;
  };
}

/**
 * Maps constellation names to their 3-letter IDs used by AstronomyAPI
 * Common constellation abbreviations (IAU standard)
 */
function getConstellationId(constellationName: string): string {
  const nameLower = constellationName.toLowerCase().trim();
  
  // Common constellation name to 3-letter ID mapping
  const mapping: Record<string, string> = {
    "orion": "ori",
    "ursa major": "uma",
    "ursa minor": "umi",
    "cassiopeia": "cas",
    "cygnus": "cyg",
    "lyra": "lyr",
    "scorpius": "sco",
    "sagittarius": "sgr",
    "leo": "leo",
    "virgo": "vir",
    "gemini": "gem",
    "taurus": "tau",
    "aries": "ari",
    "pisces": "pis",
    "aquarius": "aqr",
    "capricornus": "cap",
    "libra": "lib",
    "cancer": "cnc",
    "andromeda": "and",
    "pegasus": "peg",
    "perseus": "per",
    "bootes": "boo",
    "hercules": "her",
    "draco": "dra",
    "cepheus": "cep",
    "aquila": "aql",
    "delphinus": "del",
    "vulpecula": "vul",
  };

  // Try exact match first
  if (mapping[nameLower]) {
    return mapping[nameLower];
  }

  // Try partial match (e.g., "Orion" matches "orion")
  for (const [key, value] of Object.entries(mapping)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return value;
    }
  }

  // Fallback: use first 3 letters of the name, lowercase
  // This is a best-effort approach if the constellation isn't in our mapping
  return nameLower.substring(0, 3).padEnd(3, "a");
}

/**
 * Gets a star chart image URL for a constellation from AstronomyAPI
 * 
 * @param options Configuration for the star chart request
 * @returns Promise resolving to the image URL string
 * @throws Error if API call fails or credentials are missing
 */
export async function getConstellationStarChart(options: {
  latitude: number;
  longitude: number;
  date: string; // ISO date, e.g. "2025-12-21"
  constellationId: string; // 3-letter lowercase id like "ori"
  style?: string; // default "navy"
}): Promise<string> {
  const { latitude, longitude, date, constellationId, style = "navy" } = options;

  // Get credentials from environment variables
  const appId = process.env.ASTRONOMY_API_APP_ID;
  const appSecret = process.env.ASTRONOMY_API_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error(
      "AstronomyAPI credentials are missing. Please set ASTRONOMY_API_APP_ID and ASTRONOMY_API_APP_SECRET environment variables."
    );
  }

  // Build Basic auth header
  const authString = Buffer.from(`${appId}:${appSecret}`).toString("base64");
  const authorizationHeader = `Basic ${authString}`;

  // Prepare request body
  const requestBody = {
    style,
    observer: {
      latitude,
      longitude,
      date,
    },
    view: {
      type: "constellation",
      parameters: {
        constellation: constellationId.toLowerCase(),
      },
    },
  };

  // Make API request
  const response = await fetch(
    "https://api.astronomyapi.com/api/v2/studio/star-chart",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorizationHeader,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `AstronomyAPI Star Chart request failed: ${response.status} ${response.statusText}. ${errorText}`
    );
  }

  // Parse response
  let data: StarChartResponse;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error(
      `Failed to parse AstronomyAPI response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }

  // Extract image URL
  if (!data?.data?.imageUrl) {
    throw new Error(
      "AstronomyAPI response missing imageUrl in data.data.imageUrl"
    );
  }

  return data.data.imageUrl;
}

/**
 * Helper function to get constellation ID from a SkyObject
 * This maps common constellation names to their 3-letter IDs
 */
export function getConstellationIdFromSkyObject(skyObject: {
  name: string;
  id?: string;
}): string {
  // Try using the name first
  const idFromName = getConstellationId(skyObject.name);
  
  // If the id field looks like a 3-letter constellation ID, use it
  if (skyObject.id && skyObject.id.length === 3 && /^[a-z]{3}$/i.test(skyObject.id)) {
    return skyObject.id.toLowerCase();
  }
  
  return idFromName;
}

