# Solstice Sky Viewer

A stargazing web application that helps you discover what's visible in the night
sky. Enter your location to see a personalized list of celestial objects
(planets, stars, constellations, the Sun, and Moon) visible tonight, complete
with rise/set times and visibility information. Chat with Stella, your friendly
and whimsical AI stargazing guide, to learn more about the objects, fun
celestial facts, and get tips for finding them in the sky.

## Features

- **Location-based sky object discovery**: Enter any location to see what's
  visible in the night sky
- **Real-time astronomical data**: Fetches data from USNO (U.S. Naval
  Observatory) APIs for accurate sun, moon, and celestial object information
- **Interactive AI guide**: Chat with Stella, an AI assistant that explains sky
  objects in beginner-friendly language
- **Winter solstice countdown**: Track the countdown to the next winter solstice
- **Visibility indicators**: See which objects have good, ok, or poor visibility
  based on altitude and time

## Prerequisites

- **Node.js** 18.x or later
- **npm** (comes with Node.js) or **yarn** or **pnpm** or **bun**

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd solstice-sky-viewer
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   - Create a `.env.local` file in the root directory
   - Add the following environment variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### Getting API Keys

- **OpenAI API Key**: Required for Stella chat functionality

  - Sign up at [OpenAI](https://platform.openai.com/) and create an API key
  - The app uses `gpt-4o-mini` model

## Running the Project

### Development Mode

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the
application.

The page will auto-reload when you make changes to the code.

### Production Build

Build the project for production:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm test` - Run tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:run` - Run tests once (no watch mode)

## Dependencies

### Runtime Dependencies

- **next** (16.0.7) - React framework for production
- **react** (19.2.0) - UI library
- **react-dom** (19.2.0) - React DOM renderer

### Development Dependencies

- **typescript** (^5) - TypeScript compiler
- **tailwindcss** (^4) - Utility-first CSS framework
- **@tailwindcss/postcss** (^4) - PostCSS plugin for Tailwind
- **vitest** (^4.0.15) - Testing framework
- **@vitest/ui** (^4.0.15) - Vitest UI interface
- **eslint** (^9) - Linter for JavaScript/TypeScript
- **eslint-config-next** (16.0.7) - ESLint config for Next.js
- **@types/node** (^20) - TypeScript types for Node.js
- **@types/react** (^19) - TypeScript types for React
- **@types/react-dom** (^19) - TypeScript types for React DOM

## Project Structure

```
solstice-sky-viewer/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes
│   │   │   ├── sky-objects/   # Sky objects API endpoint
│   │   │   └── stella-chat/   # Stella chat API endpoint
│   │   ├── page.tsx           # Main page component
│   │   └── layout.tsx         # Root layout
│   ├── components/             # React components
│   │   ├── Stella.tsx         # Stella AI chat component
│   │   └── StellaChatWindow.tsx # Chat window UI
│   └── lib/                   # Utility libraries
│       ├── astronomy/         # Astronomy-related utilities
│       └── stella/            # Stella AI integration
├── types/                      # TypeScript type definitions
├── tests/                      # Test files
└── spec/                       # API specifications
```

## External APIs Used

- **USNO RSTT API**: For sun and moon rise/set times
- **USNO CelNav API**: For celestial navigation data (planets, stars,
  constellations)
- **OpenAI API**: For Stella AI chat functionality
- **Open-Meteo**: Geocodes a location query to latitude/longitude

## License

This project is private and not licensed for public use.
