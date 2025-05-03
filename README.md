# Roofm² Estimator

Roofm² Estimator is a full-stack web application to help homeowners and installers estimate the square footage of their roof and fetch climatological data (solar radiation & precipitation) to calculate potential solar energy production and rainwater harvesting volumes.

## Key Features

• Interactive Google Maps satellite view with a polygon drawing tool for outlining your roof
• Live area calculation in metric (m²) or imperial (ft²) units based on drawn outline
• Automatic fetch of NASA POWER climatology data (monthly solar & rainfall) for your location
• Dual-axis charts showing monthly solar radiation and precipitation climatologies
• Adjusted charts projecting monthly energy (kW/day) and water (L/day) potential based on your roof area
• Download a styled PDF report including your roof outline, climate charts, and summary

## Tech Stack

- **Next.js** (App Router, React + TypeScript)
- **Google Maps JavaScript API** + Drawing Library
- **turf.js** for geospatial area calculations
- **NASA POWER API** for climatology data
- **Chart.js** & `react-chartjs-2` for interactive charts
- **jsPDF** + `html2canvas` for PDF generation
- **Tailwind CSS** for styling

## Prerequisites

- Node.js v18+ and npm/yarn
- A Google Maps API Key (with Maps JavaScript API & Places enabled)
- (Optional) NASA POWER API configuration — no key required for public endpoints

## Environment Variables

Create a `.env.local` file in the project root (this file is git-ignored) with the following:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_KEY
CLIMATE_API_URL=https://power.larc.nasa.gov/api/temporal/climatology/point
# If your climatology provider requires a key:
# CLIMATE_API_KEY=YOUR_CLIMATE_API_KEY
```

Never commit your `.env.local` — keep API keys secure.

## Setup & Development

```bash
git clone https://github.com/your-username/roofm2.git
cd roofm2
npm install
# or yarn install
npm run dev
```

Open `http://localhost:3000` in your browser to start drawing and analyzing your roof.

## Deployment

This application is optimized for deployment on Vercel:

1. Push your code to GitHub (private or public repository).
2. In the Vercel dashboard, import the repository.
3. Add the same environment variables in Vercel's Project Settings.
4. Trigger a deployment by pushing to `main` (or your selected branch).
5. Vercel will build and publish your site at `https://your-project.vercel.app`.

## Security & Best Practices

- API keys are never checked into source control.
- `.env.local` is git-ignored (see `.gitignore`).
- Audit dependencies and keep packages up to date.
- Use HTTPS and environment variables for all secrets.

## License & Contributions

This project is open-source under the MIT License. Contributions and feedback are welcome via pull requests on GitHub.

## Support the Project
If you enjoy using Roofm² Estimator, consider buying me a coffee to keep development going! ☕️

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://buymeacoffee.com/cropper)
