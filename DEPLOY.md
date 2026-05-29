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
```bash
npm create vite@latest client -- --template react
cd client
npm install tailwindcss @tailwindcss/vite axios \
  @tanstack/react-query react-router-dom react-hot-toast \
  recharts date-fns lucide-react
```

### Create `.env` in `/client`
```env
VITE_API_URL=http://localhost:5000/api
```

## ── RUN BOTH ───────────────────────────────────
### Terminal 1 (backend):
```bash
cd server && npm run dev
```

### Terminal 2 (frontend):
```bash
cd client && npm run dev
```

## ── PRODUCTION DEPLOY ──────────────────────────
### Backend → Render.com or Railway.app
- Connect GitHub repo
- Set env vars (`MONGODB_URI` using MongoDB Atlas, `JWT_SECRET`, `FRONTEND_URL`)
- Build command: `npm install`
- Start command: `node server.js`

### Frontend → Vercel
- Connect GitHub repo `/client` folder
- Set `VITE_API_URL` to your Render/Railway backend URL
- Vercel auto-detects Vite and deploys automatically

### MongoDB → MongoDB Atlas (free tier)
- Create cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Get connection string → set as `MONGODB_URI`
