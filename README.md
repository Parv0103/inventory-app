# Stockroom — Inventory Management (React + Vite + Tailwind)

Mobile-first, offline-first inventory app: items, stock in/out, reports, Excel/PDF export, dark mode, PWA, PIN lock, CSV import, JSON backup.

## Run
    npm install
    npm run dev        # http://localhost:5173
    npm run build      # production build in dist/
    npm run preview

## Structure
    src/components  Nav (bottom bar / sidebar), Modal, Field, BarChart, LockScreen
    src/pages       Dashboard, Inventory, Transactions, Reports, Settings
    src/hooks       useStore.jsx  (Context + useReducer, persisted to IndexedDB)
    src/services    db.js (IndexedDB wrapper), export.js (xlsx / jsPDF, lazy-loaded)
    src/utils       format.js (dates, money, CSV parser, PIN hash)
    public          manifest.webmanifest, sw.js, icons

## Data model (all IDs are UUIDs, all records timestamped)
- Item: id, name, category, unit, price, supplier, notes, minStock, quantity, createdAt, updatedAt
- Transaction: id, itemId, type (IN|OUT), qty, at (ISO), remarks, createdAt
- Stock quantity changes only through transactions (opening stock is recorded as an IN); OUT cannot exceed stock.

## Deploy (static hosting, relative base path)
Netlify / Vercel / Cloudflare Pages: build command `npm run build`, output `dist`.
GitHub Pages: publish the `dist` folder. HTTPS is required for PWA install and the service worker.

## CSV import columns
name (required), category, quantity, unit, price, supplier, notes, minStock
