## 0  Project Summary

* **Goal**: Browser‑only workflow where a visitor enters an address ➜ gets roof area (m² / ft²), annual & monthly solar energy (kWh) assuming no shade, annual rainwater harvest (L / gal), and can download a PDF or CSV report—no login, no payment.
* **Frontend**: **Next.js (React 18) on Vercel** – zero‑config/static fallback ([Vercel][1]).
* **Backend**: **FastAPI (Python 3.12) on Render Free Web Service** ([Render][2]).
* **Data & CV**

  * Satellite image ➜ Google Maps **Static API** for 640×640 PNG tile (or 1280 HD if quota allows) ([Google for Developers][3]).
  * Address → lat/lon ➜ Google **Geocoding API** ([Google for Developers][4]).
  * Solar & rainfall climatology ➜ **NASA POWER** Monthly/Climatology micro‑service with parameters: `ALLSKY_SFC_SW_DWN` (kWh m‑2 day‑1) & `PRECTOT` (mm day‑1) ([NASA POWER][5], [NASA POWER][6]).
  * Vision ➜ **OpenCV** edge + contour detection; convert pixels→m via Google imagery scale; compute polygon area ([Stack Overflow][7]).
* **Report**: Front‑end generates client‑side PDFs with **pdf‑lib** ([PDF-LIB][8]) or calls backend `/pdf` which streams ReportLab PDF (server) ([reportlab.com][9]).
* **Licensing/Cost**: All chosen tiers are free (Vercel Hobby ([Vercel][10]), Render free, Google Maps \$200/mo credit, NASA POWER open).

---

## 1  Repository & Folder Layout

```text
root/
├─ frontend/               # Next.js app
│  ├─ pages/
│  │   └─ index.tsx        # Main UI
│  ├─ lib/
│  │   ├─ geocode.ts       # fetch lat/lon
│  │   ├─ fetchPower.ts    # solar & rain
│  │   └─ pdf.ts           # pdf‑lib helpers
│  └─ public/              # static assets
└─ backend/                # FastAPI app
   ├─ main.py              # API router
   ├─ cv/                  # OpenCV utils
   ├─ requirements.txt
   └─ Dockerfile
```

Cursor task: bootstrap two workspaces, each with its own `.env.example` (see §3).

---

## 2  Milestone Roadmap

### M0 Bootstrap

| Task                  | Details                                                                                                     |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Init git monorepo** | two folders above; add `.tool-versions`, Prettier + black; set up Husky lint hooks.                         |
| **CI/CD**             | Vercel Git integration (frontend) ([Vercel][11]); Render “Blueprint” auto‑deploy for backend ([Render][2]). |

### M1 Geocode & Imagery

1. Next.js form → `/api/coords?address=…` proxy to backend.
2. Backend calls Geocoding API `https://maps.googleapis.com/maps/api/geocode/json?address={addr}&key=$GEOKEY` ([Google for Developers][12]).
3. Return `lat,lon,formatted_address`.
4. Fetch satellite tile via Static API `https://maps.googleapis.com/maps/api/staticmap?center={lat},{lon}&zoom=20&size=640x640&maptype=satellite&key=$MAPKEY` ([Google for Developers][3]).

### M2 Roof‑Area Vision

1. Convert tile to grayscale, Canny edges, `cv2.findContours` largest + convex hull.
2. Compute pixel‑area; scale: `meters_per_pixel = 156543.03392 * cos(lat) / 2^zoom` (Google formula, cite docs).
3. Expose `/area?lat&lon&zoom=20` returns `{area_m2, area_ft2}` (1 m² = 10.7639 ft²).
4. Optional user polygon edit on canvas.

### M3 Climate Fetch

1. NASA POWER endpoint example:

   ```
   https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,PRECTOT&community=SB&longitude={lon}&latitude={lat}&format=JSON
   ```

   returns 12‑month averages  ([NASA POWER][13], [NASA POWER][14]).
2. Convert:

   * **Solar kWh/year** = Σ(month kWh m‑2 day‑1 × days\_in\_month) × roof m².
   * **Water L/year** = Σ(month mm day‑1 × 0.9 runoff × days) × roof m².
   * Liters → gallons × 0.264172.
3. Provide per‑month arrays for display.

### M4 Report Generation

* `pdf.ts` builds a 2‑page PDF with tables & mini chart (pdf‑lib supports embed images) ([PDF-LIB][8]).
* Backend fallback `/pdf` uses ReportLab canvas for heavier jobs ([reportlab.com][9]).
* CSV via `json2csv` util.

### M5 UI Polish

* Timeline wizard (Step 1 Address → Step 2 Preview & Adjust Roof → Step 3 Results → Step 4 Download).
* Responsive Tailwind UI.
* Accessibility & PWA manifest.

### M6 Testing & Launch

* Jest + React Testing Library for UI.
* Pytest for backend.
* Lighthouse check (performance ≥ 90).
* Deploy `production` branches; verify Vercel edge caching.

---

## 3  Environment Variables (.env.example)

```bash
# shared
NEXT_PUBLIC_POWER_BASE=https://power.larc.nasa.gov/api
NEXT_PUBLIC_RUNOFF_COEFF=0.9

# frontend only
NEXT_PUBLIC_STATIC_MAP_KEY=YOUR_GOOGLE_MAPS_KEY

# backend only
GEOCODING_KEY=YOUR_GEOCODING_KEY
STATIC_MAP_KEY=YOUR_GOOGLE_MAPS_KEY
POWER_CACHE_MINUTES=43200   # 30 days
```

Secrets stored in Vercel & Render project settings; never committed.

---

## 4  Key Implementation Notes & Links

