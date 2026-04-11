# Climora Frontend

This repository contains the frontend application for **Climora**, a climate resilience and emergency shelter management platform. The frontend is built with **React 19**, **Vite**, **Tailwind CSS**, and integrates with the backend API for authentication, weather, alerts, shelter management, and educational content.

## 🚀 What this frontend includes

- Public landing pages and weather explorer
- User dashboard with weather panel, reports, checklists, learning resources, and climate news
- Shelter manager section with shelter inventory, occupancy, alerts, and full weather support
- Admin section with alert creation, staff management, weather monitoring, and reports
- Real-time weather, risk scoring, and alert aggregation
- Google OAuth login flow
- Socket.io client integration for real-time updates

## 🧰 Stack

- React 19
- Vite 8
- Tailwind CSS 4
- Axios
- React Router DOM 7
- Framer Motion
- Leaflet + React Leaflet
- GSAP
- lucide-react icons
- socket.io-client
- jsPDF
- Three.js / React Three Fiber

## 📦 Frontend Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## ⚙️ Environment Variables

The frontend reads the backend API URL from the `VITE_API_BASE_URL` environment variable.

Create a `.env` file inside the `frontend/` folder with:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

If the backend is deployed elsewhere, point this to the deployed backend base URL:

```env
VITE_API_BASE_URL=https://your-backend.example.com/api
```

## 🧭 Folder Structure

```
frontend/
├── public/                 # Static assets served by Vite
├── src/
│   ├── assets/             # Images, icons, and static imports
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React context providers (auth, theme, etc.)
│   ├── hooks/              # Custom hooks, including weather hooks
│   ├── layouts/            # Layout wrappers for public/admin pages
│   ├── pages/              # Page-level routes and views
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── public/         # Public weather and landing pages
│   │   ├── shelterManager/ # Shelter manager pages
│   │   └── ...
│   ├── services/           # API client and service utilities
│   ├── utils/              # Utility helpers
│   ├── App.jsx             # Main React app routes
│   └── main.jsx            # Vite entry point
├── package.json            # Frontend dependencies and scripts
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## 📌 Important Frontend Details

### API integration

The frontend uses `src/services/api.js` for all HTTP requests. Axios is configured with:

- `baseURL` from `VITE_API_BASE_URL`
- `withCredentials: true`
- Authorization header injection from `localStorage.token`

### Routing

Routes are defined in `src/App.jsx`:

- `/` → landing page
- `/weather` → public weather explorer
- `/dashboard` → user dashboard
- `/shelter/weather` → shelter manager weather page
- `/admin/weather` → admin weather monitor

### Weather and alerts

Weather pages use backend endpoints such as:

- `/weather/current`
- `/weather/forecast`
- `/weather/risk`
- `/weather/external-alerts`

The user dashboard and shelter weather page share the same weather panel components for consistent display.

### Authentication

Authentication is handled in `src/contexts/AuthContext.jsx` and includes:

- JWT token storage in `localStorage`
- Role-based protected routes
- Google OAuth redirect handling

## 🔧 Development Setup

1. Open a terminal inside `frontend/`
2. Install dependencies

```bash
npm install
```

3. Create `frontend/.env` and add:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

4. Start the frontend server

```bash
npm run dev
```

5. Open the app at `http://localhost:5173`

> The backend should be running separately on `http://localhost:5000` unless your environment variable points somewhere else.

## ✅ Production Build

Generate optimized production assets:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## 🧪 Linting

Run ESLint across the frontend source:

```bash
npm run lint
```

## 📄 Notes

- The frontend is a static React SPA built with Vite.
- If API calls fail, check that `VITE_API_BASE_URL` is correct.
- For a non-root deployment path, update `vite.config.js` with the `base` option.
