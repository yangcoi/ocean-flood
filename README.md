# Ocean Flood: Urban Flood Monitoring & Route Avoidance Prototype

A web-based geospatial prototype designed to explore real-time urban flood risk estimation and dynamic route avoidance for Ho Chi Minh City.

---

## 1. Project Status & Current Maturity Level

**Current Status:** Early Engineering Prototype / Proof of Concept (Work in Progress - Incomplete).

This repository is an exploratory technical prototype created to test spatial visualization and heuristic risk scoring. It is not a finished or production-ready system.

### What is implemented:
- Interactive map interface built with Next.js 14, MapLibre GL JS, and CARTO raster/vector base tiles.
- Basic risk estimation algorithm combining external rainfall data (Open-Meteo API) with astronomical harmonic tide formulas for Phu An and Nha Be stations.
- Prototype avoidance routing calculation logic using GeoJSON coordinate buffers.
- Mobile-first responsive UI components for mobile and desktop screens.

### Current limitations & Unfinished scope:
- Traffic camera feeds are mocked: Municipal live camera streams are not publicly accessible via public APIs.
- Community report submission is mock-only: Submissions run in local state without a persistent production database or verification backend.
- Hydrology model is an approximation heuristic: The system uses basic empirical thresholds, not calibrated 2D hydraulic/hydrodynamic fluid simulations.
- Offline PWA service worker caching and push notifications are partially implemented.

---

## 2. Architecture Overview

```
+-------------------------------------------------------------+
|                 NEXT.JS 14 FRONTEND CLIENT                  |
|  - MapLibre GL Canvas (CARTO basemap, flood polygons)       |
|  - Route Planning Drawer (Safe vs flooded route viewer)     |
|  - Mock Report Submission Modal                             |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                    NEXT.JS API ROUTES                       |
|  - /api/alerts: GeoJSON feature collection (mock + seed)    |
|  - /api/route-plan: Distance and waypoint computation       |
|  - /api/reports: Local state handler                        |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     EXTERNAL SERVICES                       |
|  - Open-Meteo API (Precipitation data)                      |
|  - Static Astronomical Tide Harmonics Table                 |
+-------------------------------------------------------------+
```

---

## 3. Tech Stack

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS
- Mapping: MapLibre GL JS, GeoJSON
- Weather Ingestion: Open-Meteo REST API

---

## 4. Setup & Running Locally

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/yangcoi/ocean-flood.git
cd ocean-flood
npm install
npm run dev
```

Open http://localhost:3000 in your browser to inspect the prototype.

---

## License

This project is released under the MIT License.
