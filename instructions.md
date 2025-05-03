 # Roof Area & Climatological Data Estimator — Instructions

## Overview

This project is a full-stack web application to help users estimate the square footage of their roof and retrieve climatological data (solar radiation and precipitation) to calculate potential solar capacity and rainwater harvesting.

## Tech Stack

- **Frontend**: Next.js + React + TypeScript
- **Mapping**: Google Maps JavaScript API + Drawing Library (or alternative)
- **Geospatial Calculations**: turf.js for polygon area calculations and unit conversions
- **Data Fetching**: NASA POWER API (or alternative) for climatology monthly means
- **PDF Generation**: jsPDF (or pdfmake) for report creation
- **Styling**: CSS Modules, Tailwind CSS, or styled-components
- **Backend**: Next.js API routes (serverless functions)
- **Deployment**: GitHub → Vercel
- **Version Control**: Git

## Prerequisites

- Node.js >= 14.x and npm/yarn
- A Google Maps API Key with Maps JavaScript API & Drawing Library enabled
- (Optional) API key or account for the chosen climatology data provider
- Git and GitHub account
- Vercel account for deployment

## Setup & Installation

1. Clone the repository
   ```bash
   git clone https://github.com/<your-username>/<repo-name>.git
   cd <repo-name>
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root with the following variables:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
   CLIMATE_API_PROVIDER=NASA_POWER
   CLIMATE_API_URL=https://power.larc.nasa.gov/api/temporal/climatology/point
   # If your chosen API requires a key:
   # CLIMATE_API_KEY=YOUR_API_KEY
   ```
4. Start the development server
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser

## Folder Structure

```
/components
  └── Map.tsx
  └── DrawingTool.tsx
  └── ReportDownload.tsx
/pages
  ├── index.tsx
  ├── api
      └── climate.ts
/utils
  └── area.ts
  └── unitConversion.ts
  └── apiClients.ts
/public
  └── favicon.ico
  └── (static assets)
```

## Core Features Implementation

### 1. Address Input & Map Initialization

- On `pages/index.tsx`, create an address search input (e.g., using Google Places Autocomplete).
- After address selection, center the Google Map on the coordinates.
- Lazy-load `@react-google-maps/api`.

### 2. Polygon Drawing & Area Calculation

- Use the Google Maps Drawing Library:
  ```tsx
  import { DrawingManager } from '@react-google-maps/api';
  ```
- Capture the drawn polygon coordinates.
- In `/utils/area.ts`, use `turf.area()` to compute square meters, then convert to sqft using `unitConversion.ts`.

### 3. Climatological Data Fetching

- Implement `/pages/api/climate.ts`:
  - Parse query parameters: `lat`, `lng`
  - Fetch monthly mean data from `process.env.CLIMATE_API_URL` (NASA POWER) or other.
  - Return JSON containing arrays of 12 values for solar radiation (W/m²) and precipitation (mm or flux).

### 4. Report Generation & PDF Download

- Create `components/ReportDownload.tsx`:
  - Display summary of area and climate data.
  - Use `jsPDF` to generate a styled PDF:
    ```ts
    const doc = new jsPDF();
    doc.text('Roof Area Report', 10, 10);
    // Add tables or charts
    doc.save('roof-estimate.pdf');
    ```
- Provide unit toggle between metric and imperial.

## Deployment

1. Push your code to GitHub.
2. Connect the repository on Vercel.
3. In Vercel settings, add environment variables from `.env.local`.
4. Deploy the `main` branch; Vercel will auto-build and publish.

## Timeline & Milestones

- Day 1: Project setup, map integration, address search
- Day 2: Drawing tool, area calculations, unit conversions
- Day 3: Climatology API client, serverless endpoint
- Day 4: PDF generation, UI polishing
- Day 5: Testing & bug fixes
- Day 6: Documentation, cleanup, final review
- Day 7: Deploy to Vercel, share

## Follow-Up

- Confirm preferred climatological data provider (e.g., NASA POWER vs NREL NSRDB).
- Decide on styling approach (Tailwind CSS, plain CSS, etc.).
- Confirm if any additional features are required.

## Task #8: Final QA and Deployment

1. Final QA Checklist:
   - Verify address autocomplete works for various addresses and scenarios.
   - Test polygon drawing for accuracy and area calculation with complex shapes.
   - Validate unit toggle between metric and imperial.
   - Confirm climatological data fetch succeeds and month values map correctly.
   - Ensure chart rendering and PDF generation function across major browsers and devices.

2. Deployment Steps:
   - Push commits to `main` and confirm GitHub integration with Vercel.
   - Add necessary environment variables on Vercel (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, CLIMATE_API_URL, etc.).
   - Deploy the `main` branch to production and verify the live site.

3. Post-Deployment Monitoring:
   - Monitor application logs for errors.
   - Perform smoke tests on the production environment.
   - Gather initial user feedback and address critical issues.

---

This file is intended for the Cursor CI environment to automate scaffolding, testing, and deployment. Follow each step in sequence to get the project up and running quickly.