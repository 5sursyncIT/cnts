import { describe, expect, it } from "vitest";

import { getNewsItem, news } from "./news";

describe("news", () => {
  it("lists news and resolves by slug", () => {
    expect(news.length).toBeGreaterThan(0);
    const first = news[0]!;
    expect(getNewsItem(first.slug)).toEqual(first);
    expect(getNewsItem("unknown")).toBeUndefined();
  });
});

