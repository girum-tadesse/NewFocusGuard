# FocusGuard Application Requirements

## 1. Introduction

FocusGuard is a mobile application for Android designed to help users manage their screen time and improve focus by providing tools to lock and schedule access to selected applications. A key feature is a system-managed secret PIN, unknown to the user, to enforce these locks.

## 2. User Authentication & Profile

*   **R2.1:** Users must be able to create an account and log in to the application.
    *   **R2.1.1:** Authentication will be handled using Firebase Authentication (e.g., email/password, Google Sign-In).
*   **R2.2:** Each user will have a profile storing app-specific settings.
    *   **R2.2.1:** Profile data (e.g., emergency unlock chances) will be stored in Firebase Firestore.

## 3. Core Locking Functionality

### 3.1. App Discovery & Selection

*   **R3.1.1:** The application must be able to list all user-installed applications on the Android device (excluding system applications).
*   **R3.1.2:** The listing should display the application name and its icon.
*   **R3.1.3:** Users must be able to select one or more applications from the list to be targeted for locking or scheduling.
*   **R3.1.4:** A search functionality should allow users to easily find specific applications in the list.

### 3.2. "LOCK NOW" Feature

*   **R3.2.1:** Users must be able to initiate an immediate lock for selected applications.
*   **R3.2.2:** Users must be able to define a duration for the "LOCK NOW" session.
*   **R3.2.3:** Once activated, selected applications will be made inaccessible to the user for the defined duration.
*   **R3.2.4:** The locking mechanism will be enforced by the application without requiring a user-enterable PIN.
*   **R3.2.5:** When a locked app is attempted to be opened, an overlay screen will be displayed.
    *   **R3.2.5.1:** The overlay will display a motivational quote.
    *   **R3.2.5.2:** The overlay will display the number of remaining emergency unlock chances for the week.
    *   **R3.2.5.3:** The overlay will provide an "Emergency Unlock" button.
    *   **R3.2.5.4 (Optional):** The overlay may display the remaining time for the current lock.
*   **R3.2.6:** Locked applications will automatically become accessible once the lock duration expires.

### 3.3. "SCHEDULE" Feature

*   **R3.3.1:** Users must be able to schedule locks for selected applications for future dates and times.
*   **R3.3.2:** Scheduling options should allow for:
    *   Specific start date and time.
    *   Specific end date and time or a duration.
    *   Recurring schedules (e.g., daily, specific days of the week - e.g., every Monday from 3 PM to 9 PM).
*   **R3.3.3:** Scheduled locks will activate automatically at the specified time(s) and enforce the lock as per R3.2.3 - R3.2.5.
*   **R3.3.4:** Users must be able to view, modify, and delete existing schedules.

### 3.4. Emergency Unlock

*   **R3.4.1:** Users will be provided with a limited number of emergency unlock chances per week (e.g., 3 chances).
*   **R3.4.2:** Using an emergency unlock chance will immediately make the currently locked application(s) accessible, bypassing the current lock session.
*   **R3.4.3:** The count of available emergency unlock chances will be reset weekly (e.g., every Monday at midnight).

## 4. Secret PIN & Lock Enforcement (System Managed)

*   **R4.1:** The core locking mechanism will be underpinned by a secret identifier/key unique to the user, managed by the backend (Firebase Cloud Functions & Firestore).
*   **R4.2:** This secret identifier will NOT be accessible or known to the user.
*   **R4.3:** Client-side locking actions (displaying overlay, blocking app access) will be authorized by server-side logic (Cloud Functions) to maintain integrity.

## 5. Screens & Navigation

*   **R5.1:** The application will have the following primary screens/sections:
    *   **R5.1.1: APPS Screen:** For discovering, selecting, and initiating "LOCK NOW" or navigating to scheduling for apps.
    *   **R5.1.2: LOCKED Screen:** To display currently active locks (details TBD - perhaps showing apps currently under a "LOCK NOW" or active scheduled lock and their remaining time).
    *   **R5.1.3: SCHEDULED Screen:** To display and manage all upcoming and recurring lock schedules.
    *   **R5.1.4: ANALYTICS Screen:** To provide users with insights into their app usage and locking patterns (details TBD).
    *   **R5.1.5: SETTINGS Screen:** For user account management, app preferences, help/support (details TBD).
*   **R5.2:** Intuitive navigation (e.g., bottom tab bar) will be provided to switch between these screens.

## 6. Non-Functional Requirements

*   **R6.1: Performance:** The app should be responsive. Listing apps and initiating locks should be quick.
*   **R6.2: Reliability:** The locking mechanism must be reliable. Scheduled locks must activate on time, and apps must unlock as expected upon duration expiry or emergency unlock.
*   **R6.3: Security:**
    *   User authentication data must be handled securely via Firebase Auth.
    *   The server-managed secret identifier must be protected from unauthorized client access via Firestore Security Rules and Cloud Function logic.
*   **R6.4: Battery Efficiency:** The app, especially its background services (if any, for scheduled locks) and overlay mechanism, should be optimized to minimize battery drain.
*   **R6.5: User Experience (UX):**
    *   The app should have a clean, intuitive, and user-friendly interface.
    *   Onboarding should clearly explain the app's purpose, features, and any required permissions (especially Accessibility Services for the overlay).
*   **R6.6: Platform:** Android.

## 7. Technical Stack

*   **R7.1: Frontend:** React Native (with Expo framework).
*   **R7.2: Backend & Database:** Firebase (Authentication, Firestore, Cloud Functions).
*   **R7.3: App Locking Mechanism:** Android native module utilizing an overlay approach; may require Accessibility Services.

## 8. Future Considerations (Out of Scope for Initial MVP but noted)

*   **F8.1:** More advanced analytics and reporting.
*   **F8.2:** Different levels of lock strictness.
*   **F8.3:** Support for group locking (e.g., "Social Media Apps").
*   **F8.4:** Cross-platform support (iOS) - This would require a different approach for the locking mechanism.
*   **F8.5:** Customizable motivational quote categories or user-added quotes.

--- 