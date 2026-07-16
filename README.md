# HireIA LMS

A production-ready Learning Management System built for training institutes: course delivery, assignments, timed MCQ tests, QR-verified certificates, and placement tracking — with separate admin and student experiences.

**Stack:** React + TypeScript + Vite + Tailwind CSS (frontend) · Node.js + Express (MVC) + MongoDB Atlas (backend) · JWT + bcrypt (auth) · Cloudinary (file storage)

---

## 1. Project Structure

```
hireia-lms/
├── backend/                  # Express API (MVC)
│   ├── config/                # DB + Cloudinary/multer config
│   ├── controllers/           # Business logic (one per module)
│   ├── models/                # Mongoose schemas
│   ├── routes/                # Express routers
│   ├── middleware/            # auth, error handling, validation
│   ├── utils/                 # email, certificate PDF/QR, tokens, seed script
│   ├── app.js                 # Express app (middleware + route wiring)
│   ├── server.js              # Entry point
│   └── .env.example
└── frontend/                  # React + TS + Vite SPA
    ├── src/
    │   ├── api/                # Axios instance + one service file per module
    │   ├── components/         # common/, layout/ (reusable UI)
    │   ├── context/            # AuthContext (JWT session state)
    │   ├── pages/               # auth/, admin/, student/
    │   ├── types/                # shared TypeScript interfaces
    │   └── App.tsx               # router + role-based route guards
    └── .env.example
```

## 2. Modules Implemented

| Module | Details |
|---|---|
| Admin & Student Auth | JWT + bcrypt, login/logout, forgot/reset password (emailed reset link), protected routes, role-based access control |
| Admin Dashboard | Live counts: students, courses, assignments pending grading, test attempts, certificates, placements |
| Student Dashboard | Enrolled courses + progress, pending assignments, upcoming tests, certificates, placement activity |
| Course Management | Create/edit/delete/publish courses, modules, enrollment, unenrollment |
| Video / Document Upload | Video, PDF, DOCX, PPT, ZIP, and rich-text Notes lessons — stored on Cloudinary |
| Assignment Management | Question file upload, student submission upload, grading, feedback, resubmission requests |
| Online MCQ Tests | Full MCQ authoring, per-attempt question randomization/subsetting, countdown timer with **auto-submit**, instant results with answer review |
| Certificate Generator | Server-rendered branded PDF certificates, embedded **QR code**, unique certificate ID, public no-auth verification page |
| Placement Dashboard | Company/role/salary/status tracking, offer letter upload, admin analytics (placement rate, avg/highest salary, top hiring companies) |
| Notifications | In-app dashboard alerts + templated email notifications (course publish, new assignment/test, grading, placement updates, admin broadcast) |

## 3. Backend Setup

```bash
cd backend
cp .env.example .env     # fill in MongoDB Atlas URI, JWT secrets, Cloudinary + SMTP creds
npm install
npm run seed              # creates the first admin account (see .env: SEED_ADMIN_EMAIL / PASSWORD)
npm run dev                # starts on http://localhost:5000
```

### Required environment variables (`backend/.env`)
See `backend/.env.example` for the full list: `MONGO_URI`, `JWT_SECRET`, `JWT_RESET_SECRET`, `CLOUDINARY_*`, `SMTP_*`, `CLIENT_URL`.

MongoDB Atlas: create a free cluster, add a database user, allowlist your IP (or `0.0.0.0/0` for development), and copy the connection string into `MONGO_URI`.

Cloudinary: create a free account, copy your Cloud Name / API Key / API Secret from the dashboard into the Cloudinary vars. All lesson videos/documents, assignment files, offer letters, and certificate PDFs are stored there.

SMTP: any SMTP provider works (Gmail App Password, SendGrid, Mailtrap for dev). If left blank, the app still functions — emails are skipped with a console warning instead of blocking the request.

## 4. Frontend Setup

```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                 # starts on http://localhost:5173
```

## 5. First Login

After running `npm run seed` in the backend, log in as admin using the credentials printed in your terminal (defaults: `admin@hireia.com` / `Admin@12345` unless overridden in `.env`). Change this password immediately from **Settings** after your first login.

Students can either self-register from the login screen ("Create a student account") or be created directly by an admin from the **Students** page.

## 6. Brand

- Primary: `#0B2A5B` (navy)
- Secondary: `#F57C00` (orange)

These are wired into `frontend/tailwind.config.js` as the `primary`/`secondary` color scales and reused in the certificate PDF generator and email templates for a consistent identity across the app, downloadable certificates, and notification emails.

## 7. Notes on Production Hardening

Already included: helmet, CORS lock to `CLIENT_URL`, rate limiting (global + stricter on auth endpoints), mongo-sanitize, bcrypt password hashing (cost 12), JWT expiry + password-change invalidation, centralized error handler with safe production messages, file-type/size validation on all uploads.

Before going live, additionally consider: HTTPS/TLS termination, moving JWT to httpOnly cookies only (already supported — the client also stores a copy in `localStorage` for the `Authorization` header, which you can drop if you prefer cookie-only auth), a process manager (PM2) or containerization, structured logging, and automated backups for MongoDB Atlas.
