# 🅿️ SmartPark - College Parking Management System

A modern, full-stack campus parking management platform designed to optimize parking slot allocation, simulate ANPR (Automatic Number Plate Recognition) and CCTV monitoring, and provide users with real-time slot reservation capabilities along with an AI-powered assistant.

---

## 🚀 Live Links & Admin Access

### 🔗 Deployed Application
* **Frontend Web App:** [https://galgotiasparkingmanagement.netlify.app](https://galgotiasparkingmanagement.netlify.app)
* **Direct Admin Dashboard:** [https://galgotiasparkingmanagement.netlify.app/admin/users](https://galgotiasparkingmanagement.netlify.app/admin/users)

---

### 🔑 Quick Admin Login Guide
The system is configured with an **automatic authentication bypass** for developer/demonstrator testing. You do not need to register a pre-existing account:

1. Click on the **[Direct Admin Dashboard](https://galgotiasparkingmanagement.netlify.app/admin/users)** link.
2. Enter **any email address** (e.g., `admin@smartpark.edu` or `testadmin@gmail.com`).
3. Enter **any password** (minimum 6 characters, e.g., `admin123`).
4. Click **Login**. The system will automatically create your account as a **Superadmin** on the spot, grant you full administrative access, and redirect you to the Admin Panel.

#### Direct Admin Modules:
* 👥 **[User Management Dashboard](https://galgotiasparkingmanagement.netlify.app/admin/users)** — Manage users, assign roles (Superadmin, Admin, Operator, Security, User), block/unblock accounts, or delete users.
* 🚗 **[Slot Management Dashboard](https://galgotiasparkingmanagement.netlify.app/admin/slots)** — View, update, reset, or manually seed parking slots across various zones (Zone A for Cars, Zone B for Bikes, etc.).
* 📅 **[Booking Management Dashboard](https://galgotiasparkingmanagement.netlify.app/admin/bookings)** — Oversee all campus parking bookings, filter by status, and approve/cancel reservations.

---

## 🛠️ Key Features

- **Real-Time Interactive Parking Map:** Interactive visual dashboard of campus parking zones with color-coded slots (available, reserved, occupied, or blocked).
- **ANPR (Automatic Number Plate Recognition) Simulator:** Simulates camera-based plate scanning to auto-detect vehicles, matching plates to active reservations and logs.
- **CCTV Live Feed Simulation:** Simulates multi-camera video feed coverage across parking zones.
- **AI Parking Assistant:** Integrated AI chat helper to answer parking rules, guidelines, slot availability queries, and offer support.
- **Comprehensive Reporting & Analytics:** Visual trends, booking frequency graphs, peak hour analysis, and CSV/PDF exportable logs.
- **Role-Based Access Control (RBAC):** Distinct dashboards for Superadmins, Admins, Operators, Security, and general campus Users.

---

## 💻 Tech Stack

### Frontend
* **Core:** React.js (Vite)
* **Styling:** Tailwind CSS, Lucide Icons, React Hot Toast
* **Routing & State:** React Router DOM, React Context API
* **Charts:** Recharts

### Backend
* **Runtime & Framework:** Node.js, Express.js
* **Database:** MongoDB (Mongoose ODM)
* **Security & Auth:** JSON Web Tokens (JWT), BCrypt.js, Helmet, Express Rate Limit
* **Integrations:** Nodemon, Axios, Fast2SMS (SMS OTP), Nodemailer (Verification Emails)

---

## ⚙️ Running Locally

### Prerequisites
* Node.js (v16+)
* MongoDB (Local instance or MongoDB Atlas Connection String)

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shivam-raghav8439/Parking-Management-System.git
   cd Parking-Management-System
   ```

2. **Backend Configuration:**
   * Navigate to the `server` directory and install dependencies:
     ```bash
     cd server
     npm install
     ```
   * Create a `.env` file in `/server` based on the guide in `DEPLOY.md`:
     ```env
     PORT=5000
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     FRONTEND_URL=http://localhost:5173
     ```
   * Start the backend development server:
     ```bash
     npm run dev
     ```

3. **Frontend Configuration:**
   * Return to the root directory and install dependencies:
     ```bash
     cd ..
     npm install
     ```
   * Create a `.env` file in the root directory:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```
   * Start the frontend development server:
     ```bash
     npm run dev
     ```
