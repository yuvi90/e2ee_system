import { testClient } from "./setup";

describe("Auth Module", () => {
  it("should register a new user", async () => {
    const res = await testClient.post("/api/v1/auth/register").send({
      email: "user1@example.com",
      password: "StrongPass123!",
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe("user1@example.com");
  });

  it("should not register duplicate email", async () => {
    await testClient.post("/api/v1/auth/register").send({
      email: "dup@example.com",
      password: "pass12345",
    });

    const res = await testClient.post("/api/v1/auth/register").send({
      email: "dup@example.com",
      password: "pass12345",
    });

    expect(res.status).toBe(409);
  });

  it("should login existing user", async () => {
    await testClient.post("/api/v1/auth/register").send({
      email: "login@example.com",
      password: "Test@12345",
    });

    const res = await testClient.post("/api/v1/auth/login").send({
      email: "login@example.com",
      password: "Test@12345",
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
  });

  it("should reject invalid login credentials", async () => {
    const res = await testClient.post("/api/v1/auth/login").send({
      email: "fake@example.com",
      password: "wrongpass",
    });

    expect(res.status).toBe(401);
  });
});
