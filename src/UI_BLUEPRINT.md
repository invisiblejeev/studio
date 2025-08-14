# Indian Community Chat App - UI Blueprint

This document outlines the user interface design, layout, and user flow for the Indian Community Chat App.

## 1. Core Design Principles

-   **Mobile-First:** The UI is designed primarily for mobile devices, with a clean, touch-friendly interface.
-   **Minimalist:** A simple and intuitive design that prioritizes content and ease of use.
-   **Consistent:** Uses ShadCN UI components and a consistent color scheme (defined in `globals.css`) to maintain a cohesive look and feel across all screens.

---

## 2. Authentication Flow

### 2.1. Login Screen (`/`)

-   **Layout:** A single centered card on a plain background.
-   **Components:**
    -   **Card Title:** "Indian Community Chat"
    -   **Card Description:** "Enter your credentials to access your account."
    -   **Email Input:** A standard text field for the user's email.
    -   **Password Input:** A password field with a "Forgot password?" link.
    -   **Login Button:** A primary button to submit the form.
    -   **Sign-up Link:** A link navigating to the signup page.
-   **Functionality:**
    -   Validates user credentials against Firebase Auth.
    -   Shows error toasts for failures (e.g., "Invalid email or password").
    -   Redirects to the main chat screen upon successful login.

### 2.2. Signup Screen (`/signup`)

-   **Layout:** A single centered card, similar to the login screen.
-   **Components:**
    -   Input fields for First Name, Last Name, Username, Email, Phone, City, and State (dropdown).
    -   Password field with a show/hide toggle.
    -   Real-time validation feedback for username and email availability (checking, available, taken).
    -   A primary "Sign Up" button.
    -   A link to navigate back to the login page.
-   **Functionality:**
    -   Creates a new user in Firebase Auth.
    -   Creates a corresponding user profile document in Firestore.
    -   Redirects to the login page upon successful signup.

---

## 3. Main Application Interface

A mobile-friendly layout with a persistent bottom navigation bar for primary navigation.

### 3.1. Bottom Navigation (`<BottomNav />`)

-   **Layout:** A fixed bar at the bottom of the screen on main pages.
-   **Icons (from left to right):**
    1.  **Chat** (`MessageSquare`): Navigates to `/chat`.
    2.  **Requirements** (`Tag`): Navigates to `/requirements`.
    3.  **Offers** (`Bell`): Navigates to `/offers`.
    4.  **Profile** (`User`): Navigates to `/profile`.
    5.  **Admin** (`Shield`): (Visible only to admins) Navigates to `/admin`.
-   **Behavior:** The active icon and label are highlighted with the primary color.

### 3.2. Public Chat Screen (`/chat/[state]`)

-   **Layout:** A full-height view with a fixed header, a scrollable message area, and a fixed input footer.
-   **Header:**
    -   Displays the state name (e.g., "California Community").
    -   Shows the number of members in that state's chat.
    -   A "Personal Chats" button to navigate to the private chat list.
-   **Message Area:**
    -   Displays messages in sequence.
    -   User's own messages are right-aligned with a primary background color.
    -   Other users' messages are left-aligned, showing their avatar and name.
    -   Avatars and names are clickable to open the user's profile dialog.
    -   Images are displayed as clickable thumbnails.
-   **Input Footer:**
    -   A multiline textarea for typing messages.
    -   A paperclip icon to attach images.
    -   A "Send" button.

### 3.3. Personal Chats List (`/chat/personal`)

-   **Layout:** A list view.
-   **Header:** A back arrow and the title "Personal Chats".
-   **Content:**
    -   A list of all personal conversations.
    -   Each list item shows the other user's avatar, username, the last message sent, and the time.
    -   If there are no chats, a message "No personal chats yet." is displayed.

### 3.4. Personal Chat View (`/chat/user/[userId]`)

-   **Layout:** Identical to the public chat screen (fixed header, scrollable messages, fixed input).
-   **Header:**
    -   A back arrow.
    -   The other user's avatar and username, which are clickable to open their profile.
-   **Functionality:** The same as the public chat but for a one-on-one conversation.

---

## 4. Feature Screens

### 4.1. Requirements Screen (`/requirements`)

-   **Layout:** A feed of requirement cards presented in a table.
-   **Header:** Title and description.
-   **Filtering:** A horizontal scrolling list of category buttons (All, Jobs, Housing, etc.) to filter the list.
-   **Requirement Item (Table Row):**
    -   Displays a category icon, title, description, user name, and state.
    -   Includes a "Send Private Message" button linking to the user's chat.
    -   For admins, shows "Edit" and "Delete" buttons.
-   **Floating Action Button (FAB):**
    - A `+` button opens a dialog for any user to add a new requirement manually.

### 4.2. Offers Screen (`/offers`)

-   **Layout:** A grid of offer cards.
-   **Offer Card:**
    -   An image carousel for multiple offer images.
    -   Displays the offer title, description, coupon code, and validity date.
    -   For admins, "Edit" and "Delete" buttons are shown.
    -   For regular users, a "View Deal" button is shown.
-   **Floating Action Button (FAB):**
    -   **Admins:** A `+` button to open a dialog for adding a new offer.
    -   **Users:** A `Megaphone` button to open a dialog with instructions on how to contact an admin to post an offer.

### 4.3. Profile Screen (`/profile`)

-   **Layout:** A settings-style page with information grouped into cards.
-   **Header Section:**
    -   A large, clickable user avatar that opens a dialog to upload/delete the profile picture.
    -   User's full name and username.
-   **Profile Information Card:**
    -   Displays user details (First Name, Last Name, Email, etc.).
    -   An "Edit" (pencil) icon allows all fields to be edited in place. In edit mode, "Save" and "Cancel" icons appear.
-   **Settings Card:**
    -   Navigation links for "Notifications" and "Privacy & Security".
    -   A "Delete Account" option (opens a confirmation dialog).
    -   A "Logout" button.

---

## 5. Admin Dashboard (`/admin`)

-   **Layout:** A single-column layout with a card for the spam log.
-   **Header:** "Admin Dashboard" title and a shield icon.
-   **Spam Log Card:** A table showing recently detected spam messages, including the message text, reason, chat location, and user.
