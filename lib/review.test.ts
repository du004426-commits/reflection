import { describe, expect, it } from "vitest";
import { buildSummary, nextStage } from "./review";
import type { Project } from "./types";

describe("review flow", () => {
  it("advances through the guided stages", () => expect(nextStage("facts")).toBe("evaluation"));
  it("never turns missing evidence into a claim", () => {
    const project: Project = { id: "p", name: "Test", startedAt: "2026-01-01T00:00:00Z", status: "active" };
    expect(buildSummary(project, []).outcome).toBe("Not captured yet.");
  });
});
