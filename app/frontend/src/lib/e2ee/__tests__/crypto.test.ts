import { describe, it, expect } from "vitest";
import { encryptString, decryptString, encryptBytes, decryptBytes, isEncryptedPayload } from "../crypto";

describe("e2ee crypto", () => {
  it("round-trips a string", async () => {
    const secret = await encryptString("hello world", "passphrase");
    expect(isEncryptedPayload(secret)).toBe(true);
    const plain = await decryptString(secret, "passphrase");
    expect(plain).toBe("hello world");
  });

  it("round-trips bytes", async () => {
    const data = new TextEncoder().encode("binary-data").buffer;
    const encrypted = await encryptBytes(data, "passphrase");
    const decrypted = await decryptBytes(encrypted, "passphrase");
    const decoded = new TextDecoder().decode(decrypted);
    expect(decoded).toBe("binary-data");
  });
});
