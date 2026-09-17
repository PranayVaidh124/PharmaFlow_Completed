# PharmaFlow

Smart pharmacy inventory management for neighborhood pharmacies, with batch-level stock tracking and backend-enforced **FEFO (First-Expiry-First-Out)** dispensing.

## 1. What the project does

PharmaFlow helps a pharmacist:

- Maintain a medicine catalogue.
- Track every medicine batch separately.
- Record batch quantity, received date and expiry date.
- Calculate sellable stock using only non-expired batches.
- Search medicines and inspect in-date stock.
- Show expiry alerts.
- Dispense medicines using FEFO.
- Keep a dispensing/audit history.
- Register and authenticate users.
- Paginate and sort inventory data.

The important business rule is that the backend never selects an expired batch for dispensing and consumes the valid batch with the earliest expiry date first.

---

## 2. Technology Stack

### Frontend
- React
- Vite
- React Router
- Axios
- CSS

### Backend
- Node.js
- Express.js
- Mongoose
- JWT
- bcryptjs

### Database
- MongoDB / MongoDB Atlas

---

## 3. Project Structure

```text
pharmaflow/
├── README.md
├── REASONING.md
├── AI_LOGS.md
├── package.json
├── .gitignore
├── docker-compose.yml
├── client/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
└── server/
    ├── package.json
    ├── .env.example
    ├── server.js
    ├── seed.js
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── services/
    ├── tests/
    └── utils/
```

---

## 4. Prerequisites

Install:

- Node.js 20 or later
- npm
- MongoDB Atlas account, or a local MongoDB installation

---

## 5. MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster.
2. Create a database user.
3. Add your development IP address under Network Access.
4. Copy the application connection string.
5. Create:

```text
server/.env
```

6. Add:

```env
PORT=5000
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/pharmaflow?retryWrites=true&w=majority
JWT_SECRET=change_this_to_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Replace `USERNAME`, `PASSWORD`, and `YOUR-CLUSTER` with your Atlas values.

If the MongoDB password contains characters such as `@`, `#`, `/`, `:`, `?`, or `%`, URL-encode the password before putting it in the URI.

**Never commit `server/.env` to GitHub.**

---

## 6. Install Dependencies

From the project root:

```bash
npm run install:all
```

If that command is unavailable, install each application separately:

```bash
cd server
npm install
cd ../client
npm install
cd ..
```

---

## 7. Run the Project

### Option A — Start frontend and backend together

From the project root:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:5000
```

### Option B — Start backend separately

Terminal 1:

```bash
cd server
npm install
npm run dev
```

### Option C — Start frontend separately

Terminal 2:

```bash
cd client
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## 8. Check the Backend

Open:

```text
http://localhost:5000/api/health
```

A successful response should indicate that the API is running.

If the backend shows a MongoDB connection error, check:

1. `server/.env`
2. MongoDB username
3. MongoDB password
4. Atlas Network Access
5. Cluster hostname
6. Internet/network restrictions

To test DNS/SRV resolution on Windows:

```powershell
nslookup -type=SRV _mongodb._tcp.YOUR-CLUSTER.mongodb.net
```

---

## 9. Demo Data

To insert the project's sample data:

```bash
npm run seed
```

The seed script creates demo medicines, batches and a demo user.

Demo credentials:

```text
Email: demo@pharmaflow.local
Password: password123
```

Only use these credentials for local/demo testing.

---

# 10. API Endpoints

All management endpoints require:

```http
Authorization: Bearer <JWT>
```

## Health

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API/server health |

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/auth/logout` | Logout acknowledgement |

### Register example

```json
{
  "name": "Pharmacist",
  "email": "pharmacist@example.com",
  "password": "password123"
}
```

### Login example

```json
{
  "email": "pharmacist@example.com",
  "password": "password123"
}
```

---

## Medicines

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/medicines` | List medicines |
| POST | `/api/medicines` | Create medicine |
| GET | `/api/medicines/:id` | Get one medicine |
| PUT | `/api/medicines/:id` | Update medicine |
| DELETE | `/api/medicines/:id` | Delete medicine |
| GET | `/api/medicines/:id/stock` | Get sellable/expired stock |
| GET | `/api/medicines/:id/batches` | List medicine batches |
| POST | `/api/medicines/:id/batches` | Add a batch |

