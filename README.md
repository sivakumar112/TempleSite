# Sacred Places Hub

A **multilingual, AI-powered, multi-faith web platform** for pilgrims to access structured information about sacred places — **temples, mosques, churches, gurudwaras, Buddhist monasteries & Jain temples** — their timings, rituals, history, dress codes, and visitor guidelines. Built with **HTML, CSS, JavaScript** (frontend) and **Node.js/Express** (backend), powered by **Groq LLM (Llama 3.3 70B)** and multiple open-source APIs.

## Religions Supported

| Religion | Places | Icons |
|----------|--------|-------|
| **Hindu** | Temples, Mandirs | Om symbol |
| **Islam** | Mosques, Masjids, Dargahs | Mosque |
| **Christian** | Churches, Cathedrals, Basilicas | Church |
| **Sikh** | Gurudwaras | Khanda |
| **Buddhist** | Monasteries, Viharas, Pagodas | Dharmachakra |
| **Jain** | Derasars, Jain Temples | Heart |

## Features (20+)

### Core Features
- **Multi-faith support**: Covers 6 religions — Hindu, Islam, Christian, Sikh, Buddhist, Jain
- **Multilingual support**: Google Translate widget — 11 Indian languages
- **Sacred places database**: Hardcoded database of major Indian sacred places across all religions
- **Search**: Search by **name**, **location**, **deity**, or **religion** — with LLM fallback
- **Voice Search**: Browser-native speech recognition for hands-free search
- **Dark/Light Theme**: Toggle between dark and light modes with localStorage persistence

### AI-Powered Features (Groq LLM)
- **AI Pilgrim Guide**: Chat with Groq LLM for temple recommendations, ritual explanations, and pilgrimage tips
- **AI Smart Recommendations**: Select region, deity, and season for personalized suggestions
- **AI Pilgrimage Planner**: Generate detailed multi-day itineraries with darshan timings, meals, local phrases, do's/don'ts, weather, and budget breakdown
- **Interactive Trip Planner**: Conversational agent that asks preferences step-by-step and creates a personalized trip plan
- **Prayer & Wish Guide**: Tell your prayer/wish and get recommended temples, rituals, mantras, offerings, and fasting advice
- **Temple Story Narrator**: Get the mythological/historical story behind any temple with characters, scripture sources, and moral lessons
- **Temple Comparison**: Compare any two temples side-by-side using AI analysis
- **Nearby Essentials**: AI-generated food, stay, transport, and shopping recommendations near any temple
- **Aarti / Bhajan Lyrics**: Get the famous aarti/bhajan for any temple with lyrics, transliteration, and meaning
- **Daily Spiritual Horoscope**: Rashi-based daily prediction with lucky temple, deity, color, number, and mantra
- **Temple Knowledge Quiz**: Interactive 5-question quiz with difficulty levels, explanations, and scoring
- **Temple of the Day**: Daily featured temple with fun facts
- **Mantra of the Day**: Daily Sanskrit mantra with transliteration and meaning
- **Panchang**: Today's Hindu calendar with tithi, nakshatra, yoga, and muhurat
- **Did You Know**: Random fascinating facts about Hindu temples
- **Real-time Spiritual Alerts**: Scrolling ticker with festival alerts, auspicious timings, and spiritual messages

### Map & Exploration
- **Interactive Temple Map**: Leaflet.js + OpenStreetMap tiles with 20 famous temples plotted with GPS coordinates, images, and filter by type (Jyotirlinga, Shakti Peetha, Char Dham, Famous)
- **Explore City**: Discover Hindu temples in any Indian city via Nominatim/OpenStreetMap + AI fallback
- **Virtual Temple Tour**: Image galleries from Wikimedia Commons on each temple detail page

### Additional Features
- **Temple Favorites/Bookmarks**: Save favorite temples to localStorage
- **Festival Calendar**: Festivals with AI-enriched data
- **Toast Notifications**: Non-intrusive feedback for user actions
- **Back to Top**: Floating scroll-to-top button
- **Scroll Reveal Animations**: Elements animate into view as you scroll
- **Animated Stat Counters**: Counter animation on the home page
- **Login**: Username/Password (hardcoded) + Google Sign-In (demo)

## Open Source APIs Used

