import { MultiTimeframeStrength, StrengthDescriptor, StrengthRank, Timeframe } from "./types";

export const TIMEFRAME_WEIGHTS: Record<Timeframe, number> = {
  "1h": 0.05,
  "24h": 0.15,
  "7d": 0.25,
  "30d": 0.3,
  "90d": 0.25,
};

export function calcRPD(oshiPercentChange: number, targetPercentChange: number): number {
  return oshiPercentChange - targetPercentChange;
}

export function calcCompositeScore(oshiChange: number, targetChanges: number[]): number {
  if (targetChanges.length === 0) return 0;
  const sum = targetChanges.reduce((acc, change) => acc + (oshiChange - change), 0);
  return sum / targetChanges.length;
}

export function calcWeightedComposite(strength: Omit<MultiTimeframeStrength, "composite">): number {
  let total = 0;
  let weightSum = 0;
  (Object.keys(TIMEFRAME_WEIGHTS) as Timeframe[]).forEach((tf) => {
    total += strength[tf] * TIMEFRAME_WEIGHTS[tf];
    weightSum += TIMEFRAME_WEIGHTS[tf];
  });
  return weightSum === 0 ? 0 : total / weightSum;
}

export function getStrengthDescriptor(score: number): StrengthDescriptor {
  let rank: StrengthRank = "neutral";
  let label = "中立";
  let color = "#64748b";

  if (score >= 20) {
    rank = "extremely-strong";
    label = "極めて強い";
    color = "#ef4444";
  } else if (score >= 10) {
    rank = "strong";
    label = "強い";
    color = "#f97316";
  } else if (score >= 3) {
    rank = "moderately-strong";
    label = "やや強い";
    color = "#10b981";
  } else if (score <= -20) {
    rank = "extremely-weak";
    label = "極めて弱い";
    color = "#7c3aed";
  } else if (score <= -10) {
    rank = "weak";
    label = "弱い";
    color = "#3b82f6";
  } else if (score <= -3) {
    rank = "moderately-weak";
    label = "やや弱い";
    color = "#38bdf8";
  }

  return { rank, label, color };
}
