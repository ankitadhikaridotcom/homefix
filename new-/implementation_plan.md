# Authentication & Marketplace System Implementation Plan

## Goal Description
Create a complete, production‑ready authentication system for HomieFix with role‑based access control and the accompanying marketplace models (User, Service, Booking) and dashboards for customers (needers) and providers. The solution uses the existing React frontend and Express backend, upgrades the backend to use MongoDB + Mongoose, adds JWT authentication stored in HTTP‑only cookies, and builds the required UI pages and protected routes.

## User Review Required
> [!IMPORTANT] 
> Verify the following before we proceed:
> - Desired backend port (default 5000) and client URL (e.g., `http://localhost:5173`).
> - MongoDB connection URI (you can provide a placeholder for `.env.example`).
> - Any existing styling framework you want to keep (Tailwind is already in the project). If you prefer a different UI library, let us know.
> - Confirm if we should keep the current mock JSON‑file DB for fallback or replace it entirely with MongoDB.

## Open Questions
> [!WARNING] 
> - Do you want email verification or password reset flows? (Not required for basic auth but can be added later.)
> - Should providers be able to self‑approve their accounts, or will an admin approve them? Current mock DB uses a `status` field.
> - Are there any existing environment variables in `.env` that we must preserve?

## Proposed Changes
---
### Backend Enhancements
- **Add dependencies**: `mongoose`, `bcryptjs`, `cookie-parser`, `dotenv`, `cors` (already present).
- **Create `.env.example`** with `MONGO_URI=`, `JWT_SECRET=`, `PORT=5000`, `CLIENT_URL=`.
- **Add Mongoose connection** (`db.js`).
- **Create models**:
  - `User.js` – fields: name, email, phone, password, role (enum), profileImage, createdAt.
  - `Service.js` – name, category, description, basePrice, pricingType, image, provider (ref), createdAt.
  - `Booking.js` – customer (ref), provider (ref), service (ref), date, time, address, description, price, status, createdAt.
- **Auth routes** (`routes/auth.js`):
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
- **Middleware** (`middleware/auth.js`):
  - `requireAuth` – verify JWT from HTTP‑only cookie, attach `req.user`.
  - `requireRole(role)` – ensure correct role, return 403 otherwise.
- **Update `server.js`**:
  - Use `dotenv` and `cookie-parser`.
  - Connect to MongoDB.
  - Mount new auth routes and protect existing routes with middleware.
  - Remove old file‑based DB helpers.
- **Protected API routes** (`routes/customer.js`, `routes/provider.js`): implement stubs for the endpoints listed in the request, guarded by `requireAuth` and `requireRole`.
- **Error handling** – consistent JSON response `{ success, message, data? }`.

---
### Frontend Enhancements
- **Add Auth Context** (`src/context/AuthContext.jsx`): manage login state, fetch current user via `/api/auth/me`, store user in context, provide `login`, `logout`, `register` functions.
- **Create utility `api.js`** using `axios` with `withCredentials:true`.
- **Update Register & Login pages** (`src/pages/auth/Register.jsx`, `src/pages/auth/Login.jsx`):
  - Use Tailwind for modern styling.
  - Add client‑side validation (required fields, email, phone regex, password rules, password match, role selection).
  - Show toast notifications with success/error (using a lightweight library like `react-hot-toast` if already present, otherwise simple custom component).
  - Disable submit button while request is in flight.
- **ProtectedRoute component** (`src/components/ProtectedRoute.jsx`) – redirects unauthenticated users to `/auth/login`.
- **RoleProtectedRoute component** – checks `user.role` and redirects to appropriate dashboard if mismatch.
- **Create dashboards**:
  - `src/pages/customer/Dashboard.jsx`
  - `src/pages/provider/Dashboard.jsx`
  - Use existing service list UI, add cards, search bar, categories, etc., styled with Tailwind and modern UI patterns (glassmorphism, gradients).
- **Add logout button** that calls `/api/auth/logout` and clears context.
- **Update routing** (`src/App.jsx` or wherever router is defined) to include new routes and protect them.
- **CORS & Cookie handling** – ensure frontend requests send credentials.

---
### Miscellaneous
- **Update README** with setup instructions, required env vars, and start scripts.
- **Add scripts** in `package.json`:
  - `"backend": "node backend/server.js"`
  - `"dev": "concurrently \"npm run backend\" \"npm run dev:frontend\""` (if using Vite/CRA).
- **Run lint & format**.

## Verification Plan
### Automated Tests
- Run `npm install` in both `backend` and root (frontend) to ensure dependencies resolve.
- Start MongoDB (local or Atlas) using the URI from `.env.example`.
- Execute `npm run dev` and manually verify:
  1. Register both roles – success, duplicate email error.
  2. Login – JWT cookie set, redirects to correct dashboard.
  3. Access protected APIs – 401 when unauthenticated, 403 when wrong role.
  4. Logout clears cookie.
  5. Booking flow (create booking, provider accepts, status updates).
### Manual Verification
- Open browser, navigate through the full UI flows listed in the original request (tests 1‑11).
- Check network tab for HTTP‑only cookie presence.
- Refresh page – user stays logged in.

---
**Next Steps**
- Await your confirmation on the open questions and any preferences.
- Once approved, we will create the necessary files, install dependencies, and implement the plan.