| API | Purpose | Endpoint(s) |
|-----|---------|-------------|
| **Nominatim (OpenStreetMap)** | Geocoding + temple search by city | `GET /api/explore/:city` |
| **Wikipedia REST API** | Temple summaries & thumbnails | `GET /api/wiki/:title` |
| **Wikimedia Commons API** | Temple images (open source) | `GET /api/images/:query` |
| **Groq Chat Completions** | All AI features (20+ endpoints) | `POST /api/ai/*` |
| **Leaflet.js + OSM Tiles** | Interactive map rendering | Frontend |
| **Google Translate Widget** | Full-site language translation | Frontend |
| **Web Speech API** | Voice search | Frontend |

## Tech Stack

- **Frontend**: HTML5, CSS3 (dark/light themes, animations, glassmorphism), vanilla JavaScript, Font Awesome icons, Leaflet.js
- **Backend**: Node.js, Express.js, CORS
- **AI**: Groq LLM (Llama 3.3 70B Versatile) — 20+ AI-powered endpoints
- **Maps**: Leaflet.js + OpenStreetMap tiles + Nominatim geocoding
- **Data**: Wikipedia, Wikimedia Commons, hardcoded JSON
- **Auth**: In-memory sessions, hardcoded users, Google Sign-In

## Setup & Run

```bash
npm install
npm start
```

Open **http://localhost:3000** in your browser.

## Project Structure

```
Hackathon/
├── server.js              # Express server: auth, temple API, Nominatim,
│                          #   Wikipedia, Wikimedia Commons, 20+ Groq LLM endpoints
├── data/
│   ├── temples.json       # Hardcoded temple records
│   └── festivals.json     # Festival calendar
├── public/
│   ├── index.html         # SPA: 12 sections, map, modals, toast, back-to-top
│   ├── css/style.css      # Dark/light theme, 1900+ lines of styling
│   └── js/
│       ├── app.js         # Navigation, search, map, horoscope, favorites, voice,
│       │                  #   theme, toast, scroll reveal, animated counters
│       ├── auth.js        # Login (username/password + Google), session management
│       └── ai.js          # AI chat, trip planner agent, quiz, quick actions
├── package.json
└── README.md
```

## Default Logins

| Username | Password   |
|----------|------------|
| pilgrim  | pilgrim123 |
| admin    | admin123   |
| user     | password   |

## API Endpoints (30+)

### Local Data
- `GET /api/temples` — List/search temples
- `GET /api/temples/:id` — Get temple by ID
- `GET /api/festivals` — List all festivals

### Open Source APIs (proxied)
- `GET /api/explore/:city` — Find temples via Nominatim + AI fallback
- `GET /api/wiki/:title` — Wikipedia summary + AI fallback
- `GET /api/images/:query` — Wikimedia Commons images

### AI Endpoints (Groq LLM)
- `POST /api/ai/recommend` — Chat with AI guide
- `POST /api/ai/smart-recommend` — Smart recommendations
- `POST /api/ai/search` — LLM-powered temple search
- `POST /api/ai/temple-detail` — Detailed temple info
- `POST /api/ai/planner` — Quick pilgrimage planner
- `POST /api/ai/plan-trip` — Detailed conversational trip planner
- `POST /api/ai/story` — Temple mythological story
- `POST /api/ai/wish-guide` — Prayer/wish temple guide
- `POST /api/ai/nearby` — Nearby essentials
- `POST /api/ai/compare` — Temple comparison
- `POST /api/ai/aarti` — Aarti/bhajan lyrics
- `POST /api/ai/festivals` — AI festival data
- `GET /api/ai/quiz` — Temple knowledge quiz
- `GET /api/ai/horoscope/:rashi` — Daily spiritual horoscope
- `GET /api/ai/map-temples` — Temple GPS data for map
- `GET /api/ai/alerts` — Real-time spiritual alerts
- `GET /api/ai/temple-of-day` — Daily featured temple
- `GET /api/ai/mantra` — Daily mantra
- `GET /api/ai/did-you-know` — Random temple facts

### Auth
- `POST /api/login` — Login
- `POST /api/auth/google` — Google Sign-In
- `POST /api/logout` — Logout
- `GET /api/me` — Check session
