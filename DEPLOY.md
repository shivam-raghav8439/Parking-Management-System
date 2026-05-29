# College Parking Management System - Deploy Guide

## ── BACKEND SETUP ──────────────────────────────
```bash
mkdir college-parking && cd college-parking
mkdir server && cd server
npm init -y
npm install express mongoose dotenv cors bcryptjs jsonwebtoken \
  express-validator morgan helmet express-rate-limit date-fns
npm install -D nodemon
```

### Create `.env` in `/server`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/college_parking
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Add to package.json scripts:
```json
"dev": "nodemon server.js",
"start": "node server.js"
```

```bash
cd ..
```

## ── FRONTEND SETUP ─────────────────────────────
(The React + Vite frontend is already initialized in the root directory)

### Configure `.env` in the root directory:
```env
VITE_API_URL=http://localhost:5000/api
```

## ── RUN BOTH ───────────────────────────────────
### Terminal 1 (backend API server):
```bash
cd server
npm run dev
```

### Terminal 2 (frontend Vite client):
```bash
npm run dev
```

## ── PRODUCTION DEPLOY ──────────────────────────
### Backend → Render.com or Railway.app
- Connect your GitHub repo.
- In the Render dashboard:
  - Set the **Root Directory** to `server`.
  - Build Command: `npm install`
  - Start Command: `node server.js`
- Set the following environment variables:
  - `MONGODB_URI`: Your MongoDB Atlas connection string.
  - `JWT_SECRET`: A long secure random string.
  - `FRONTEND_URL`: The URL of your deployed frontend (e.g. `https://your-app.vercel.app`).

### Frontend → Vercel
- Connect your GitHub repo.
- In the Vercel dashboard:
  - Set the **Root Directory** to `./` (keep it as the root directory, do NOT use `/client`).
  - Vercel will automatically detect the Vite React project configuration.
- Set the following environment variable in Vercel:
  - `VITE_API_URL`: Your deployed Render/Railway backend API URL (e.g. `https://your-api.onrender.com/api`).

### MongoDB → MongoDB Atlas (free tier)
- Create a cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
- Obtain the connection string and set it as `MONGODB_URI` in the backend environment variables.
