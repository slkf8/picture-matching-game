import type { Activity, ChoiceItem } from "../types";
import SelectedTray from "./SelectedTray";

export type PracticeMode = "items" | "workplace";

type ActivityPanelProps = {
  activity: Activity;
  selectedChoices: ChoiceItem[];
  submitted: boolean;
  practiceMode: PracticeMode;
  onRemoveChoice: (choiceId: string) => void;
  onTogglePracticeMode: () => void;
};

export default function ActivityPanel({
  activity,
  selectedChoices,
  submitted,
  practiceMode,
  onRemoveChoice,
  onTogglePracticeMode,
}: ActivityPanelProps) {
  return (
    <section className="activity-panel" aria-labelledby="current-activity">
      <div className="section-heading">
        <div>
          <p className="eyebrow">目前題目</p>
          <h2 id="current-activity">{activity.displayName}</h2>
        </div>
        <div className="activity-header-actions">
          {activity.englishName && <span className="english-name">{activity.englishName}</span>}
          <button type="button" className="mode-toggle-button" onClick={onTogglePracticeMode}>
            {practiceMode === "items" ? "場所" : "物品"}
          </button>
        </div>
      </div>

      <div className="target-image-frame">
        <img src={activity.targetImage.objectUrl} alt={activity.targetImage.alt} draggable={false} />
      </div>

      <SelectedTray choices={selectedChoices} submitted={submitted} onRemoveChoice={onRemoveChoice} />
    </section>
  );
}
