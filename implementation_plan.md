# Goal Description

Create a modern, cozy web application for tracking daily goals and habits. The app will feature a dashboard with interactive habit tiles, an integrated tasks list, a calendar view, and a floating navigation bar. It will leverage Firebase for offline-first data persistence and eventually sync with Google Tasks and Calendar.

## Proposed Architecture & Features

### 1. UI/UX Aesthetic
*   **Vibe**: "Cozy and Modern" - Soft pastel or warm dark mode color palettes, rounded corners, and subtle shadows.
*   **Navigation**: A floating, pill-shaped navigation bar at the bottom or side of the screen containing: `Dashboard`, `Calendar`, and `You`.
*   **Animations**: `framer-motion` for spring animations when clicking tiles, smooth page transitions, and satisfying checkmark animations.

### 2. The Floating Navigation Bar Flow
*   **Dashboard**: The main hub. Contains Habit Tiles at the top, a Tasks section below it, and a mini Calendar widget at the bottom.
*   **Calendar**: A dedicated page for a larger view of the calendar, integrating both events and tasks on specific days.
*   **You (Profile)**: A settings page showing your profile picture, allowing you to toggle themes (Light/Dark/Cozy colors), manage account connections, and export data.

### 3. Core Features (MVP)
*   **Habit Dashboard**: A grid of tiles. Clicking a simple task marks it complete. Clicking a time-based task allows you to input duration.
*   **Tasks Section**: Displays tasks (eventually synced from Google). Includes a quick input to "Add a Task".
*   **Calendar Section**: Displays a timeline or month grid with indicator dots for events/tasks. Includes an "Add Event" button.
*   **Habit Manager**: A page to add/edit/delete habits, set custom icons (Lucide), and colors.

## Recommendations for Additional Features
Since you asked for ideas to add, here are some recommendations that fit the "cozy" vibe perfectly:
1.  **Focus Timer**: For duration-based habits (e.g., "Study Math"), instead of just inputting the time, clicking the tile opens a beautiful, minimal Pomodoro timer.
2.  **Habit Streaks**: Show a small flame or star icon with a number on habits you've completed multiple days in a row.
3.  **Micro-Interactions**: Subtle sound effects (like a soft pop or chime) and confetti when completing all daily habits.

## Technical Stack
*   **Frontend**: React (Vite) + JavaScript
*   **Styling**: Vanilla CSS + Tailwind CSS for layout.
*   **Icons**: Lucide React
*   **Backend/Auth**: Firebase with Offline Persistence enabled.

## Verification Plan

### Phased Implementation Strategy

**Phase 1: The "Cozy UI" Foundation (Mock Data)**
*Goal: Build the look and feel so you can interact with the app, using dummy data.*
1.  Initialize Vite React app with Tailwind CSS and Framer Motion.
2.  Build the Floating Navigation Bar.
3.  Build the Dashboard UI (Habit Tiles, mock Tasks list, mock Calendar widget).
4.  Build the 'Manage Habits' and 'You' UI shells.

**Phase 2: Local Persistence & Logic**
*Goal: Make the habit tracking actually save your progress.*
1.  Integrate Firebase with Offline Persistence.
2.  Wire up the Habit Tiles and Manage Habits page so you can create real habits and check them off (saving locally/to Firebase).

**Phase 3: The Google Ecosystem**
*Goal: Bring in your real life.*
1.  Integrate Google Auth in the 'You' tab.
2.  Fetch Google Tasks and replace the mock tasks on the dashboard. Add the ability to create tasks that sync to Google.
3.  Fetch Google Calendar Events and populate the calendar widget.

**Phase 4: Polish & Export**
1.  Build the Theme Switcher.
2.  Implement the Google Sheets export functionality.
3.  Add the Focus Timer or Streak features if desired.
