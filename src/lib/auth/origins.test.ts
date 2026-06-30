import { resolveAuthOrigins } from "./origins";

describe("resolveAuthOrigins", () => {
  it("uses BETTER_AUTH_URL locally and trusts only that origin plus the vercel wildcard", () => {
    const { baseURL, trustedOrigins } = resolveAuthOrigins({
      BETTER_AUTH_URL: "http://localhost:3000",
    });

    expect(baseURL).toBe("http://localhost:3000");
    expect(trustedOrigins).toEqual([
      "http://localhost:3000",
      "https://*.vercel.app",
    ]);
  });

  it("pins baseURL to the stable production domain on Vercel, not the per-deploy URL", () => {
    const { baseURL } = resolveAuthOrigins({
      VERCEL_URL: "ask-ah-et9oc2zji-luns-projects-a559a6a8.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "ask-ah-mah.vercel.app",
    });

    // OAuth redirect_uri must be stable — never the moving deployment URL.
    expect(baseURL).toBe("https://ask-ah-mah.vercel.app");
  });

  it("trusts the concrete deployment origin that was being rejected", () => {
    const { trustedOrigins } = resolveAuthOrigins({
      VERCEL_URL: "ask-ah-et9oc2zji-luns-projects-a559a6a8.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "ask-ah-mah.vercel.app",
    });

    expect(trustedOrigins).toContain(
      "https://ask-ah-et9oc2zji-luns-projects-a559a6a8.vercel.app",
    );
    expect(trustedOrigins).toContain("https://ask-ah-mah.vercel.app");
    expect(trustedOrigins).toContain("https://*.vercel.app");
  });

  it("prefers an explicit BETTER_AUTH_URL over the Vercel production domain", () => {
    const { baseURL } = resolveAuthOrigins({
      BETTER_AUTH_URL: "https://cook.example.com",
      VERCEL_PROJECT_PRODUCTION_URL: "ask-ah-mah.vercel.app",
    });

    expect(baseURL).toBe("https://cook.example.com");
  });

  it("falls back to localhost when nothing is configured", () => {
    const { baseURL } = resolveAuthOrigins({});
    expect(baseURL).toBe("http://localhost:3000");
  });

  it("de-duplicates origins", () => {
    const { trustedOrigins } = resolveAuthOrigins({
      BETTER_AUTH_URL: "https://ask-ah-mah.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "ask-ah-mah.vercel.app",
    });

    const occurrences = trustedOrigins.filter(
      (o) => o === "https://ask-ah-mah.vercel.app",
    ).length;
    expect(occurrences).toBe(1);
  });
});
