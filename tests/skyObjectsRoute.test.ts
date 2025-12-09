import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/sky-objects/route";
import { NextRequest } from "next/server";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GET /api/sky-objects", () => {
  let usnoCallCount: number;

  beforeEach(() => {
    vi.clearAllMocks();
    usnoCallCount = 0;
    
    // Default mock for geocoding API
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("geocoding-api.open-meteo.com")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            results: [
              {
                id: 1,
                name: "Denver",
                latitude: 39.7392,
                longitude: -104.9903,
                admin1: "Colorado",
                country: "United States",
              },
            ],
          }),
        });
      }
      
      // Mock for USNO RSTT oneday API
      if (url.includes("aa.usno.navy.mil/api/rstt/oneday")) {
        usnoCallCount++;
        
        // First call is for today, second call (if any) is for tomorrow
        const isTomorrow = usnoCallCount > 1;
        
        return Promise.resolve({
          ok: true,
          json: async () => ({
            apiversion: "4.0.1",
            geometry: {
              coordinates: [-104.9903, 39.7392],
              type: "Point",
            },
            properties: {
              data: {
                sundata: [
                  { phen: "Begin Civil Twilight", time: isTomorrow ? "06:04" : "06:03" },
                  { phen: "Rise", time: isTomorrow ? "06:35" : "06:34" },
                  { phen: "Upper Transit", time: isTomorrow ? "11:09" : "11:08" },
                  { phen: "Set", time: isTomorrow ? "15:43" : "15:42" },
                  { phen: "End Civil Twilight", time: isTomorrow ? "16:15" : "16:14" },
                ],
                moondata: [
                  { phen: "Rise", time: isTomorrow ? "08:01" : "08:00" },
                  { phen: "Upper Transit", time: isTomorrow ? "12:21" : "12:20" },
                  { phen: "Set", time: isTomorrow ? "16:45" : "16:44" },
                ],
                curphase: "Waxing Crescent",
                fracillum: "2%",
                day: isTomorrow ? 22 : 21,
                month: 12,
                year: 2025,
                tz: -7.0,
              },
            },
            type: "Feature",
          }),
        });
      }
      
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful response", () => {
    it("requires 'location' query param", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/sky-objects?location=Denver,CO")
      );
      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it("returns 200 status", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/sky-objects?location=Denver,CO")
      );
      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it("returns a 'location' object with query and resolvedName", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/sky-objects?location=Denver,CO")
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty("location");
      expect(data.location).toHaveProperty("query");
      expect(data.location).toHaveProperty("resolvedName");
      expect(typeof data.location.query).toBe("string");
      expect(typeof data.location.resolvedName).toBe("string");
    });

    it("returns a 'date' field (ISO string)", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/sky-objects?location=Denver,CO")
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty("date");
      expect(typeof data.date).toBe("string");
      // Validate ISO date format (YYYY-MM-DD)
      expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("returns an 'objects' array of 1-5 sky objects", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/sky-objects?location=Denver,CO")
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty("objects");
      expect(Array.isArray(data.objects)).toBe(true);
      expect(data.objects.length).toBeGreaterThanOrEqual(1);
      expect(data.objects.length).toBeLessThanOrEqual(5);
    });

    it("each object contains: id, name, type, visibility, riseTime, setTime, and note", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/sky-objects?location=Denver,CO")
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.objects.length).toBeGreaterThan(0);
      for (const obj of data.objects) {
        expect(obj).toHaveProperty("id");
        expect(obj).toHaveProperty("name");
        expect(obj).toHaveProperty("type");
        expect(obj).toHaveProperty("visibility");
        expect(obj).toHaveProperty("riseTime");
        expect(obj).toHaveProperty("setTime");
        expect(obj).toHaveProperty("note");

        expect(typeof obj.id).toBe("string");
        expect(typeof obj.name).toBe("string");
        expect(typeof obj.type).toBe("string");
        expect(typeof obj.visibility).toBe("string");
        expect(typeof obj.riseTime).toBe("string");
        expect(typeof obj.setTime).toBe("string");
        expect(typeof obj.note).toBe("string");
      }
    });

    it("type is one of 'star', 'planet', 'constellation', or 'other'", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/sky-objects?location=Denver,CO")
      );
      const response = await GET(request);
      const data = await response.json();

      const validTypes = ["star", "planet", "constellation", "other"];
      for (const obj of data.objects) {
        expect(validTypes).toContain(obj.type);
      }
    });

    it("visibility is one of 'good', 'ok', or 'poor'", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/sky-objects?location=Denver,CO")
      );
      const response = await GET(request);
      const data = await response.json();

      const validVisibility = ["good", "ok", "poor"];
      for (const obj of data.objects) {
        expect(validVisibility).toContain(obj.visibility);
      }
    });
  });

  describe("Error cases", () => {
    it("missing location should return a 400 and an error shape", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/sky-objects")
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("code");
      expect(data.error).toHaveProperty("message");
      expect(typeof data.error.code).toBe("string");
      expect(typeof data.error.message).toBe("string");
    });

    it("error must include: error.code and error.message", async () => {
      const request = new NextRequest(
        new URL("http://localhost:3000/api/sky-objects")
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("code");
      expect(data.error).toHaveProperty("message");
    });
  });
});

