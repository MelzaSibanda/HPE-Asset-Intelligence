# HPE Asset Intelligence — Full-Stack Setup Guide

Stack: **React (Vite)** · **PHP 8.1+** · **CodeIgniter 4** · **MySQL (XAMPP)**

---

## 1 · Prerequisites

| Tool | Version | Download |
|---|---|---|
| XAMPP | 8.1+ | https://www.apachefriends.org |
| Composer | latest | https://getcomposer.org |
| Node.js | 18+ | https://nodejs.org |
| Git | any | https://git-scm.com |

Start **Apache** and **MySQL** in the XAMPP Control Panel before continuing.

---

## 2 · Database setup

1. Open **phpMyAdmin** → `http://localhost/phpmyadmin`
2. Click **Import** → choose `backend/database/hpe_schema.sql` → click **Go**

This creates the `hpe_asset_intelligence` database with all tables and seed data.

---

## 3 · CodeIgniter 4 backend setup

### 3a · Install CodeIgniter 4

```bash
cd C:\xampp\htdocs
composer create-project codeigniter4/appstarter hpe-api
```

### 3b · Copy the app files

Copy every file from `backend/app/` (this project) into `C:\xampp\htdocs\hpe-api\app\`, overwriting the existing files:

```
backend/app/Config/Routes.php        → hpe-api/app/Config/Routes.php
backend/app/Config/Filters.php       → hpe-api/app/Config/Filters.php
backend/app/Filters/CorsFilter.php   → hpe-api/app/Filters/CorsFilter.php
backend/app/Filters/JwtFilter.php    → hpe-api/app/Filters/JwtFilter.php
backend/app/Helpers/jwt_helper.php   → hpe-api/app/Helpers/jwt_helper.php
backend/app/Controllers/Api/         → hpe-api/app/Controllers/Api/  (whole folder)
backend/app/Models/                  → hpe-api/app/Models/            (whole folder)
```

### 3c · Configure the database

Edit `C:\xampp\htdocs\hpe-api\.env` (copy from `env` if needed):

```ini
# Rename .env.example to .env or edit the existing .env
CI_ENVIRONMENT = development

database.default.hostname = localhost
database.default.database = hpe_asset_intelligence
database.default.username = root
database.default.password =
database.default.DBDriver = MySQLi
database.default.DBPrefix =
database.default.port     = 3306

JWT_SECRET = hpe-asset-intel-secret-key-2026
```

> **Default XAMPP MySQL password is blank.** If you set one, put it after `password =`.

### 3d · Verify it works

Open `http://localhost/hpe-api/api/auth/login` — you should see a 405 Method Not Allowed
(it only accepts POST). That confirms routing is working.

**Test with curl or Postman:**
```bash
curl -X POST http://localhost/hpe-api/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"werner.nienaber@hpesa.com\",\"password\":\"password123\"}"
```

Expected response:
```json
{ "status": "success", "data": { "token": "eyJ...", "user": {...} } }
```

---

## 4 · React frontend setup

```bash
# In the project root (where package.json lives)
npm install
npm run dev
```

Open `http://localhost:5173` — you'll see the login screen.

**Login credentials:**
- Email: `werner.nienaber@hpesa.com`
- Password: `password123`

---

## 5 · CORS — if you get blocked requests

The `CorsFilter.php` allows `http://localhost:5173`. If your Vite dev server runs on a different
port, update the origin in `hpe-api/app/Filters/CorsFilter.php`:

```php
header('Access-Control-Allow-Origin: http://localhost:YOURPORT');
```

---

## 6 · API endpoint reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → returns JWT |
| POST | `/api/auth/logout` | Logout (client discards token) |
| GET | `/api/dashboard` | KPIs, fleet location, duty profile, recent alarms |
| GET | `/api/map/sites` | All sites with asset counts + shaft data |
| GET | `/api/assets` | Paginated asset list (`?page=1&search=DRL`) |
| GET | `/api/assets/{id}` | Asset detail + alarm + movement history |
| GET | `/api/assets/{id}/vibration` | 30-day vibration trace (`?days=30`) |
| GET | `/api/alarms` | Alarm list (`?status=active&severity=critical`) |
| POST | `/api/alarms/{id}/acknowledge` | Acknowledge an alarm |
| POST | `/api/work-orders` | Create work order |
| GET | `/api/reports/{type}` | Run a report (`utilisation`, `maintenance`, etc.) |

All protected endpoints require `Authorization: Bearer <token>` header.

---

## 7 · Project structure

```
project/
├── backend/                ← CI4 files (copy into XAMPP)
│   ├── database/
│   │   └── hpe_schema.sql  ← Import this into phpMyAdmin
│   └── app/
│       ├── Config/         Routes.php, Filters.php
│       ├── Controllers/Api/ Auth, Dashboard, Assets, Alarms, WorkOrders, Reports, Map
│       ├── Filters/        CorsFilter, JwtFilter
│       ├── Helpers/        jwt_helper.php
│       └── Models/         User, Asset, Alarm, WorkOrder, Site, SensorReading
│
└── src/                    ← React frontend (already in project)
    ├── lib/api.ts           Axios client
    ├── contexts/AuthContext.tsx
    ├── api/                 dashboard, assets, alarms, workOrders, map, reports
    └── app/App.tsx          Full 9-screen SPA
```

---

## 8 · Troubleshooting

| Problem | Fix |
|---|---|
| `CORS error` in browser | Check `CorsFilter.php` origin matches your Vite port |
| `401 Unauthorized` | Token expired — log out and log in again |
| `404` on all API routes | Make sure `.htaccess` is in `hpe-api/public/`. CI4's rewrite rules live there |
| `500` on login | Check DB credentials in `.env`, confirm tables were created |
| Charts not loading | Ensure the backend returns `200` for `/api/dashboard` |
| White screen in React | Run `npm run dev` and check the browser console for errors |

> Apache mod_rewrite must be enabled. In XAMPP it's on by default.
