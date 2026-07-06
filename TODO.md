# TODO - Mesob Sululta Branch Backend

## Step 1 — Dependencies
- [x] Update `backend/package.json` to include JWT auth, bcrypt hashing, helmet, and rate limiting.

## Step 2 — Core Models

- [ ] Create `backend/models/Organization.js`
- [ ] Create `backend/models/Service.js`
- [ ] Create `backend/models/User.js`

## Step 3 — Controllers
- [ ] Create `backend/controllers/authController.js`
- [ ] Create `backend/controllers/organizationController.js`
- [ ] Create `backend/controllers/serviceController.js`

## Step 4 — Routes
- [ ] Create `backend/routes/authRoutes.js`
- [ ] Create `backend/routes/organizationRoutes.js`
- [ ] Create `backend/routes/serviceRoutes.js`
- [ ] Create `backend/routes/index.js`

## Step 5 — Middleware
- [ ] Create `backend/middleware/authMiddleware.js`
- [ ] Create `backend/middleware/roleMiddleware.js`
- [ ] Create `backend/middleware/errorMiddleware.js`

## Step 6 — Seed Data
- [x] Create `backend/seed.js` with 4 organizations and 2–3 services each.


## Step 7 — Server Bootstrap
- [x] Update `backend/server.js`:

  - helmet + rate-limit + cors
  - mount routes
  - connect mongo
  - run seed on startup
  - centralized error handling

## Step 8 — Env Template
- [x] Create `backend/.env.example`


## Step 9 — Smoke Test
- [x] Run `npm install` in `backend/`

- [ ] Start dev server and verify:

  - `/` health
  - `/api/auth/register` and `/api/auth/login`
  - public organization/service read endpoints
  - admin-protected write endpoints

