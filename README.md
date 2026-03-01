# Absensi - Sistem Absensi Siswa PWA

A mobile-first Progressive Web App for teacher-driven student attendance tracking. Built with Next.js, TypeScript, Tailwind CSS, and Neon PostgreSQL.

## Features

- **Teacher Auth** — Login with name + email, JWT session via HTTP-only cookies
- **Class Selection** — Grid-based class selection dashboard
- **Attendance Marking** — Mark students as Hadir/Izin/Sakit/Alpha with one-tap buttons
- **Bulk Save** — Save all attendance records in a single request
- **Same-Day Edit** — Edit attendance on the same day
- **Admin Dashboard** — Filter by date/class, view summary counts, export CSV
- **Offline-First** — PWA installable, offline queue syncs when back online
- **Mobile-First UI** — Sticky action bars, touch-friendly buttons, loading skeletons

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Neon Serverless
- **Auth**: JWT via `jose`
- **Deployment**: Vercel Serverless
- **PWA**: Service Worker + Web Manifest

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- A [Neon](https://neon.tech) PostgreSQL database

### 1. Clone & Install

```bash
git clone <repo-url>
cd absen
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
DATABASE_URL=postgresql://user:password@your-host.neon.tech/dbname?sslmode=require
JWT_SECRET=your-random-secret-key-here
```

### 3. Database Setup

In the Neon SQL Editor, run:

```sql
-- Run schema.sql first
-- Then run seed.sql for sample data
```

### 4. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## Neon Database Setup

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string from the dashboard
4. Run `schema.sql` in the SQL Editor
5. Run `seed.sql` for sample data
6. Paste the connection string into `.env.local` as `DATABASE_URL`

## Deploy to Vercel

1. Push code to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables:
   - `DATABASE_URL` — Neon connection string
   - `JWT_SECRET` — Random secret string
4. Deploy

## PWA Testing

1. Open the app in Chrome
2. Click the install icon in the address bar (or "Add to Home Screen" on mobile)
3. The app will install as a standalone PWA
4. Turn off WiFi to test offline mode
5. Mark attendance offline — data will sync when back online

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login with name + email |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Get current session |
| `GET` | `/api/classes` | List all classes |
| `POST` | `/api/classes` | Create a new class (authenticated) |
| `GET` | `/api/classes/:id/students?date=` | Students by class + attendance |
| `POST` | `/api/classes/:id/students` | Add student to class (authenticated) |
| `POST` | `/api/attendance` | Bulk upsert attendance |
| `GET` | `/api/attendance?date=&class_id=` | Query attendance |
| `GET` | `/api/attendance/export?date=&class_id=` | Export CSV |

### Example: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name": "Budi Santoso", "email": "budi@sekolah.id"}'
```

### Example: Save Attendance

```bash
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Cookie: absensi_session=<token>" \
  -d '{
    "records": [
      {"student_id": 1, "class_id": 1, "status": "hadir", "date": "2026-03-02"},
      {"student_id": 2, "class_id": 1, "status": "sakit", "date": "2026-03-02"}
    ]
  }'
```

### Example: Export CSV

```
GET /api/attendance/export?date=2026-03-02&class_id=1
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/login/route.ts
│   │   ├── auth/logout/route.ts
│   │   ├── auth/me/route.ts
│   │   ├── attendance/route.ts
│   │   ├── attendance/export/route.ts
│   │   └── classes/[id]/students/route.ts
│   ├── admin/page.tsx
│   ├── attendance/[classId]/page.tsx
│   ├── dashboard/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── LoadingSkeleton.tsx
│   ├── Navbar.tsx
│   ├── StatusButton.tsx
│   ├── StickyBar.tsx
│   ├── StudentCard.tsx
│   └── Toast.tsx
├── features/auth/session.ts
├── lib/
│   ├── api/offlineQueue.ts
│   ├── db/index.ts
│   └── validation/index.ts
├── proxy.ts
config/index.ts
types/index.ts
schema.sql
seed.sql
public/
├── icons/
├── manifest.json
├── offline.html
└── sw.js
```

## License

MIT
