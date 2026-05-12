const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../app");
const connectDB = require("../config/db");

const testUser = {
  name: "Test User",
  email: `test_${Date.now()}@example.com`,
  password: "password123",
};

let token;

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  // Clean up the test user
  const User = require("../models/User");
  await User.deleteOne({ email: testUser.email });
  await mongoose.disconnect();
});

describe("Auth Routes", () => {
  test("POST /api/auth/register — creates user and returns token", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  test("POST /api/auth/login — returns token for valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  test("POST /api/auth/login — rejects wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testUser.email, password: "wrongpassword" });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe("Tasks CRUD", () => {
  let taskId;

  test("POST /api/tasks — creates task when authenticated", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Test Task", intent: "Testing the API" });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe("Test Task");
    taskId = res.body.data._id;
  });

  test("POST /api/tasks — rejects unauthenticated request with 401", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Unauthorized Task" });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  afterAll(async () => {
    if (taskId) {
      const Task = require("../models/Task");
      await Task.findByIdAndDelete(taskId);
    }
  });
});

describe("Validation", () => {
  test("POST /api/auth/register — rejects short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "X", email: "x@test.com", password: "123" });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test("POST /api/auth/register — rejects missing email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test Person", password: "password123" });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test("POST /api/tasks — rejects task with empty title when authenticated", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
