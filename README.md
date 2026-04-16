# 🛠️ GearGuard: The Ultimate Maintenance Tracker

A production-ready maintenance management system for tracking assets and managing maintenance requests.

---

## 🌸 Nexus Spring of Code 2026

This project is officially participating in **Nexus Spring of Code (NSoC) 2026** 🚀

We welcome contributors to collaborate, learn, and build impactful features.

---

## ✨ Features

✅ Equipment Management (Machines, Vehicles, Computers)\
✅ Maintenance Team Management\
✅ Maintenance Request Tracking (Corrective & Preventive)\
✅ Kanban Board with Drag & Drop\
✅ Calendar View for Preventive Maintenance\
✅ Smart Buttons & Auto-fill Logic\
✅ Overdue Indicators\

---

## 🛠️ Tech Stack

* **Backend:** Node.js + Express + MongoDB + Mongoose
* **Frontend:** React + TypeScript + Vite + Tailwind CSS
* **UI Libraries:** React DnD, React Big Calendar

---

## ⚙️ Quick Start

### 1. Install Dependencies

```bash
npm run install-all
```

### 2. Setup Database

```bash
cp .env.example .env
# Add your MongoDB URI
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Production Build

```bash
npm run build
npm start
```

---

## 🗄️ Database Setup

The application uses MongoDB. Ensure your `MONGO_URI` is properly configured.

---

## 🔌 API Endpoints

### Equipment

* GET /api/equipment
* POST /api/equipment
* PUT /api/equipment/:id
* DELETE /api/equipment/:id

### Teams

* GET /api/teams
* POST /api/teams
* PUT /api/teams/:id
* DELETE /api/teams/:id

### Maintenance Requests

* GET /api/requests
* POST /api/requests
* PUT /api/requests/:id
* PATCH /api/requests/:id/stage
* DELETE /api/requests/:id

---

## 📁 Project Structure

```
gearguard/
├── server/
├── client/
└── package.json
```

---

## 🤝 Contributing (NSoC 2026)

* Check issues and request assignment
* Do NOT create PR without assignment
* Mention `NSoC'26` in every PR
* Follow `CONTRIBUTING.md`

---

## 🏷️ Issue Labels

* **level1 — 3 pts** → Beginner
* **level2 — 5 pts** → Intermediate
* **level3 — 10 pts** → Advanced

---

## ⚠️ Contribution Rules

* PR without assignment → ❌ Rejected
* Missing `NSoC'26` → ⚠️ Update required
* Low-quality PR → ❌ Not merged

---

## ⭐ Support

If you like this project, give it a ⭐ and contribute!
