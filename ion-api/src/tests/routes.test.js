const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");

const testUser = {
  name: "Routes Tester",
  email: `routes_${Date.now()}@example.com`,
  password: "password123",
};

let token;

beforeAll(async () => {
  await connectDB();
  const res = await request(app).post("/api/auth/register").send(testUser);
  token = res.body.data.token;
});

afterAll(async () => {
  const User = require("../models/User");
  await User.deleteOne({ email: testUser.email });
  await mongoose.disconnect();
});

// ── Journal ──────────────────────────────────────────────

describe("Journal Routes", () => {
  let entryId;

  test("POST /api/journal — rejects unauthenticated request", async () => {
    const res = await request(app).post("/api/journal").send({ title: "No auth" });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/journal — rejects missing title", async () => {
    const res = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "No title here" });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/journal — creates entry", async () => {
    const res = await request(app)
      .post("/api/journal")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Entry", content: "Some thoughts.", mood: "good", clarity: 3 });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Test Entry");
    entryId = res.body.data._id;
  });

  test("GET /api/journal — returns entries array", async () => {
    const res = await request(app)
      .get("/api/journal")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("PATCH /api/journal/:id — updates entry", async () => {
    const res = await request(app)
      .patch(`/api/journal/${entryId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Entry" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Updated Entry");
  });

  test("DELETE /api/journal/:id — deletes entry", async () => {
    const res = await request(app)
      .delete(`/api/journal/${entryId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  afterAll(async () => {
    if (entryId) {
      const JournalEntry = require("../models/JournalEntry");
      await JournalEntry.findByIdAndDelete(entryId);
    }
  });
});

// ── Moods ─────────────────────────────────────────────────

describe("Mood Routes", () => {
  let moodId;

  test("POST /api/moods — rejects unauthenticated request", async () => {
    const res = await request(app).post("/api/moods").send({ mood: "good" });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/moods — rejects invalid mood value", async () => {
    const res = await request(app)
      .post("/api/moods")
      .set("Authorization", `Bearer ${token}`)
      .send({ mood: "amazing" });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/moods — creates mood entry", async () => {
    const res = await request(app)
      .post("/api/moods")
      .set("Authorization", `Bearer ${token}`)
      .send({ mood: "good", note: "Feeling okay today" });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mood).toBe("good");
    moodId = res.body.data._id;
  });

  test("GET /api/moods — returns moods array", async () => {
    const res = await request(app)
      .get("/api/moods")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("PATCH /api/moods/:id — updates mood", async () => {
    const res = await request(app)
      .patch(`/api/moods/${moodId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ mood: "great", note: "Actually great" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mood).toBe("great");
  });

  test("DELETE /api/moods/:id — deletes mood", async () => {
    const res = await request(app)
      .delete(`/api/moods/${moodId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  afterAll(async () => {
    if (moodId) {
      const MoodEntry = require("../models/MoodEntry");
      await MoodEntry.findByIdAndDelete(moodId);
    }
  });
});

// ── Calendar ──────────────────────────────────────────────

describe("Calendar Routes", () => {
  let eventId;

  test("POST /api/calendar — rejects unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/calendar")
      .send({ title: "No auth", date: "2026-06-01" });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/calendar — rejects missing date", async () => {
    const res = await request(app)
      .post("/api/calendar")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "No date" });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/calendar — creates event", async () => {
    const res = await request(app)
      .post("/api/calendar")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Event", date: "2026-06-15", time: "09:00" });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Test Event");
    eventId = res.body.data._id;
  });

  test("GET /api/calendar — returns events array", async () => {
    const res = await request(app)
      .get("/api/calendar")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("PATCH /api/calendar/:id — updates event", async () => {
    const res = await request(app)
      .patch(`/api/calendar/${eventId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Event", time: "10:00" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Updated Event");
  });

  test("DELETE /api/calendar/:id — deletes event", async () => {
    const res = await request(app)
      .delete(`/api/calendar/${eventId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  afterAll(async () => {
    if (eventId) {
      const CalendarEvent = require("../models/CalendarEvent");
      await CalendarEvent.findByIdAndDelete(eventId);
    }
  });
});

// ── Reflections ────────────────────────────────────────────

describe("Reflection Routes", () => {
  const testDate = "2026-06-15";

  test("POST /api/reflections — rejects unauthenticated request", async () => {
    const res = await request(app)
      .post("/api/reflections")
      .send({ date: testDate, predictedMood: "good" });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/reflections — rejects missing date", async () => {
    const res = await request(app)
      .post("/api/reflections")
      .set("Authorization", `Bearer ${token}`)
      .send({ predictedMood: "good" });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test("POST /api/reflections — creates reflection", async () => {
    const res = await request(app)
      .post("/api/reflections")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: testDate, predictedMood: "good", notes: "Feeling calm today" });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
    expect(res.body.data.predictedMood).toBe("good");
  });

  test("GET /api/reflections — returns reflections array", async () => {
    const res = await request(app)
      .get("/api/reflections")
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test("PATCH /api/reflections/:date — updates reflection", async () => {
    const res = await request(app)
      .patch(`/api/reflections/${testDate}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ actualMood: "great", notes: "Even better than expected" });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.actualMood).toBe("great");
  });

  afterAll(async () => {
    const Reflection = require("../models/Reflection");
    await Reflection.deleteOne({ date: testDate });
  });
});
