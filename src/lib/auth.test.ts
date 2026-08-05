import { describe, it, expect } from "vitest";
import { sessionCookie } from "./auth";

describe("sessionCookie", () => {
  it("matches the previous li_session header over https", () => {
    expect(sessionCookie("li_session", "TOK", new URL("https://stanwood.dev/li-login"), 2592000))
      .toBe("li_session=TOK; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000");
  });
  it("drops Secure over http (dev)", () => {
    expect(sessionCookie("li_session", "TOK", new URL("http://localhost:4321/li-login"), 2592000))
      .toBe("li_session=TOK; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000");
  });
  it("matches the previous money_session header over https", () => {
    expect(sessionCookie("money_session", "TOK", new URL("https://stanwood.dev/money-login")))
      .toBe("money_session=TOK; Path=/; HttpOnly; Secure; SameSite=Strict");
  });
});
