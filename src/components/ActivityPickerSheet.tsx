import type { Activity, ActivityStats } from "../types";

type ActivityPickerSheetProps = {
  isOpen: boolean;
  activities: Activity[];
  stats: Record<string, ActivityStats>;
  recentIds: string[];
  currentActivityId: string;
  onClose: () => void;
  onSelectActivity: (activityId: string) => void;
};

function lastScoreText(activityStats?: ActivityStats): string {
  if (!activityStats?.lastScore) return "尚未練習";
  return `${activityStats.lastScore.correctSelected}/${activityStats.lastScore.totalCorrect}`;
}

export default function ActivityPickerSheet({
  isOpen,
  activities,
  stats,
  recentIds,
  currentActivityId,
  onClose,
  onSelectActivity,
}: ActivityPickerSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="activity-picker-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-picker-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-header">
          <h2 id="activity-picker-title">選擇要練習的人物</h2>
          <button type="button" className="ghost-button" onClick={onClose}>
            關閉
          </button>
        </div>

        <div className="activity-list">
          {activities.map((activity) => {
            const activityStats = stats[activity.id];
            const isRecent = recentIds[0] === activity.id;
            const isCurrent = activity.id === currentActivityId;

            return (
              <button
                type="button"
                className={`activity-list-item ${isCurrent ? "is-current" : ""}`}
                key={activity.id}
                onClick={() => onSelectActivity(activity.id)}
              >
                <img src={activity.targetImage.objectUrl} alt={activity.targetImage.alt} draggable={false} />
                <span className="activity-list-main">
                  <strong>
                    {activity.displayName} {activity.englishName}
                  </strong>
                  <span>
                    已做 {activityStats?.timesPlayed ?? 0} 次 · 最近一次 {lastScoreText(activityStats)}
                  </span>
                </span>
                {isRecent && <span className="recent-badge">剛練過</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
