type WithConfidence = { confidence: unknown };

function hasConfidenceField(output: unknown): output is WithConfidence {
  return (
    typeof output === "object" &&
    output !== null &&
    "confidence" in output &&
    typeof (output as WithConfidence).confidence === "number"
  );
}

export function evaluateConfidence(output: unknown): number {
  if (!output) return 0;

  if (hasConfidenceField(output)) {
    const value = output.confidence as number;
    if (value >= 0 && value <= 1) return value;
  }

  if (typeof output !== "object") return 0.5;

  const obj = output as Record<string, unknown>;
  let score = 0.45;

  if (obj.problemStatement || obj.rationale) score += 0.1;
  if (obj.targetBuyer || obj.buyerClarity === "clear") score += 0.1;
  if (obj.evidenceStrength === "strong" || obj.frequency === "frequent") score += 0.15;
  if (obj.evidenceStrength === "moderate" || obj.urgency === "high") score += 0.1;
  if (obj.recommendation === "advance" || obj.decision === "advance") score += 0.1;

  return Math.min(score, 1.0);
}
