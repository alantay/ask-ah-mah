import { upperCaseFirstLetter } from "./utils";

describe("Utility Functions", () => {
  describe("upperCaseFirstLetter", () => {
    it("should capitalize the first letter of a lowercase string", () => {
      expect(upperCaseFirstLetter("hello")).toBe("Hello");
      expect(upperCaseFirstLetter("world")).toBe("World");
    });

    it("should handle strings that are already capitalized", () => {
      expect(upperCaseFirstLetter("Hello")).toBe("Hello");
      expect(upperCaseFirstLetter("WORLD")).toBe("WORLD");
    });

    it("should handle single character strings", () => {
      expect(upperCaseFirstLetter("a")).toBe("A");
      expect(upperCaseFirstLetter("Z")).toBe("Z");
    });

    it("should handle empty strings", () => {
      expect(upperCaseFirstLetter("")).toBe("");
    });

    it("should handle strings with spaces", () => {
      expect(upperCaseFirstLetter("hello world")).toBe("Hello world");
      expect(upperCaseFirstLetter(" test")).toBe(" test");
    });

    it("should handle strings with numbers and special characters", () => {
      expect(upperCaseFirstLetter("123abc")).toBe("123abc");
      expect(upperCaseFirstLetter("!hello")).toBe("!hello");
      expect(upperCaseFirstLetter("test-case")).toBe("Test-case");
    });
  });
});
