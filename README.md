# Safe Mile 🛣️

**Every mile, a little safer.**

Safe Mile is a mobile-first web app that helps people quickly find the correct emergency contact numbers during accidents or medical emergencies on Indian highways, and uses AI to turn a plain-language description of an emergency into the right number to call, immediate action steps, and a shareable emergency message.

**Live demo:** [Add your deployed Vercel link here]
**Theme:** Crisis Management, HealthTech & Emergency Response — Idea2Impact Online Hackathon 2026

---

## The Problem

During road accidents and medical emergencies on Indian highways, victims and bystanders often lose critical time because they don't know which helpline to call or what to do first. Verified systems like **1033** (National Highway Helpline) and **112** (pan-India emergency number) exist, but there's no simple, panic-friendly tool that instantly connects a person's situation to the right response channel and clear first-response guidance.

## The Solution

Safe Mile gives users three ways to get help fast:

1. **Search** by highway, state, or district (with typo-tolerant fuzzy matching and autocomplete) to instantly see the right control room number.
2. **Describe the emergency in plain language** to an AI assistant, which classifies the situation (fire, medical, accident, breakdown, crime) using a **rule-based safety net**, confirms the correct number to call, and uses Gemini to generate immediate action steps and a ready-to-share emergency message.
3. **Auto-detect location** (GPS + reverse geocoding) to surface relevant State and District emergency numbers, with manual selection as a fallback.

### Why hybrid AI, not just an LLM wrapper
The number the user is told to call is **always decided by verified rule-based logic**, never by the AI's free-text guess. Gemini's role is limited to understanding the situation and generating helpful guidance/messaging — this keeps the safety-critical part of the app reliable even if the AI call fails, times out, or is rate-limited. If the AI call fails, the user still gets the correct number immediately, with no missing information.

---

## Features

- 🔍 Typo-tolerant fuzzy search across highways, states, districts, and service names
- 🤖 AI Emergency Assistant (Gemini API) with automatic retry on transient failures
- 📍 Live location detection (Geolocation + OpenStreetMap Nominatim reverse geocoding), with manual State/District fallback
- 🗂️ National → State → District emergency number hierarchy, with transparent fallback labeling where state/district-specific data isn't available
- 🗺️ Map view of sample highway contact locations (Leaflet.js)
- 🎤 Voice input for the AI assistant (Web Speech API)
- 📤 Share Live Location (Geolocation + Google Maps link + copy-to-share message)
- 🌗 Dark mode
- 📋 Copy/Share buttons on every contact card

---

## Tech Stack

- **Frontend:** Plain HTML, CSS, JavaScript (no framework — chosen for simplicity, fast load, and easy deployment)
- **Backend:** Vercel Serverless Function (Node.js) — keeps the Gemini API key secure server-side
- **AI:** Google Gemini API (`gemini-flash-latest`)
- **Maps:** Leaflet.js + OpenStreetMap tiles
- **Geocoding:** OpenStreetMap Nominatim (free, no API key)
- **Hosting:** Vercel

---

## Project Structure

```
safe-mile/
├── index.html          # Main page
├── style.css            # All styling
├── script.js             # Search, AI assistant, location, map logic
├── data/
│   └── contacts.json     # Sample emergency contacts dataset
├── api/
│   └── assistant.js      # Serverless function - calls Gemini API
└── README.md
```

---

## Running Locally

1. Clone the repo:
   ```
   git clone https://github.com/YOUR_USERNAME/safe-mile.git
   cd safe-mile
   ```
2. Install the Vercel CLI (if you don't have it):
   ```
   npm install -g vercel
   ```
3. Create a `.env` file in the project root:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Run locally:
   ```
   vercel dev
   ```
5. Open `http://localhost:3000`

---

## Data Note

Emergency contact numbers beyond the verified national numbers (112, 100, 101, 102, 108, etc.) are **sample data for demonstration purposes**. Where state- or district-specific numbers aren't available in this dataset, the app transparently falls back to the corresponding national number rather than displaying unverified or fabricated data.

## Roadmap

- Real-time nearby services (police stations, hospitals, blood banks) via a Places API integration
- Verified state/district-level emergency contact database
- Multi-language support (Hindi/English)

---

## Built By

An individual submission for the Idea2Impact Online Hackathon 2026 (NxtWave Academy).