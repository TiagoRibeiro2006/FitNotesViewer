<p align="center">
  <img src="public/icons/icon-192.png" width="96" height="96" alt="FitNotesViewer icon">
</p>

<h1 align="center">FitNotesViewer</h1>

<p align="center">
  <a href="https://fitnotesviewer.pages.dev">fitnotesviewer.pages.dev</a>
</p>

<p align="center">
  A free and open-source alternative to FitNotes, built for people who want a simple workout tracker with more ways to understand their progress.
</p>

FitNotesViewer is an alternative for FitNotes users on iOS and an interesting choice for Android users who enjoy its straightforward approach. Existing users can bring their training history with them by importing a `.fitnotes` backup or `.csv` export.

## Familiar simplicity, improved

The interface keeps the simplicity of the other FitNotes versions while adding a cleaner view of your training and body data.

<p align="center">
  <img src="docs/images/workout-log.png" width="46%" alt="FitNotesViewer workout log">
  <img src="docs/images/training-charts.png" width="46%" alt="FitNotesViewer training charts">
</p>

<p align="center">
  <sub>Workout logging · Training charts</sub>
</p>

- **Body** — track body weight and other measurements over time.
- **Calendar** — quickly find every day with a recorded workout.
- **Log** — add, edit, copy and organise exercises and sets.
- **Charts** — explore progress, training volume and muscle distribution.

## Your data, your choice

Import data from FitNotes on iOS or Android and export it again as a `.fitnotes` or `.csv` file whenever you need it. Your information stays on your device, allowing the app to continue working without an internet connection.

FitNotesViewer is an independent project and is not affiliated with FitNotes.

### Automatic backups

In **Settings → Data & backups**, compatible browsers can save backups to a folder you select. Enable **Automatic backups**, choose a folder, and select an interval from 1 to 30 days. The app checks when it opens or returns to the foreground; it does not run a scheduled task while closed. Enabling the feature creates the first backup immediately when data is available.

**Keep only the latest backup** removes previously tracked automatic backups in the selected folder only after the new file is saved and its contents verified. Other files and manually exported backups are left alone. Changing folders leaves the old folder untouched and starts a new backup history.

An imported `.fitnotes` source enables complete `.fitnotes` backups; otherwise the app saves its extended CSV export with training and body data. Folder access requires HTTPS (or localhost), a browser with writable folder selection, and permission from the user. Some mobile browsers do not support it. If permission expires, select the folder again in settings. The settings show the last successful backup and any error.

---

<p align="center">
  <sub>Want to know how it works? Read the <a href="DETAILS.md">technical details</a>.</sub>
</p>
