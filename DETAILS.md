# FitNotesViewer — Technical Details

## Why it is a website

FitNotesViewer was designed primarily for iPhone and iOS users. Publishing a native iOS application through the App Store requires a paid Apple developer membership and adds an app-review and distribution process. A web app is therefore the most practical way to keep FitNotesViewer free, easy to access and simple to update.

The website behaves like an installable app through Progressive Web App features. It can be added to the home screen, opens in its own standalone window and, after the required files have been loaded once, continues working without an internet connection.

FitNotesViewer does not require user accounts or a remote database. Training data stays on the user's device and is stored with IndexedDB, the browser's local structured storage.

This approach also allows the same application to work on Android and desktop browsers without maintaining separate native versions.

## Main technologies

| Technology | Purpose |
| --- | --- |
| JavaScript | Application logic, data processing, import/export and local analysis. |
| Vue 3 | Component-based user interface and reactive state. |
| HTML templates | Structure of each Vue screen and component. |
| CSS | Custom mobile-first design, layout, animations and responsive behaviour. |
| Vite | Local development server and production build tool. |
| IndexedDB | Private on-device storage for workouts, exercises, measurements and settings. |
| sql.js and WebAssembly | Reading and updating SQLite-based `.fitnotes` backups directly in the browser. |
| Service Worker | Offline caching and automatic delivery of new app versions. |
| Web App Manifest | Home-screen installation and standalone app behaviour. |
| Node.js test runner | Automated tests for import, export and data-processing behaviour. |

The project deliberately avoids a large UI framework. Its interface is built with Vue components and custom CSS so that the design stays lightweight and consistent with the simple FitNotes experience.

## Application structure

```text
FitNotesViewer/
├── docs/
│   └── images/        # Images used in the project documentation
├── public/
│   └── icons/         # App icons and static installable-app files
├── src/               # Application source code
├── tests/             # Automated tests and fixtures
├── index.html
├── package.json
└── vite.config.js
```

Inside `src`, the code is separated by responsibility:

- `src/app` starts the application, controls the main navigation and background services.
- `src/features` contains user-facing areas such as Body, Calendar, Log, Charts and Settings.
- `src/data` owns IndexedDB access, repositories, default catalogues and data mapping.
- `src/fitnotes` reads, validates, imports, updates and exports `.fitnotes` and `.csv` files.
- `src/ai` contains the local training, body-weight and chatbot analysis engines.
- `src/shared` contains reusable components, models and utilities.
- `src/styles` contains shared visual rules used throughout the app.

Vue components focus on presentation and interaction, while repositories and small service functions handle storage and domain operations. This keeps individual files easier to understand and change.

## Local data and privacy

All imported and newly created information is stored in IndexedDB on the current device. This includes:

- workout dates, exercises and sets;
- weights, repetitions, distance and duration;
- muscles and exercise catalogues;
- body measurements and their history;
- locally generated analysis and AI chat history;
- app metadata and the original backup when available.

The app does not require authentication, analytics tracking or an external API. Deleting the app's browser data also removes its local information, so regular `.fitnotes` or `.csv` exports are recommended as backups.

## FitNotes file support

### `.fitnotes`

A FitNotes backup is a SQLite database. FitNotesViewer loads it in memory using `sql.js`, maps the known FitNotes tables into its local data model and closes the in-memory database after the import is complete. No backup is uploaded anywhere.

When the original SQLite backup is available, the app can synchronise local workout changes and export a new `.fitnotes` file.

### `.csv`

The project contains its own CSV reader and writer. It supports FitNotes exports from iOS and Android, including different delimiters, date formats, weight units and quoted text. CSV exports are generated from the current local workout data and can be opened in spreadsheet applications.

## Offline support

Vite generates a versioned service worker during the production build. It stores the application shell, JavaScript, CSS, icons and SQLite WebAssembly file in the browser cache. Navigation uses the network when it is available and falls back to the cached app when it is not.

The first visit still requires a connection to download the website. After that initial load, normal use, data editing, charts, import/export and local analysis can work offline.

## How the AI works

The AI features run entirely on the device and do not use an external LLM, cloud model or machine-learning service. They are deterministic JavaScript analysis engines: the same input always produces the same result.

### Training analysis

The training engine calculates metrics such as:

- workout and muscle frequency;
- sets per muscle and their distribution;
- upper- and lower-body balance;
- exercise and set consistency;
- training volume and progress;
- activity across a selected date range.

Those metrics are scored and converted into ratings, category details and readable feedback. The analysis explains what stands out and points to possible improvements without sending the workout history away from the device.

### Body-weight analysis

The body engine evaluates the user's weight trend within a selected period and interprets it according to the chosen goal: cutting, maintenance or bulking.

### Training chatbot

The chatbot uses local tokenisation, intent classification, entity matching and calculated training statistics. It can recognise supported questions about workouts, muscles, exercises, volume, frequency and progress, then build a response from the user's own data. It is intentionally limited to the training information that the app can verify.

## Development and verification

Run the development commands from the project root:

```text
npm install
npm run dev
npm test
npm run build
```

`npm run dev` starts the local development version, `npm test` runs the automated tests and `npm run build` creates the static production files. Because the result is entirely static, it can be hosted on services such as Cloudflare Pages without running an application server.
