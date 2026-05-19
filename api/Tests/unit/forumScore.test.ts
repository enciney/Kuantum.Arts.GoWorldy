import { popularityScore } from "../../src/utils/forumScore";

describe("popularityScore", () => {
  it("returns 0 when both upvotes and commentCount are 0", () => {
    expect(popularityScore(0, 0)).toBe(0);
  });

  it("only upvotes: score = upvotes * 2", () => {
    expect(popularityScore(10, 0)).toBe(20);
    expect(popularityScore(3, 0)).toBe(6);
  });

  it("only commentCount: score = commentCount", () => {
    expect(popularityScore(0, 30)).toBe(30);
    expect(popularityScore(0, 7)).toBe(7);
  });

  it("treats null/undefined as 0", () => {
    expect(popularityScore(null, null)).toBe(0);
    expect(popularityScore(undefined, undefined)).toBe(0);
    expect(popularityScore(null, 5)).toBe(5);
    expect(popularityScore(4, undefined)).toBe(8);
  });

  it("produces expected ordering for FRM-TPC-013 scenario", () => {
    const A = popularityScore(10, 2);
    const B = popularityScore(0, 30);
    const C = popularityScore(5, 15);
    expect(A).toBe(22);
    expect(B).toBe(30);
    expect(C).toBe(25);
    const sorted = [
      { name: "A", score: A },
      { name: "B", score: B },
      { name: "C", score: C },
    ].sort((x, y) => y.score - x.score);
    expect(sorted.map((s) => s.name)).toEqual(["B", "C", "A"]);
  });
});
