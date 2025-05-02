# RoofM² - Roof Area and Solar/Water Potential Calculator

## Project Overview

A browser-only workflow that allows users to enter an address and get roof area measurements, solar energy estimates, and rainwater harvest predictions without requiring login or payment.

### Support
If this tool saved you time, consider [buying me a coffee](https://www.buymeacoffee.com/cropper) to keep the APIs and hosting running. Thanks! ☕

## Features

- Address to roof area conversion using satellite imagery and computer vision
- Solar energy potential calculations based on NASA POWER climatology data
- Rainwater harvesting potential based on local precipitation patterns
- Downloadable PDF reports with monthly breakdowns
- No login or payment required - completely free service

## Technology Stack

- **Frontend**: Next.js (React 18) deployed on Vercel
- **Backend**: FastAPI (Python 3.12) deployed on Render
- **Data Sources**:
  - Google Maps Static API (satellite imagery)
  - Google Geocoding API (address to lat/lon)
  - NASA POWER API (solar radiation and precipitation)
- **Computer Vision**: OpenCV for roof area detection
- **Reporting**: Client-side PDF generation with pdf-lib

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- Google Maps API key (Static Maps and Geocoding APIs)

### Environment Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/roofm2.git
   cd roofm2
   ```

2. Frontend setup:
   ```
   cd frontend
   npm install
   cp .env.example .env.local
   # Edit .env.local to add your Google Maps API key
   ```

3. Backend setup:
   ```
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env to add your API keys
   ```

### Running Locally

1. Start the backend:
   ```
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   uvicorn main:app --reload
   ```

2. Start the frontend (in a separate terminal):
   ```
   cd frontend
   npm run dev
   ```

3. Open your browser to http://localhost:3000

## Deployment

- Frontend: Automatically deployed to Vercel via Git integration
- Backend: Deployed to Render via Render Blueprint

## Example

For a quick demo, try entering the coordinates for Downtown LA: 34.0522 N, -118.2437 W.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
