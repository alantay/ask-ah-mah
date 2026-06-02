import { extractJsonObject, looksLikeJsonAttempt } from "./extractJsonObject";

describe("extractJsonObject", () => {
  it("returns a bare JSON object unchanged", () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it("unwraps a ```json fenced object", () => {
    expect(extractJsonObject('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("unwraps an unlabelled ``` fenced object", () => {
    expect(extractJsonObject('```\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("extracts an object preceded by prose", () => {
    expect(extractJsonObject('Here is the updated recipe: {"a":1} enjoy!')).toBe('{"a":1}');
  });

  it("handles nested objects", () => {
    expect(extractJsonObject('{"a":{"b":2},"c":3}')).toBe('{"a":{"b":2},"c":3}');
  });

  it("does not stop at braces inside strings", () => {
    expect(extractJsonObject('{"a":"} not the end {"}')).toBe('{"a":"} not the end {"}');
  });

  it("respects escaped quotes inside strings", () => {
    expect(extractJsonObject('{"a":"she said \\"hi\\""}')).toBe('{"a":"she said \\"hi\\""}');
  });

  it("returns null for a truncated object (no matching close brace)", () => {
    expect(extractJsonObject('{"recipe":{"title":"Haina')).toBeNull();
  });

  it("returns null for a truncated fenced object", () => {
    expect(extractJsonObject('```json\n{"recipe":{"title":"Haina')).toBeNull();
  });

  it("returns null for plain prose with no object", () => {
    expect(extractJsonObject("Aiyah, that would be a totally different dish.")).toBeNull();
  });
});

describe("looksLikeJsonAttempt", () => {
  it("is true for a bare object", () => {
    expect(looksLikeJsonAttempt('{"a":1}')).toBe(true);
  });

  it("is true for a truncated object", () => {
    expect(looksLikeJsonAttempt('{"recipe":{"title":"Haina')).toBe(true);
  });

  it("is true for a ```json fence even before any brace", () => {
    expect(looksLikeJsonAttempt("```json\n")).toBe(true);
  });

  it("is true for a fenced (truncated) object", () => {
    expect(looksLikeJsonAttempt('```json\n{"recipe":')).toBe(true);
  });

  it("is false for a plain-text refusal", () => {
    expect(looksLikeJsonAttempt("Aiyah, that would be a totally different dish.")).toBe(false);
  });
});
