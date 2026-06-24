# CollabBoard — Multi-User Task Management System

A professional, real-time task management platform (mini Trello) built with **React** and **Firebase**.

---

## Features

### Authentication & Roles
- Email/password registration and login using Firebase Auth
- Session-based auth — user is auto-logged out when browser closes
- Two roles: **Admin** and **Member**
- First user to register becomes the initial Admin (bootstrap flow)
- Members can request admin access; admins approve/reject via notification bell

### Dashboard
- Overview of workspace stats: total tasks, completed, pending, teams, members
- Company Projects section — display-only cards showing project names and descriptions
- Admins can add/delete projects from the dashboard
- Recent Activity feed showing latest board creations

### Team Management (Admin Only)
- Create teams and assign members by searching name/empId
- Rename teams and add/remove members from team board
- Each team has its own Kanban task board

### Task Board (Kanban)
- Three columns: **To Do**, **In Progress**, **Done**
- Drag-and-drop tasks between columns
- Only admins can create and delete tasks
- Tasks have: title, description, assignee, due date, priority (High/Medium/Low)
- Manual assignment by employee ID (with autocomplete suggestions)
- Auto-assignment by role (least-loaded member gets the task)
- If all members of a role are busy → task is assigned to ALL of them as a team task

### 4-Step Progress Tracking (Members Only)
- **Accepted** → task stays in "To Do"
- **Working** → task moves to "In Progress"
- **In Review** → task stays in "In Progress"
- **Completed** → task moves to "Done"
- Only the assigned member(s) can update progress (forward or backward)
- Admins can see progress but members handle the updates

### Real-Time Chat
- **Team Chat** — group messaging per team
- **Direct Messages** — private 1-on-1 chat, search by empId or email
- Unread message count badges on each conversation
- Press Escape to close current conversation
- Members can only see teams they belong to

### Profile
- Profile picture upload (Firebase Storage)
- Edit name, age, employee ID, job role
- New users must complete their profile before accessing any page

### Admin Panel
- View all registered users with roles
- Promote/revoke admin access
- Notification bell with pending admin requests (approve/reject)
- Real-time user list updates

### Feedback System
- Bug reports, feature requests, general feedback
- Submissions saved to Firestore
- Email option with pre-filled mailto link

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Firebase (Auth, Firestore, Storage) |
| Styling | Inline CSS (each file has its own styles) |
| Real-time | Firestore onSnapshot listeners |
| Hosting | Any static host (Vercel, Netlify, Firebase Hosting) |

---

## Project Structure

```
src/
├── components/
│   ├── AuthenticatedLayout.jsx  — Sidebar + content wrapper
│   ├── BoardCard.jsx            — Project display card
│   ├── BoardColumn.jsx          — Kanban column
│   ├── Navbar.jsx               — Top navigation + notification bell
│   ├── RecentActivity.jsx       — Activity feed
│   ├── Sidebar.jsx              — App sidebar with navigation
│   ├── StatsCard.jsx            — Dashboard metric card
│   ├── TaskCard.jsx             — Task with progress stepper
│   └── TaskEditModal.jsx        — Edit task modal
├── context/
│   └── AuthContext.jsx          — Auth state management
├── firebase/
│   └── firebaseConfig.js        — Firebase initialization
├── pages/
│   ├── AdminPanel.jsx           — User management
│   ├── AdminRegister.jsx        — First admin setup
│   ├── Chat.jsx                 — Team + Direct messaging
│   ├── Dashboard.jsx            — Main dashboard
│   ├── Feedback.jsx             — Feedback/report form
│   ├── ForgotPassword.jsx       — Password reset
│   ├── Home.jsx                 — Landing page
│   ├── Login.jsx                — Sign in
│   ├── Profile.jsx              — User profile
│   ├── Register.jsx             — Sign up
│   ├── TeamDetails.jsx          — Team task board
│   └── Teams.jsx                — Team manager
├── routes/
│   ├── BootstrapAdminRoute.jsx  — First admin guard
│   └── ProtectedRoute.jsx       — Auth + profile guard
├── App.jsx                      — Route definitions
├── index.js                     — Entry point
└── index.css                    — Minimal reset only
```

---

## How to Get Admin Access

### First Admin (Initial Setup)
1. Open the app for the first time
2. On the Login page, click "Set up the first admin"
3. Fill in all details and create the account
4. You are now the first admin

### Subsequent Admins
**Option 1 — Admin promotes from panel:**
1. User registers as a normal member
2. Existing admin goes to Admin Panel
3. Types the user's email → clicks "Grant Admin"

**Option 2 — Member requests access:**
1. Member clicks "🔑 Request Admin Access" in the sidebar
2. Admin sees 🔔 notification bell with red badge
3. Admin clicks bell → sees the request → clicks "✓ Approve"

---

## How to Use

### As Admin
1. **Login** → lands on Dashboard
2. **Add Projects** — add company project names/descriptions (display only)
3. **Create Teams** — go to Team Manager, name the team, select members
4. **Assign Tasks** — open a team board, click "+ Add Task", set title/priority/assignee
5. **Monitor Progress** — see the 4-step progress bar on each task card
6. **Manage Users** — Admin Panel to promote/revoke roles
7. **Chat** — message teams or individual users directly

### As Member
1. **Register** → complete profile (required before accessing anything)
2. **View Tasks** — see tasks assigned to you on your team board
3. **Update Progress** — click "Working →", "In Review →", "Completed →"
4. **Chat** — message your team or DM colleagues
5. **Request Admin** — click the button in sidebar if you need elevated access
6. **Give Feedback** — use the Feedback page to report issues

---

## Firebase Setup

### Firestore Rules
Deploy the `firestore.rules` file from the project root.

### Storage Rules
Deploy the `storage.rules` file — enables profile picture uploads.

### Required Indexes
Create these composite indexes in Firebase Console → Firestore → Indexes:

1. **Collection:** `messages` → Fields: `teamId` (Asc), `createdAt` (Asc)
2. **Collection:** `directMessages` → Fields: `dmId` (Asc), `createdAt` (Asc)

---

## Running Locally

```bash
cd collabboard
npm install
npm start
```

Open http://localhost:3000

---

## Building for Production

```bash
npm run build
```

The `build/` folder is ready to deploy to any static hosting service.

---

## Security Rules Summary

| Collection | Create | Read | Update | Delete |
|-----------|--------|------|--------|--------|
| users | Own account | All signed in | Own (no role change) or Admin | Admin |
| boards | Admin | All signed in | Admin/creator | Admin |
| teams | Admin | All signed in | Admin/creator | Admin |
| teams/tasks | Admin | All signed in | Assignee or Admin | Assignee or Admin |
| messages | Own messages | All signed in | Own or Admin | Own or Admin |
| directMessages | Own messages | All signed in | Own | Own |
| adminRequests | Own request | Admin | Admin | Admin |
| feedback | Own feedback | Admin | Admin | Admin |

---

Built with React + Firebase | © 2026 CollabBoard
