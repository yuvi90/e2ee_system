import { testClient } from "./setup";

let token: string;
let fileId: number;

beforeEach(async () => {
  const res = await testClient.post("/api/v1/auth/register").send({
    email: "fileuser@example.com",
    password: "StrongPass123!",
  });
  token = res.body.token;
});

describe("File Module", () => {
  it("should upload an encrypted file", async () => {
    const res = await testClient
      .post("/api/v1/files/upload")
      .set("Authorization", `Bearer ${token}`)
      .send({
        filename: "test.txt",
        encryptedKey: "fakeAESKey123",
        cipherData: Buffer.from("EncryptedFileContent").toString("base64"),
        integrityHash: "a".repeat(64),
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    fileId = res.body.id;
  });

  it("should list user files", async () => {
    const res = await testClient
      .get("/api/v1/files")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("should delete a file", async () => {
    const upload = await testClient
      .post("/api/v1/files/upload")
      .set("Authorization", `Bearer ${token}`)
      .send({
        filename: "delete.txt",
        encryptedKey: "fakeKey",
        cipherData: Buffer.from("Encrypted").toString("base64"),
        integrityHash: "b".repeat(64),
      });

    const res = await testClient
      .delete(`/api/v1/files/${upload.body.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
