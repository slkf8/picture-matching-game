import type { Activity, ChoiceItem } from "../types";
import SelectedTray from "./SelectedTray";

type ActivityPanelProps = {
  activity: Activity;
  selectedChoices: ChoiceItem[];
  submitted: boolean;
  onRemoveChoice: (choiceId: string) => void;
};

export default function ActivityPanel({ activity, selectedChoices, submitted, onRemoveChoice }: ActivityPanelProps) {
  return (
    <section className="activity-panel" aria-labelledby="current-activity">
      <div className="section-heading">
        <div>
          <p className="eyebrow">目前題目</p>
          <h2 id="current-activity">{activity.displayName}</h2>
        </div>
        {activity.englishName && <span className="english-name">{activity.englishName}</span>}
      </div>

      <div className="target-image-frame">
        <img src={activity.targetImage.objectUrl} alt={activity.targetImage.alt} draggable={false} />
      </div>

      <SelectedTray choices={selectedChoices} submitted={submitted} onRemoveChoice={onRemoveChoice} />
    </section>
  );
}
