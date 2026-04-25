import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearStoredUser, readStoredUser, writeStoredUser } from "./authStorage";
import { cleanupMockBrowser, installMockBrowser } from "../test/browserMocks";

describe("authStorage", () => {
  beforeEach(() => {
    installMockBrowser();
  });

  afterEach(() => {
    cleanupMockBrowser();
  });

  it("writes and reads the stored user snapshot", () => {
    const user = { user_id: 12, email: "user@sutore.test", role: "customer" };

    writeStoredUser(user);

    expect(readStoredUser()).toEqual(user);
  });

  it("clears the stored user and notifies listeners", () => {
    writeStoredUser({ user_id: 7, email: "logout@sutore.test" });

    clearStoredUser();

    expect(readStoredUser()).toBeNull();
    expect(window.dispatchedEvents.map((event) => event.type)).toEqual([
      "sutore-auth-change",
      "sutore-auth-change",
    ]);
  });
});
