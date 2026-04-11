# Frontend Deployment Guide

This document explains how to deploy the `frontend/` application for Climora.

## ✅ Build Output

The frontend is a Vite-built React application. Production assets are generated into the `dist/` directory.

```bash
npm install
npm run build
```

Once built, the `dist/` folder contains static HTML, CSS, and JavaScript files ready for deployment.

## 📁 Required Environment Variable

Set the backend API URL for the deployed frontend using:

```env
VITE_API_BASE_URL=https://your-backend.example.com/api
```

If the backend is deployed to the same domain, set the full API base URL accordingly.

## 🔧 Recommended Hosting Platforms

### Netlify

1. Connect your repository to Netlify.
2. Set the build command:

```bash
npm run build
```

3. Set the publish directory:

```text
dist
```

4. Add the environment variable in Netlify site settings:

- `VITE_API_BASE_URL` = `https://your-backend.example.com/api`

5. Deploy.

### Vercel

1. Import the repo into Vercel.
2. Set the framework preset to `Vite`.
3. Set the build command:

```bash
npm run build
```

4. Set the output directory to:

```text
dist
```

5. Add environment variable:

- `VITE_API_BASE_URL` = `https://your-backend.example.com/api`

6. Deploy.

### Cloudflare Pages

1. Connect the frontend repo.
2. Set the build command:

```bash
npm install
npm run build
```

3. Set the build output directory:

```text
dist
```

4. Add environment variable:

- `VITE_API_BASE_URL` = `https://your-backend.example.com/api`

5. Deploy.

## 🌐 Hosting Behind a Reverse Proxy or Fullstack Server

If you deploy the backend and frontend together behind the same domain:

- Point `VITE_API_BASE_URL` to the backend API prefix
- Ensure the backend accepts requests from the frontend domain
- Consider using a proxy or rewrite rule for `/api/*`

## 🧪 Local Production Preview

After building, run:

```bash
npm run preview
```

This command serves the production bundle locally so you can validate the deployed behavior before publishing.

## 🔄 Common Deployment Checks

- Is `VITE_API_BASE_URL` set correctly? If requests fail, this is the top cause.
- Is the backend accessible from the deployed frontend origin?
- If you are using cookies, confirm CORS and `withCredentials` are configured correctly on the backend.
- If using a subfolder path, update `vite.config.js` with the `base` option.

## 📌 Special Notes for Climora

- The frontend uses `axios` with `withCredentials: true` and `Authorization: Bearer <token>` from `localStorage`.
- The weather explorer, user dashboard, and shelter manager weather pages rely on backend weather and alert endpoints.
- For production, make sure Google OAuth redirect URIs are configured correctly on the backend.

## 🧾 Troubleshooting

### 1. Blank page after deploy

- Verify `dist/` was published
- Check browser console for missing assets or wrong base path
- Confirm Vite `base` config if deploying to a sub-path

### 2. API calls fail

- Confirm `VITE_API_BASE_URL` points to the live backend URL
- Check network requests in browser devtools
- Make sure the backend supports CORS for the frontend origin

### 3. Authentication fails

- Ensure the JWT token is stored in `localStorage` after login
- Confirm backend is correctly issuing the token and the frontend is using the same `VITE_API_BASE_URL`

---

Happy deploying! If you want, I can also add a `frontend/.env.example` file for easier onboarding.