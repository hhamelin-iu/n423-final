# LOREBoards — N423 Final

Game completion tracker built from my approved proposal: a colorful, responsive leaderboard where players log their finished games, high scores, and personal notes. The app mirrors the prototype’s layout, typography, and color gradients while providing full Firebase-backed CRUD, IGDB search integration, and profile management. For evaluation and offline development, it also includes a zero-config client-side simulation engine.

## Live Deployment
- [LOREBoards Demonstration Deployment](https://loreboards.projects.havenhamelin.work) — *Hosted live preview showcasing the application features and demonstration mode.*

## Key Features

- **Game Completion Logging**: Log finished games with completion types (progress percentage or high score), platform specifications, launch years, developer tags, and personal review notes.
- **IGDB Metadata Integration**: Auto-fills game metadata and official cover art via a lightweight IGDB proxy server, with manual entry fallbacks for unreleased or custom titles.
- **Interactive Feed & Search**: Live-updating activity feed with animated cards, platform badges, and player avatars; multi-field filtering on `/search` by query text, username, game ID, platform, and sorting options.
- **Full CRUD Coverage**: Comprehensive Create, Read, Update, and Delete operations for user submissions and profiles.
- **Custom Native Alert System**: Lightweight `AlertContext` replacement for heavy external alert libraries, rendering native-feeling, responsive confirmation modals.
- **Responsive Web & Mobile Layout**: Desktop sticky top navigation bar with integrated search and user profile dropdown; mobile drawer header with streamlined footer navigation.

---

## Technical Highlight: Zero-Config Demo & Simulation Engine

To enable instant evaluation, grading, and offline development without requiring reviewers to configure Firebase credentials, LOREBoards incorporates a client-side fallback simulation engine within `src/services/dataService.js`:

- **Automatic Backend Fallback**: When `EXPO_PUBLIC_FIREBASE_API_KEY` is unconfigured, the app automatically detects the missing backend state and initializes a mock session (`DEMO_USER`).
- **Background Activity Generation**: A client-side generator loop periodically dispatches simulated game completion entries (every 3–6 seconds) to demonstrate live feed capabilities and card rendering.
- **Cross-Tab Synchronization & Leader Lock**: Uses the browser `BroadcastChannel` API (`loreboards_demo_sync`) and a `localStorage` leadership lock (`acquireLeadershipLock`) so multiple open browser tabs synchronize simulated events seamlessly without duplicate triggers.
- **Client-Side CRUD Persistence**: Local storage state handlers persist user edits, new submissions, and profile changes in `localStorage`, maintaining complete CRUD parity with the live Firestore data model.

---

## CRUD Coverage

- **Create**: `/submit` form posts game entries with IGDB metadata or custom manual cover uploads to Firestore (`submissions` collection) or local demo storage.
- **Read**: The main feed (`/`) streams live activity using real-time Firestore `onSnapshot` listeners (or local state in Demo Mode). `/search` queries and filters dataset entries dynamically.
- **Update**: Selecting "Edit" on a user-owned card opens `/submit?edit=<submissionId>` prefilling form fields for modifications.
- **Delete**: Owner-restricted "Delete" trigger prompts confirmation via custom modal before removing the target record.

---

## Tech & Architecture

- **UI Framework**: Expo Router + React Native Web with custom linear gradients, card micro-animations, and custom font integration (Lexend Zetta & Noto Sans).
- **State & Data Abstraction**: `src/services/dataService.js` presents a uniform API interface, transparently switching between Firestore snapshots and local simulation state based on environment setup.
- **Authentication**: `src/auth/AuthContext.js` handles Firebase Auth state listeners with graceful demo fallback handling.
- **Custom UI Contexts**: `src/context/AlertContext.jsx` manages custom modal dialogs.
- **IGDB Proxy**: `api/local-igdb-server.js` proxies IGDB API requests to handle CORS headers and token rotation (`npm run dev` starts the proxy and Expo Web concurrently via `scripts/dev.js`).
- **Image Optimization**: `expo-image-picker` and `expo-image-manipulator` compress profile photo uploads into data URLs directly stored within profile documents.

### Firestore / Local Data Schemas

- **`profiles`**: `{ displayName, username, email, photoData }` (base64 encoded avatar data).
- **`games`**: `{ title, titleLower, year, developer, platform, platforms[], releases[], imageUrl, igdbId, source, manual, createdAt, updatedAt }`.
- **`submissions`**: `{ gameId, userId, title, year, developer, platform, imageUrl, igdbId, completionType, completionValue, playerNotes, source, manual, createdAt, updatedAt }`.

---

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Running `npm run dev` or `npm run web` without `.env.local` instantly launches the app in **Demo / Developer Preview Mode**.

To connect to a live **Firebase & IGDB backend**, create `.env.local` in the project root:
```env
API_PORT=3000
EXPO_PUBLIC_API_BASE_URL=http://localhost
EXPO_PUBLIC_FIREBASE_API_KEY=<your_firebase_key>
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_auth_domain>
EXPO_PUBLIC_FIREBASE_PROJECT_ID=<your_project_id>
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_storage_bucket>
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
EXPO_PUBLIC_FIREBASE_APP_ID=<your_app_id>
IGDB_CLIENT_ID=<your_igdb_client_id>
IGDB_CLIENT_SECRET=<your_igdb_client_secret>
```

### 3. Run Development Server
```bash
# Starts IGDB local proxy server and Expo Web simultaneously
npm run dev
```
- IGDB proxy available at `http://localhost:3000/api/igdb/{games,platforms}`.
- Web UI launches automatically at the Metro dev server URL (e.g., `http://localhost:8081`).
- Alternatively, run standalone web UI only:
```bash
npm run web
```

---

## Deployment Notes

- **Static Asset Build**: Built using `npx expo export --platform web`. `public/_routes.json` and `scripts/fix-dist-fonts.js` configure static asset routing and web font loading for Cloudflare Pages.
- **Serverless API Proxy**: In production serverless environments (e.g. Cloudflare Pages Functions), route `/api/igdb/*` requests to serverless API functions (`functions/api/igdb/*`).
- **Firebase Security Rules**: Ensure Firestore rules allow read/write access to `profiles`, `games`, and `submissions` collections for authenticated users.

---

## How to Use

1. **Launch App**: Open the home page (`/`) to view recent completions on the leaderboard feed.
2. **Log a Completion**: Navigate to `/submit`. Search for any video game using IGDB auto-complete or select "Manual Game Entry". Lock in game details, upload or auto-fill artwork, choose completion type (Progress % or High Score), add notes, and submit.
3. **Explore & Filter**: Visit `/search` or use the header search bar to filter entries by title, platform, username, or sort order.
4. **Manage Entries**: Click "Edit" or "Delete" on cards you created to update or remove your logged completions.
