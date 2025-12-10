"use client"

import { useState } from "react"

interface StellaProps {
  onClick?: () => void
}

/**
 * Stella - A friendly star guide with a smiley face
 * Only appears after the user successfully fetches sky objects
 */
export default function Stella({ onClick }: StellaProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="fixed top-7 left-4 z-30 cursor-pointer transition-transform hover:scale-110"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label="Stella - Your friendly sky guide"
    >
      <div className="relative">
        {/* Star shape */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          className={`w-20 h-20 sm:w-[120px] sm:h-[120px] transition-all duration-300 ${
            isHovered
              ? "drop-shadow-[0_0_20px_rgba(244,208,63,0.6)]"
              : "drop-shadow-[0_0_10px_rgba(244,208,63,0.4)]"
          }`}
        >
          {/* Star points - less pointy, more rounded */}
          <path
            d="M50 8 L58 32 L82 32 L64 48 L72 72 L50 58 L28 72 L36 48 L18 32 L42 32 Z"
            fill="#F4D03F"
            stroke="#E8B84F"
            strokeWidth="1.5"
            className="transition-all duration-300"
            style={{
              filter: isHovered ? "brightness(1.15)" : "brightness(1)",
            }}
          />

          {/* Smiley face - centered within the star */}
          {/* Left eye */}
          <circle
            cx="42"
            cy="40"
            r="3.5"
            fill="#000"
            className="transition-all duration-300"
          />

          {/* Right eye */}
          <circle
            cx="58"
            cy="40"
            r="3.5"
            fill="#000"
            className="transition-all duration-300"
          />

          {/* Smile */}
          <path
            d="M 38 52 Q 53 62 62 49"
            stroke="#000"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 w-1 h-1 bg-yellow-200 rounded-full animate-ping" />
          <div
            className="absolute top-1/4 left-0 w-1 h-1 bg-yellow-200 rounded-full animate-ping"
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className="absolute top-1/4 right-0 w-1 h-1 bg-yellow-200 rounded-full animate-ping"
            style={{ animationDelay: "0.4s" }}
          />
          <div
            className="absolute bottom-1/5 left-1/6 w-1 h-1 bg-yellow-200 rounded-full animate-ping"
            style={{ animationDelay: "0.6s" }}
          />
          <div
            className="absolute bottom-1/6 right-1/5 w-1 h-1 bg-yellow-200 rounded-full animate-ping"
            style={{ animationDelay: "0.8s" }}
          />
        </div>
      </div>

      {/* Tooltip */}
      <div
        className={`absolute top-full right-0 left-2 px-2 py-2 rounded-lg bg-gray-900/90 backdrop-blur-sm border border-gray-700 text-white text-sm whitespace-nowrap transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        Hi! I&apos;m Stella 🌟
      </div>
    </div>
  )
}
