import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/sky-objects/route";
import { NextRequest } from "next/server";

describe("GET /api/sky-objects", () => {
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

