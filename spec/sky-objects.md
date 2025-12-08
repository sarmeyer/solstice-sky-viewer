
---

# `spec/sky-objects.md`

## Feature: Solstice Sky Viewer – Sky Objects API

### Overview

The user enters a location (city, state, country or ZIP).
The system returns a small set of visible celestial objects (stars, planets, prominent objects) for **tonight**, including basic visibility information.

This API provides structured astronomical visibility data for the UI to display.
**It should not contain UI or rendering logic.**

---

## User Story

> As a user, I want to enter my location and see a few celestial objects visible tonight so I can quickly understand what’s in the night sky without needing complex astronomy knowledge.

---

## Acceptance Criteria

* When a valid location is provided, the API returns:

  * the resolved location name
  * geographic coordinates
  * the date (ISO)
  * **3–5 objects**
* Each object contains:

  * id
  * name
  * type (`star`, `planet`, `constellation`, `other`)
  * simple visibility (`good`, `ok`, `poor`)
  * rise and set times (ISO strings)
  * short note
* On invalid or missing location, return an error (status 400 or 500) in a consistent error shape.
* Data returned MUST match the defined schema.

---

## Endpoint

```
GET /api/sky-objects?location=<string>
```

### Query Parameters

| name       | type   | required | example      |
| ---------- | ------ | -------- | ------------ |
| `location` | string | yes      | `Denver, CO` |

#### Notes

* Location may be city name, region, country, or postal code.
* For now, `date` always defaults to **current date (user’s local day)** → server may treat as UTC-based “tonight”.

---

## Success Response (`200`)

```jsonc
{
  "location": {
    "query": "Denver, CO",
    "resolvedName": "Denver, Colorado, USA",
    "lat": 39.7392,
    "lon": -104.9903
  },
  "date": "2025-12-21",
  "objects": [
    {
      "id": "jupiter",
      "name": "Jupiter",
      "type": "planet",
      "visibility": "good",
      "riseTime": "2025-12-21T19:03:00Z",
      "setTime": "2025-12-22T06:15:00Z",
      "magnitude": -2.3,
      "note": "Bright in the southeast after sunset."
    }
  ]
}
```

---

## Error Response (`4xx/5xx`)

```jsonc
{
  "error": {
    "code": "INVALID_LOCATION",
    "message": "Could not resolve location."
  }
}
```

### Possible `error.code` values

| code               | reason                                    |
| ------------------ | ----------------------------------------- |
| `INVALID_LOCATION` | Location missing or could not be geocoded |
| `UPSTREAM_ERROR`   | External API error                        |
| `UNKNOWN`          | Unexpected failure                        |

---

## Schema (informal)

### Root

* `location`: object
* `date`: string (ISO date)
* `objects`: array of `SkyObject` (3–5)

### SkyObject

* `id`: string
* `name`: string
* `type`: `"star" | "planet" | "constellation" | "other"`
* `visibility`: `"good" | "ok" | "poor"`
* `riseTime`: ISO datetime string
* `setTime`: ISO datetime string
* `magnitude`: number (optional)
* `note`: string

---

## Notes for Implementation

* Fake implementation is allowed initially (static objects).
* Real external astronomy API can be integrated later.
* Response shape must remain consistent even if upstream provider changes.
* **Do not add extra fields without first updating this spec.**

---

## Out of Scope (for now)

* Rendering star positions
* Constellation boundaries
* Real-time sky maps
* Multiple dates
* Seasonal comparisons
* Authentication

---

## Version

```
v0.1 – Initial specification (fake data acceptable)
```