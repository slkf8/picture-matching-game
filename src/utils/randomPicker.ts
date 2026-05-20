import type { Activity, ActivityStats } from "../types";

const RECENT_MULTIPLIERS = [0.15, 0.35, 0.55, 0.75, 0.9];

export function pickWeightedRandomActivity(
  activities: Activity[],
  stats: Record<string, ActivityStats>,
  recentIds: string[],
  excludeCurrent?: string,
): Activity {
  if (activities.length === 0) {
    throw new Error("No activities available");
  }

  if (activities.length === 1) {
    return activities[0];
  }

  const candidates = activities.filter((activity) => activity.id !== excludeCurrent);
  const pool = candidates.length > 0 ? candidates : activities;
  const playCounts = activities.map((activity) => stats[activity.id]?.timesPlayed ?? 0);
  const lowestPlayCount = Math.min(...playCounts);

  const weighted = pool.map((activity) => {
    const activityStats = stats[activity.id];
    let weight = 100;
    const recentIndex = recentIds.indexOf(activity.id);

    if (recentIndex >= 0 && recentIndex < RECENT_MULTIPLIERS.length) {
      weight *= RECENT_MULTIPLIERS[recentIndex];
    }

    const lastScore = activityStats?.lastScore;
    if (lastScore && (lastScore.extraWrongSelected > 0 || lastScore.missedCorrect > 0)) {
      weight += 25;
    }

    if (activityStats && activityStats.wrongCount > activityStats.correctCount) {
      weight += 20;
    }

    if (!activityStats || activityStats.timesPlayed === 0) {
      weight += 50;
    } else if (activityStats.timesPlayed === lowestPlayCount) {
      weight += 20;
    }

    return {
      activity,
      weight: Math.max(weight, 5),
    };
  });

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = Math.random() * totalWeight;

  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) {
      return item.activity;
    }
  }

  return weighted[weighted.length - 1].activity;
}
