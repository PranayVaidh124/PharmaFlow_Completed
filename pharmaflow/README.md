# PharmaFlow

Smart pharmacy inventory management with **FEFO (First-Expiry-First-Out)** dispensing.

## Overview
PharmaFlow tracks medicines at batch level, calculates sellable stock from non-expired batches, provides expiry alerts and search, and enforces FEFO on the backend during dispensing.

## Features
- Real MongoDB persistence with Mongoose
- JWT registration/login
- Medicine and batch CRUD
- Backend-enforced FEFO
- Atomic dispensing with MongoDB transactions
- Sellable vs expired stock
- Expiry alerts (7/30/90 days)
- Search, server-side pagination and sorting
- Dispensing audit history
- Responsive React dashboard and landing page

## Stack
React + Vite + React Router + Axios + Tailwind CSS, Node.js + Express, MongoDB + Mongoose, JWT + bcryptjs.

## Prerequisites
Node.js 20+ and MongoDB 7+ (or Docker).

## Install
```bash
npm run install:all
```
Copy `server/.env.example` to `server/.env` and set `MONGO_URI` and `JWT_SECRET`.

## Run
```bash
npm run dev
```
Frontend: http://localhost:5173  
API: http://localhost:5000  
Health: http://localhost:5000/api/health

### Demo data
```bash
npm run seed
```
Demo login: `demo@pharmaflow.local` / `password123`

## Docker
```bash
docker compose up --build
```

## API endpoints
### Auth
- `POST /api/auth/register` — create account
- `POST /api/auth/login` — login and receive JWT
- `GET /api/auth/me` — current user
- `POST /api/auth/logout` — client-side logout acknowledgement

### Medicines
- `GET /api/medicines?search=&page=1&limit=10&sortBy=name&order=asc`
- `POST /api/medicines`
- `GET /api/medicines/:id`
- `PUT /api/medicines/:id`
- `DELETE /api/medicines/:id`
- `GET /api/medicines/:id/stock`
- `GET /api/medicines/:id/batches?page=1&limit=50&sortBy=expiryDate&order=asc`
- `POST /api/medicines/:id/batches`

### Batches
- `PUT /api/batches/:id`
- `DELETE /api/batches/:id`

### Dispensing
- `POST /api/dispense` body `{ "medicineId": "...", "quantity": 70 }`
- `GET /api/dispense/history?page=1&limit=10`
- `GET /api/dispense/:id`

### Expiry
- `GET /api/expiry-alerts?days=7`
- `GET /api/expiry-alerts?days=30`
- `GET /api/expiry-alerts?days=90`

### Dashboard
- `GET /api/dashboard`

All management endpoints require `Authorization: Bearer <JWT>`.

## FEFO
The dispensing service selects only batches with `quantity > 0` and `expiryDate > now`, sorts by expiry ascending, verifies enough sellable stock exists, then decrements batches and writes a dispensing record in a MongoDB transaction. Insufficient stock causes the entire transaction to fail without a partial deduction.

## Search / pagination / sorting
Medicine search is case-insensitive and supports name, generic name and manufacturer; batch-number searching is supported through the batch API/UI data model. Pagination and sorting are server-side. Batch views default to earliest expiry first.

## Testing
```bash
npm test
```
Tests cover FEFO, expired-batch exclusion, insufficient stock behavior and password hashing. Full integration tests require a running MongoDB instance.

## Debugging
1. Check `GET /api/health`.
2. Confirm `MONGO_URI` is reachable.
3. Confirm the frontend is on port 5173 and API on 5000.
4. Use browser DevTools Network for API errors.
5. Run `npm test` for FEFO/stock/auth unit tests.

## Repository structure
`client/` contains the React application. `server/` contains Express routes, controllers, models and business services. `README.md` and `REASONING.md` are at the root as required.

## Future improvements
Exactly three next features are shown on the landing page: Supplier Management, Automated Notifications, and Sales & Inventory Analytics.
