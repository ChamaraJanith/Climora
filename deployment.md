# Climora — Deployment Report

Climora is a full-stack climate disaster preparedness platform. The backend is a Node.js + Express.js REST API deployed on **Render**, the frontend is a React + Vite SPA deployed on **Vercel**, and the database is hosted on **MongoDB Atlas**.

## Live URLs

| Service      | URL                                        |
|--------------|--------------------------------------------|
| Backend API  | https://climora-4aq8.onrender.com          |
| Frontend App | https://climora-omega.vercel.app           |

> **Note:** Render free-tier services spin down after inactivity. The first request after idle may take ~30 seconds to respond.

---

## 1. Backend Deployment (Render)

**Platform:** [Render](https://render.com)

### Setup Steps

1. Create a Render account at https://render.com
2. Click **New → Web Service** and connect your GitHub repository
3. Set the **Root Directory** to `backend`
4. Configure the service:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** `Node`
5. Add all environment variables listed in [Section 4](#4-environment-variables) under the **Environment** tab
6. Click **Deploy**

### Health Check

The root path returns a JSON health-check response:

```
GET https://climora-4aq8.onrender.com/
```

```json
{
  "message": "Climate Disaster Preparedness API is running 🚀"
}
```

---

## 2. Frontend Deployment (Vercel)

**Platform:** [Vercel](https://vercel.com)

### Setup Steps

1. Create a Vercel account at https://vercel.com
2. Click **Add New → Project** and import your GitHub repository
3. Set the **Root Directory** to `frontend`
4. Configure the build settings:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add the frontend environment variables listed in [Section 4](#4-environment-variables)
6. Click **Deploy**

### SPA Rewrite Rule

The `frontend/vercel.json` file contains a rewrite rule to support client-side routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This ensures all routes (e.g., `/dashboard`, `/login`) are handled by React Router instead of returning a 404.

---

## 3. Database Configuration (MongoDB Atlas)

**Platform:** [MongoDB Atlas](https://www.mongodb.com/atlas)

### Setup Steps

1. Create a MongoDB Atlas account and click **Build a Cluster**
2. Choose a free-tier (M0) cluster and select a region
3. Under **Database Access**, create a database user with read/write permissions
4. Under **Network Access**, add `0.0.0.0/0` to the IP allowlist (allows connections from Render)
5. Click **Connect → Drivers**, copy the connection string, and replace `<password>` with your database user's password
6. Set this connection string as the `MONGO_URI` environment variable on Render — never commit it to source code

> The backend will throw a startup error and exit if `MONGO_URI` is missing or invalid.

---

## 4. Environment Variables

### 4.1 Backend Variables

Set these in Render under **Environment → Environment Variables**:

| Variable               | Purpose                                              | Example / Placeholder                                                      |
|------------------------|------------------------------------------------------|----------------------------------------------------------------------------|
| `PORT`                 | HTTP port the server listens on                      | `5000`                                                                     |
| `MONGO_URI`            | MongoDB Atlas connection string                      | `mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/`            |
| `JWT_SECRET`           | Secret key for signing JWTs                          | `<your-jwt-secret>`                                                        |
| `JWT_EXPIRES_IN`       | JWT expiry duration                                  | `7d`                                                                       |
| `GOOGLE_CLIENT_ID`     | Google OAuth 2.0 client ID                           | `<your-google-client-id>`                                                  |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret                       | `<your-google-client-secret>`                                              |
| `WEATHER_API_KEY`      | OpenWeatherMap One Call 3.0 API key                  | `<your-openweathermap-key>`                                                |
| `WEATHER_BASE_URL`     | OpenWeatherMap base URL                              | `https://api.openweathermap.org/data/3.0/onecall`                          |
| `YOUTUBE_API_KEY`      | YouTube Data API v3 key (for article video fetch)    | `<your-youtube-api-key>`                                                   |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary cloud name (for report image uploads)     | `<your-cloud-name>`                                                        |
| `CLOUDINARY_API_KEY`   | Cloudinary API key                                   | `<your-cloudinary-api-key>`                                                |
| `CLOUDINARY_API_SECRET`| Cloudinary API secret                                | `<your-cloudinary-api-secret>`                                             |
| `ORS_API_KEY`          | OpenRouteService key (for shelter routing/distance)  | `<your-ors-api-key>`                                                       |
| `NEWSDATA_API_KEY`     | NewsData.io key (for climate news feed)              | `<your-newsdata-api-key>`                                                  |
| `FRONTEND_URL`         | Deployed frontend origin (used for CORS)             | `https://climora-omega.vercel.app`                                         |

### 4.2 Frontend Variables

Set these in Vercel under **Settings → Environment Variables**:

| Variable               | Purpose                                              | Example / Placeholder                                  |
|------------------------|------------------------------------------------------|--------------------------------------------------------|
| `VITE_API_BASE_URL`    | Backend API base URL used by axios                   | `https://climora-4aq8.onrender.com/api`                |
| `VITE_GOOGLE_CLIENT_ID`| Google OAuth client ID for frontend sign-in button   | `<your-google-client-id>`                              |

---

## 5. Deployment Evidence

### Backend Health Check

```
GET https://climora-4aq8.onrender.com/
```

Expected response:

```json
{
  "message": "Climate Disaster Preparedness API is running 🚀"
}
```

### Frontend Live App

The frontend application is live and accessible at:
**https://climora-omega.vercel.app**

### Screenshots

**Vercel Production Deployment Dashboard**

![Vercel deployment dashboard showing climora-omega.vercel.app with status Ready](docs/screenshots/Vercel_Depolyment_Proof.png)

**Live Frontend Application**

![Climora live frontend at climora-omega.vercel.app showing the landing page](docs/screenshots/Climora.png)

> If images do not render in your viewer, screenshots are located at `docs/screenshots/` in the repository.

---

## 6. Local Development Setup

### 6.1 Backend

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create the environment file
cp .env.example .env
# Then fill in all values from Section 4.1 with real credentials

# 4. Start the development server
npm run dev
```

The backend will be available at **http://localhost:5000**

> If any required environment variable is missing, the server will throw a startup error and exit with a non-zero code.

### 6.2 Frontend

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create the environment file
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env
echo "VITE_GOOGLE_CLIENT_ID=<your-google-client-id>" >> .env

# 4. Start the development server
npm run dev
```

The frontend dev server will be available at **http://localhost:5173**
