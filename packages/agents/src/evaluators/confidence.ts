export function evaluateConfidence(output: unknown): number {
  if (!output) {
    return 0;
  }

  if (typeof output === "object") {
    return 0.72;
  }

  return 0.6;
}
