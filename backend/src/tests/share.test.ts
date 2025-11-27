import { testClient } from "./setup";

let senderToken: string;
let recipientToken: string;
let fileId: number;

beforeEach(async () => {
  const sender = await testClient.post("/api/v1/auth/register").send({
    email: "sender@example.com",
    password: "Sender@12345",
  });
  senderToken = sender.body.token;

  const recipient = await testClient.post("/api/v1/auth/register").send({
    email: "receiver@example.com",
    password: "Receiver@12345",
  });
  recipientToken = recipient.body.token;

  const upload = await testClient
    .post("/api/v1/files/upload")
    .set("Authorization", `Bearer ${senderToken}`)
    .send({
      filename: "share.txt",
      encryptedKey: "fakeAESKey",
      cipherData: Buffer.from("data").toString("base64"),
      integrityHash: "c".repeat(64),
    });

  fileId = upload.body.id;
});

describe("Share Module", () => {
  it("should share file with recipient", async () => {
    const res = await testClient
      .post("/api/v1/share")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        fileId,
        recipientEmail: "receiver@example.com",
        encryptedKeyForRecipient: "encryptedAESKey",
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/shared/i);
  });

  it("should list shared files for recipient", async () => {
    await testClient
      .post("/api/v1/share")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({
        fileId,
        recipientEmail: "receiver@example.com",
        encryptedKeyForRecipient: "encryptedAESKey",
      });

    const res = await testClient
      .get("/api/v1/share")
      .set("Authorization", `Bearer ${recipientToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("file");
  });
});
