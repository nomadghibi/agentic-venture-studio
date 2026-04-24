import { describe, expect, it } from "vitest";
import {
  StageTransitionError,
  approvalTypeForStage,
  assertAllowedStageTransition,
  statusForStage
} from "./opportunity-logic.js";

describe("assertAllowedStageTransition", () => {
  it("allows each linear step forward", () => {
    const pairs: [string, string][] = [
      ["discovery", "validation"],
      ["validation", "feasibility"],
      ["feasibility", "monetization"],
      ["monetization", "design"],
      ["design", "build"],
      ["build", "launch"],
      ["launch", "live"]
    ];

    for (const [from, to] of pairs) {
      expect(() =>
        assertAllowedStageTransition(from as never, to as never)
      ).not.toThrow();
    }
  });

  it("throws when from and to are the same stage", () => {
    expect(() =>
      assertAllowedStageTransition("discovery", "discovery")
    ).toThrow(StageTransitionError);
  });

  it("throws when skipping a stage forward", () => {
    expect(() =>
      assertAllowedStageTransition("discovery", "feasibility")
    ).toThrow(StageTransitionError);
  });

  it("throws when going backward in the linear flow", () => {
    expect(() =>
      assertAllowedStageTransition("validation", "discovery")
    ).toThrow(StageTransitionError);
  });

  it("allows killing from any active stage", () => {
    const activeStages = [
      "discovery",
      "validation",
      "feasibility",
      "monetization",
      "design",
      "build",
      "launch",
      "live"
    ] as const;

    for (const from of activeStages) {
      expect(() =>
        assertAllowedStageTransition(from, "killed")
      ).not.toThrow();
    }
  });

  it("throws when killing an archived opportunity", () => {
    expect(() =>
      assertAllowedStageTransition("archived", "killed")
    ).toThrow(StageTransitionError);
  });

  it("allows archiving a killed opportunity", () => {
    expect(() =>
      assertAllowedStageTransition("killed", "archived")
    ).not.toThrow();
  });

  it("allows archiving a live opportunity", () => {
    expect(() =>
      assertAllowedStageTransition("live", "archived")
    ).not.toThrow();
  });

  it("throws when archiving from an in-progress stage", () => {
    const inProgress = ["discovery", "validation", "build"] as const;

    for (const from of inProgress) {
      expect(() =>
        assertAllowedStageTransition(from, "archived")
      ).toThrow(StageTransitionError);
    }
  });
});

describe("statusForStage", () => {
  it("returns approved for live", () => {
    expect(statusForStage("live")).toBe("approved");
  });

  it("returns rejected for killed", () => {
    expect(statusForStage("killed")).toBe("rejected");
  });

  it("returns archived for archived", () => {
    expect(statusForStage("archived")).toBe("archived");
  });

  it("returns active for all in-progress stages", () => {
    const active = [
      "discovery",
      "validation",
      "feasibility",
      "monetization",
      "design",
      "build",
      "launch"
    ] as const;

    for (const stage of active) {
      expect(statusForStage(stage)).toBe("active");
    }
  });
});

describe("approvalTypeForStage", () => {
  it("returns design_review for design stage", () => {
    expect(approvalTypeForStage("design")).toBe("design_review");
  });

  it("returns build_approval for build stage", () => {
    expect(approvalTypeForStage("build")).toBe("build_approval");
  });

  it("returns launch_approval for launch stage", () => {
    expect(approvalTypeForStage("launch")).toBe("launch_approval");
  });

  it("returns null for stages that don't trigger approvals", () => {
    const noApproval = [
      "discovery",
      "validation",
      "feasibility",
      "monetization",
      "live",
      "killed",
      "archived"
    ] as const;

    for (const stage of noApproval) {
      expect(approvalTypeForStage(stage)).toBeNull();
    }
  });
});
