import { describe, expect, it } from "vitest";
import { failure, success } from "./action-result";

describe("action-result", () => {
  it("returns success", () => {
    const result = success({ id: "1" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.id).toBe("1");
  });

  it("returns failure", () => {
    const result = failure("error");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("error");
  });
});
