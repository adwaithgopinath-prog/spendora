# Spendora

Spendora is a modern personal spending assistant built with Next.js and React. It helps users decide whether a purchase is affordable based on a safe spending limit, current balance, and upcoming salary date.

## 🚀 What it does

- Displays a clean spending dashboard with:
  - Current balance
  - Safe-to-spend amount
  - Days until salary
- Lets users enter a purchase amount and receive an instant affordability verdict
- Shows remaining safe spending after a successful purchase
- Highlights overspending with clear guidance

## 🎯 Why it matters

Spendora is designed for users who want a fast, intuitive way to avoid impulse buying and stay within a budget before payday.

## 🧰 Tech stack

- Next.js 16
- React 19
- Tailwind CSS
- shadcn/ui components
- TypeScript

## 💻 Getting started

```bash
cd spendora
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## 📦 Available scripts

- `npm run dev` — start the development server
- `npm run build` — build the application for production
- `npm run start` — start the production server
- `npm run lint` — run ESLint checks

## 📁 Project structure

- `app/` — page and layout entrypoints
- `components/` — reusable UI components
- `public/` — static assets
- `styles/` — global styling
- `package.json` — dependencies and scripts

## 📝 Notes

This repository ships with a ready-to-run Spendora UI and budgeting logic. Customize the hardcoded user data in `src/app/page.tsx` to connect to real user accounts or budget services.