1. **Next.js routing**—API routes run on Vercel serverless (`/api/**`) but heavy CV happens on Render to avoid 10‑sec Hobby limit ([Vercel][11]).
2. **NASA POWER** returns data in JSON, CSV, netCDF; set `format=JSON` for simplicity ([NASA POWER][5]).
3. **Solar parameter**: `ALLSKY_SFC_SW_DWN` = all‑sky short‑wave irradiance on horizontal surface (kWh m‑2 day‑1) ([NASA POWER][6]).
4. **Rainfall parameter**: `PRECTOT` = precipitation at surface (mm day‑1) ([NASA POWER][15]).
5. **LA baseline rainfall** example (14.25 in = 361.95 mm) for default demo ([Los Angeles Times][16]).
6. **No‑shade assumption**—document in PDF disclaimer.
7. **Contour area**—`cv2.contourArea` sorted helper per StackOverflow ([Stack Overflow][7]).
8. **PDF size**: keep under 1 MB to fit Vercel 4.5 MB function response limit.
9. **Monthly computations**—Cursor agents can import `calendar.monthrange(year, m)[1]`.
10. **Optional Solar API**—Google Maps Solar API gives roof polygons + irradiance but is billed; NASA path keeps service truly free ([Google for Developers][17]).

---

## 5  Suggested Cursor Tasks

1. **Scaffold Next.js & Tailwind** (`pnpm create next-app`)
2. **Implement `/api/coords` proxy + geocoding fetch**
3. **Build OpenCV service in backend/main.py**
4. **Write `fetchPower.ts` util with unit tests**
5. **Compose PDF with pdf‑lib; snapshot test size < 1 MB**
6. **Integrate stepper UI & results page**
7. **Add GitHub Actions lint/test; Vercel + Render deploy hooks**
8. **Produce `README.md` with local dev instructions**
9. **Generate example report for 34.0522 N, ‑118.2437 W (Downtown LA)**
10. **Open source license (MIT)**.

---

## 6  Further References

* Vercel Hobby limits & cold‑start guidance ([Vercel][10])
* Next.js deployment guide ([Next.js by Vercel - The React Framework][18])
* Render FastAPI template ([Render][2])
* NASA POWER API overview & temporal endpoints ([NASA POWER][13], [NASA POWER][19])
* LA climate normals (Latimes quoting NWS) ([Los Angeles Times][20])

---

### Hand‑off Note

All citations are inline so Cursor can open docs in the sidebar.
Ask agents to **prioritize CORS, quota‑handling, and graceful API‑failover** (cached POWER climatology) before moving to UI polish. Good luck!

[1]: https://vercel.com/docs/frameworks/nextjs?utm_source=chatgpt.com "Next.js on Vercel"
[2]: https://render.com/docs/deploy-fastapi?utm_source=chatgpt.com "Deploy a FastAPI App – Render Docs"
[3]: https://developers.google.com/maps/documentation/maps-static/start?utm_source=chatgpt.com "Get Started | Maps Static API - Google for Developers"
[4]: https://developers.google.com/maps/documentation/geocoding/overview?utm_source=chatgpt.com "Geocoding API overview - Google for Developers"
[5]: https://power.larc.nasa.gov/docs/services/api/temporal/daily/?utm_source=chatgpt.com "Data Services | Daily API - NASA POWER | Docs"
[6]: https://power.larc.nasa.gov/docs/faqs/solar/?utm_source=chatgpt.com "Solar Insolation - NASA POWER"
[7]: https://stackoverflow.com/questions/32669415/opencv-ordering-a-contours-by-area-python?utm_source=chatgpt.com "OpenCV: Ordering a contours by area (Python) - Stack Overflow"
[8]: https://pdf-lib.js.org/?utm_source=chatgpt.com "PDF-LIB · Create and modify PDF documents in any JavaScript ..."
[9]: https://www.reportlab.com/docs/reportlab-userguide.pdf?utm_source=chatgpt.com "[PDF] ReportLab PDF Library User Guide"
[10]: https://vercel.com/docs/plans/hobby?utm_source=chatgpt.com "Vercel Hobby Plan"
[11]: https://vercel.com/docs/limits?utm_source=chatgpt.com "Limits - Vercel"
[12]: https://developers.google.com/maps/documentation/geocoding/requests-geocoding?utm_source=chatgpt.com "Geocoding request and response - Google for Developers"
[13]: https://power.larc.nasa.gov/docs/services/api/?utm_source=chatgpt.com "Data Services | API Overview - NASA POWER | Docs"
[14]: https://power.larc.nasa.gov/docs/tutorials/parameters/?utm_source=chatgpt.com "Parameters - NASA POWER | Docs"
[15]: https://power.larc.nasa.gov/?utm_source=chatgpt.com "NASA POWER | Prediction Of Worldwide Energy Resources"
[16]: https://www.latimes.com/california/story/2024-04-01/another-wet-winter-set-record-water-year-second-in-history?utm_source=chatgpt.com "Back-to-back wet years in Los Angeles set a rainfall record"
[17]: https://developers.google.com/maps/documentation/solar/release-notes?utm_source=chatgpt.com "Solar API release notes - Google for Developers"
[18]: https://nextjs.org/docs/app/getting-started/deploying?utm_source=chatgpt.com "Getting Started: Deploying - Next.js"
[19]: https://power.larc.nasa.gov/docs/services/api/temporal/hourly/?utm_source=chatgpt.com "Data Services | Hourly API - NASA POWER | Docs"
[20]: https://www.latimes.com/california/story/2024-02-26/could-los-angeles-break-an-all-time-record-for-rainiest-february?utm_source=chatgpt.com "Has this been L.A.'s wettest February ever? - Los Angeles Times"
