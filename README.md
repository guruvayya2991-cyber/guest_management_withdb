# Unlimited Fun — Guest Timing Management

A real-time guest play-timing management web application for **Unlimited Fun**.

## Features

- **Guest Timing Dashboard**: Live guest status tracking (Active, Ending Soon, Time Over, Completed).
- **Time Extension & Mark Out**: Real-time duration extensions and manual checkout.
- **Audio & Browser Alerts**: Instant notification triggers when play time expires.
- **History & CSV Export**: Complete historical logs with date filtering and CSV export.
- **Daily Statistics**: Metrics on guest volume, average play duration, and extensions.
- **Role-Based Access**: Secure Supabase authentication with Admin and Staff roles.
- **Staff Management**: Admin dashboard to manage and promote staff members.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend & Auth**: Supabase (PostgreSQL, Realtime, Row Level Security, Auth)
- **Build Tool**: Vite

## Getting Started

### 1. Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Install & Run

```bash
npm install
npm run dev
```

### 3. Build

```bash
npm run build
```
