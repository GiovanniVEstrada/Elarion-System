# Ion API

A personal analytics REST API built with Node.js, Express, and MongoDB. Ion API tracks tasks, journal entries, habits, and mood — then derives insights from the data across all four resources.

## Tech Stack

- **Runtime** — Node.js
- **Framework** — Express 5
- **Database** — MongoDB via Mongoose 9
- **Auth** — JWT + bcryptjs
- **Environment** — dotenv

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas cluster (or local MongoDB instance)

### Installation

```bash
git clone https://github.com/GiovanniVEstrada/ion-api.git
cd ion-api
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

### Run

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server starts on `http://localhost:5000`.

---

## Authentication

All resource endpoints require a Bearer token. Obtain one by registering or logging in.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Log in, receive JWT |
| GET | `/api/auth/me` | Get current user (protected) |

**Request body for register/login:**
```json
{
  "name": "Giovanni",
  "email": "gio@example.com",
  "password": "secret123"
}
```

**Response:**
```json
{
  "_id": "...",
  "name": "Giovanni",
  "email": "gio@example.com",
  "token": "<jwt>"
}
```

**Using the token:**
```
Authorization: Bearer <token>
```

---

## Endpoints

All routes below require `Authorization: Bearer <token>`.

List endpoints support `?page=1&limit=10` for pagination. Responses are shaped as:
```json
{
  "data": [...],
  "pagination": { "total": 42, "page": 1, "limit": 10, "totalPages": 5 }
}
```

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

**Query params:** `?completed=true`, `?priority=high`, `?sort=dueDate`

**Task object:**
```json
{
  "title": "Build journal routes",
  "priority": "high",
  "category": "coding",
  "dueDate": "2026-05-01",
  "completed": false
}
```

---

### Journal

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journal` | Get all entries |
| POST | `/api/journal` | Create an entry |
| GET | `/api/journal/:id` | Get a single entry |
| PATCH | `/api/journal/:id` | Update an entry |
| DELETE | `/api/journal/:id` | Delete an entry |

**Query params:** `?mood=great`, `?tag=growth`

**Journal entry object:**
```json
{
  "title": "Day one",
  "content": "Started Ion API today.",
  "mood": "great",
  "tags": ["coding", "progress"]
}
```

`mood` — `great | good | neutral | bad | awful`

---

### Habits

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits` | Get all habits |
| POST | `/api/habits` | Create a habit |
| PATCH | `/api/habits/:id` | Update a habit |
| DELETE | `/api/habits/:id` | Delete a habit |
| POST | `/api/habits/:id/complete` | Mark habit complete for today |

**Query params:** `?active=true`, `?frequency=daily`

**Habit object:**
```json
{
  "name": "Morning pages",
  "description": "Write 3 pages every morning",
  "frequency": "daily"
}
```

`frequency` — `daily | weekly`

Calling `complete` twice on the same day returns `400 "Habit already completed today"`.

---

### Moods

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/moods` | Get all mood entries |
| POST | `/api/moods` | Log a mood |
| PATCH | `/api/moods/:id` | Update a mood entry |
| DELETE | `/api/moods/:id` | Delete a mood entry |

**Query params:** `?mood=bad`, `?sort=date`

**Mood entry object:**
```json
{
  "mood": "good",
  "note": "Productive day.",
  "date": "2026-04-16"
}
```

`mood` — `great | good | neutral | bad | awful`

`date` defaults to today if omitted.

---

### Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights/overview` | Counts across all resources |
| GET | `/api/insights/productivity` | Task completion stats |
| GET | `/api/insights/streaks` | Habit streaks per habit |
| GET | `/api/insights/journal-frequency` | Entry counts + most common mood |
| GET | `/api/insights/habit-consistency` | Completion rate per habit |
| GET | `/api/insights/mood-summary` | Average score, trend direction |

**Sample `/overview` response:**
```json
{
  "totalTasks": 14,
  "completedTasks": 9,
  "completionRate": 64.3,
  "totalJournalEntries": 6,
  "totalHabits": 4,
  "activeHabits": 3
}
```

**Sample `/mood-summary` response:**
```json
{
  "averageScore": 3.7,
  "mostFrequentMoodThisMonth": "good",
  "trend": "improving",
  "totalEntries": 21
}
```

`trend` — `improving | stable | declining | null` (null until 4+ entries)

---

## Project Structure

```
src/
├── config/
│   └── db.js               # MongoDB connection
├── controllers/
│   ├── authController.js
│   ├── taskController.js
│   ├── journalController.js
│   ├── habitController.js
│   ├── moodController.js
│   └── insightController.js
├── middleware/
│   ├── protect.js          # JWT auth middleware
│   └── errorHandler.js     # Centralized error handling
├── models/
│   ├── User.js
│   ├── Task.js
│   ├── JournalEntry.js
│   ├── Habit.js
│   └── MoodEntry.js
├── routes/
│   ├── authRoutes.js
│   ├── taskRoutes.js
│   ├── journalRoutes.js
│   ├── habitRoutes.js
│   ├── moodRoutes.js
│   └── insightRoutes.js
├── utils/
│   ├── asyncHandler.js     # Wraps async controllers, forwards errors
│   └── paginate.js         # Shared pagination logic
├── app.js                  # Express app setup
└── server.js               # Entry point
```

---

## Error Handling

All errors return JSON. Common responses:

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing field, invalid value, duplicate) |
| 401 | Not authorized (missing or invalid token) |
| 404 | Resource not found (or belongs to another user) |
| 500 | Server error |

---

## Roadmap

- [ ] Password reset flow
- [ ] Refresh tokens
- [ ] Cross-resource analytics (mood vs. task completion rate)
- [ ] Weekly digest endpoint
- [ ] Rate limiting
