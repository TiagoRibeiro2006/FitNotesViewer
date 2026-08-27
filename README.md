# FitNotes Viewer

A simple app for importing `.fitnotes` backups (SQLite) and browsing exercises by day.

## Stack

- Frontend: Vue 3 + Vite + JavaScript
- Backend: ASP.NET Core 8 Web API
- SQLite: Microsoft.Data.Sqlite

## Current version

- Single-page home screen.
- `.fitnotes` file upload.
- Imported workout data is stored only in the device/browser `localStorage`.
- The app always opens on the current day.
- `←` moves to the previous day and `→` moves to the next day.
- Shows only the exercises and number of sets for the selected day.
- Full dark theme with a fixed bottom navigation mockup.
- Bottom navigation currently contains non-functional Body, Calendar, Start, Charts and Settings items.
- Manifest uses `display: standalone` for a more app-like experience when added to the home screen.

## Privacy

The `.fitnotes` file is sent to the API only for reading, stored temporarily, opened in read-only mode and deleted afterwards. The server does not keep the backup. The copy of the imported data used by the interface stays only in the browser/app local storage.

## Run locally

### Backend

```bash
cd backend
dotnet restore
dotnet run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

By default, the frontend uses `http://localhost:5080` as the API. In production, define:

```env
VITE_API_URL=https://fitnotes-viewer-api.onrender.com
```

## Current deployment

- Frontend: Cloudflare Pages
- Backend: Render

After `git push`, the services connected to the repository can redeploy automatically.
