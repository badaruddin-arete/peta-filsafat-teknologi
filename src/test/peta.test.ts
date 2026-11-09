import { describe, it, expect } from "vitest";
import { formatTahun } from "@/lib/peta";
describe("formatTahun", () => {
  it("SM untuk tahun negatif dan sekitar untuk perkiraan", () => {
    expect(formatTahun(-350, true)).toBe("sekitar 350 SM");
    expect(formatTahun(1954, false)).toBe("1954");
  });
});
