import { describe, it, expect } from "vitest";
import { readCookie, sessionCookie } from "./auth";

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

describe("readCookie", () => {
  it("reads a value from a multi-cookie header", () => {
    expect(readCookie("theme=dark; li_session=TOK; other=1", "li_session")).toBe("TOK");
  });
  it("returns null for a missing cookie or absent header", () => {
    expect(readCookie("theme=dark", "li_session")).toBeNull();
    expect(readCookie(null, "li_session")).toBeNull();
  });
  it("does not match a cookie whose name merely ends with the target", () => {
    expect(readCookie("not_li_session=NOPE", "li_session")).toBeNull();
  });
  it("keeps `=` inside the value", () => {
    expect(readCookie("scatos_session=a.b=c", "scatos_session")).toBe("a.b=c");
  });
});