### Search

```text
GET /api/medicines?search=paracetamol
```

### Pagination

```text
GET /api/medicines?page=1&limit=10
```

### Sorting

```text
GET /api/medicines?page=1&limit=10&sortBy=name&order=asc
```

---

## Batches

| Method | Endpoint | Purpose |
|---|---|---|
| PUT | `/api/batches/:id` | Update batch |
| DELETE | `/api/batches/:id` | Delete batch |

Batch listings default to earliest expiry first so that FEFO-relevant stock is visible first.

---

## Dispensing

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/dispense` | Dispense medicine using FEFO |
| GET | `/api/dispense/history` | Get dispensing history |
| GET | `/api/dispense/:id` | Get one dispensing transaction |

### Dispense example

```json
{
  "medicineId": "MEDICINE_ID",
  "quantity": 70
}
```

The backend calculates the exact batch allocation. The frontend cannot choose an expired batch and cannot bypass FEFO.

---

## Expiry Alerts

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/expiry-alerts?days=7` | Batches expiring within 7 days |
| GET | `/api/expiry-alerts?days=30` | Batches expiring within 30 days |
| GET | `/api/expiry-alerts?days=90` | Batches expiring within 90 days |

---

## Dashboard

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/dashboard` | Dashboard statistics |

---

# 11. FEFO Business Rule

FEFO means **First-Expiry-First-Out**.

For a dispensing request:

1. Find batches belonging to the requested medicine.
2. Ignore batches with zero quantity.
3. Ignore expired batches.
4. Sort remaining batches by expiry date ascending.
5. Consume the earliest-expiring valid batch first.
6. Continue with the next earliest valid batch if more quantity is required.
7. Save the exact batch allocations in dispensing history.
8. If total valid stock is insufficient, reject the transaction rather than partially deducting stock.

Example:

```text
Batch A → 20 units → expires first
Batch B → 50 units → expires second
Batch C → 100 units → expires last
```

For a request of 60 units:

```text
Batch A → 20
Batch B → 40
Batch C → 0
```

An expired batch is never selected.

---

# 12. Sellable Stock

Sellable stock includes only batches satisfying:

```text
quantity > 0
AND
expiryDate > current date/time
```

Expired inventory is kept separate so that the pharmacist can see that stock exists but cannot sell it.

---

# 13. Expiry Categories

The application can identify:

- Expired
- Critical — within 7 days
- Warning — within 30 days
- Upcoming — within 90 days
- Safe — beyond 90 days

---

# 14. Testing

Run backend tests:

```bash
npm test
```

or:

```bash
cd server
npm test
```

The tests cover important business behavior such as:

- FEFO ordering
- Expired batch exclusion
- Stock calculations
- Insufficient stock handling
- Password hashing

Integration tests that require MongoDB should be run with a dedicated test database.

---

# 15. Debugging

### Backend does not start

```bash
cd server
npm install
npm run dev
```

Check:

```text
server/.env
```

### MongoDB connection fails

Check:

```env
MONGO_URI=...
```

Then verify:

- Atlas cluster is running.
- Database user exists.
- Password is correct.
- IP address is allowed.
- Password special characters are URL-encoded.

### Frontend does not start

```bash
cd client
npm install
npm run dev
```

### Browser shows API errors

Open browser DevTools:

```text
F12 → Network
```

Check the failing request and its HTTP status.

### JSX/Vite syntax error

Read the filename and line number shown in the Vite error overlay. Fix the indicated JSX/JavaScript syntax, save the file, and let Vite restart automatically.

---

# 16. Docker

If Docker is installed:

```bash
docker compose up --build
```

This starts MongoDB, the backend and frontend using the project's Docker configuration.

---

# 17. Security

Do not commit:

```text
server/.env
node_modules/
dist/
```

The repository `.gitignore` excludes environment files and generated dependency/build directories.

If a MongoDB password has ever been accidentally pushed to a public GitHub repository, rotate that password in MongoDB Atlas.

---

# 18. Exactly Three Next Features

The landing page intentionally presents exactly these three future features:

1. **Supplier Management**
2. **Automated Notifications**
3. **Sales & Inventory Analytics**

