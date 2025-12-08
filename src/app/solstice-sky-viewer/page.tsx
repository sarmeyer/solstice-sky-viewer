"use client"

import { useState, FormEvent } from "react"
import type {
  SkyObjectsResponse,
  SkyObjectsErrorResponse,
  SkyObject,
} from "../../../types/skyObjects"

type LoadingState = "idle" | "loading" | "success" | "error"

export default function SolsticeSkyViewer() {
  const [location, setLocation] = useState("")
  const [state, setState] = useState<LoadingState>("idle")
  const [data, setData] = useState<SkyObjectsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!location.trim()) {
      setError("Please enter a location")
      setState("error")
      return
    }

    setState("loading")
    setError(null)
    setData(null)

    try {
      const response = await fetch(
        `/api/sky-objects?location=${encodeURIComponent(location.trim())}`
      )

      if (!response.ok) {
        const errorData: SkyObjectsErrorResponse = await response.json()
        setError(errorData.error.message)
        setState("error")
        return
      }

      const successData: SkyObjectsResponse = await response.json()
      setData(successData)
      setState("success")
    } catch (err) {
      setError("Failed to fetch sky objects. Please try again: " + err)
      setState("error")
    }
  }

  const getVisibilityColor = (visibility: SkyObject["visibility"]) => {
    switch (visibility) {
      case "good":
        return "text-green-400"
      case "ok":
        return "text-yellow-400"
      case "poor":
        return "text-red-400"
      default:
        return "text-gray-400"
    }
  }

  const getTypeLabel = (type: SkyObject["type"]) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  return (
    // <div class="background-container">
    <div className="background-container min-h-screen relative overflow-hidden night-sky">
      {/* Starfield background */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/moon.png" alt="moon" />
      <div className="stars"></div>
      <div className="twinkling"></div>
      <div className="clouds"></div>
      {/* <div className="absolute inset-0 starfield" /> */}
      {/* Main content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="rounded-2xl bg-gray-900/90 backdrop-blur-sm border border-gray-800 p-8 shadow-2xl">
            <h1 className="text-4xl font-bold text-white mb-2 text-center">
              Solstice Sky Viewer
            </h1>
            <p className="text-gray-300 text-center mb-8">
              See a few bright objects visible in tonight&apos;s sky.
            </p>

            <form onSubmit={handleSubmit} className="mb-6">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Enter city, state, zipcode, or country"
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={state === "loading"}
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {state === "loading" ? "Loading..." : "View sky"}
                </button>
              </div>
            </form>

            {/* Loading state */}
            {state === "loading" && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="text-gray-400 mt-4">Looking up the sky...</p>
              </div>
            )}

            {/* Error state */}
            {state === "error" && error && (
              <div className="rounded-lg bg-red-900/30 border border-red-800 p-4 text-red-200">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Success state */}
            {state === "success" && data && (
              <div className="space-y-4">
                <div className="text-sm text-gray-400 mb-4">
                  <p>
                    Location:{" "}
                    <span className="text-white">
                      {data.location.resolvedName}
                    </span>
                  </p>
                  <p>
                    Date: <span className="text-white">{data.date}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  {data.objects.map(obj => (
                    <div
                      key={obj.id}
                      className="rounded-lg bg-gray-800/50 border border-gray-700 p-4 hover:bg-gray-800/70 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {obj.name}
                        </h3>
                        <div className="flex gap-2">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300">
                            {getTypeLabel(obj.type)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getVisibilityColor(
                              obj.visibility
                            )} bg-gray-700/50`}
                          >
                            {obj.visibility.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">{obj.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credit line */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-20">
        <p className="text-xs text-gray-500/60 text-center">
          Background styling by{" "}
          <a
            href="https://codepen.io/agoodwin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400/80 hover:text-gray-300 underline"
          >
            agoodwin
          </a>
        </p>
      </div>
    </div>
  )
}
