import type { ActivityStats, SubmitResult } from "../types";

const STATS_KEY = "picture-matching:v1:stats";
const RECENT_KEY = "picture-matching:v1:recent";
const MAX_RECENT = 5;

export function loadStats(): Record<string, ActivityStats> {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ActivityStats>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveStats(stats: Record<string, ActivityStats>): void {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function loadRecentIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function saveRecentIds(ids: string[]): void {
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
}

export function updateStatsAfterSubmit(
  stats: Record<string, ActivityStats>,
  activityId: string,
  result: SubmitResult,
  totalCorrect: number,
): Record<string, ActivityStats> {
  const previous = stats[activityId] ?? {
    activityId,
    timesPlayed: 0,
    correctCount: 0,
    wrongCount: 0,
  };
  const next: ActivityStats = {
    ...previous,
    timesPlayed: previous.timesPlayed + 1,
    correctCount: previous.correctCount + (result.isPerfect ? 1 : 0),
    wrongCount: previous.wrongCount + (result.isPerfect ? 0 : 1),
    lastPlayedAt: new Date().toISOString(),
    lastScore: {
      correctSelected: result.correctSelected.length,
      totalCorrect,
      extraWrongSelected: result.wrongSelected.length,
      missedCorrect: result.missedCorrect.length,
    },
  };

  return {
    ...stats,
    [activityId]: next,
  };
}

export function pushRecentId(recentIds: string[], activityId: string): string[] {
  return [activityId, ...recentIds.filter((id) => id !== activityId)].slice(0, MAX_RECENT);
}
