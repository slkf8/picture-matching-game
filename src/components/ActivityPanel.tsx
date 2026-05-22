import { useLayoutEffect, useRef, useState } from "react";
import type { Activity, ChoiceItem } from "../types";
import SelectedTray from "./SelectedTray";

export type PracticeMode = "items" | "workplace" | "duties";
const PRACTICE_MODES: { id: PracticeMode; label: string }[] = [
  { id: "items", label: "物品" },
  { id: "workplace", label: "場所" },
  { id: "duties", label: "職責" },
];

type ActivityPanelProps = {
  activity: Activity;
  selectedChoices: ChoiceItem[];
  submitted: boolean;
  practiceMode: PracticeMode;
  onRemoveChoice: (choiceId: string) => void;
  onChangePracticeMode: (practiceMode: PracticeMode) => void;
};

export default function ActivityPanel({
  activity,
  selectedChoices,
  submitted,
  practiceMode,
  onRemoveChoice,
  onChangePracticeMode,
}: ActivityPanelProps) {
  const headingRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [hideEnglishName, setHideEnglishName] = useState(false);
  const fullActivityName = activity.englishName
    ? `${activity.displayName} / ${activity.englishName}`
    : activity.displayName;

  useLayoutEffect(() => {
    const updateTitleFit = () => {
      if (!activity.englishName || !headingRef.current || !actionsRef.current || !measureRef.current) {
        setHideEnglishName(false);
        return;
      }

      const reservedGap = 12;
      const nextHideEnglishName =
        measureRef.current.offsetWidth + actionsRef.current.offsetWidth + reservedGap > headingRef.current.clientWidth;
      setHideEnglishName(nextHideEnglishName);
    };

    updateTitleFit();

    const resizeObserver = new ResizeObserver(updateTitleFit);
    if (headingRef.current) resizeObserver.observe(headingRef.current);
    if (actionsRef.current) resizeObserver.observe(actionsRef.current);
    if (measureRef.current) resizeObserver.observe(measureRef.current);
    window.addEventListener("resize", updateTitleFit);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateTitleFit);
    };
  }, [activity.displayName, activity.englishName, practiceMode]);

  return (
    <section className="activity-panel" aria-labelledby="current-activity">
      <div className="section-heading" ref={headingRef}>
        <div className="activity-title-stack">
          <span className="english-name" id="current-activity">
            {hideEnglishName ? activity.displayName : fullActivityName}
          </span>
          <span className="english-name activity-title-measure" ref={measureRef} aria-hidden="true">
            {fullActivityName}
          </span>
        </div>
        <div className="activity-header-actions" ref={actionsRef}>
          <div className={`mode-segmented-control mode-${practiceMode}`} aria-label="切換練習模式">
            {PRACTICE_MODES.map((mode) => (
              <button
                type="button"
                className={`mode-segmented-button ${practiceMode === mode.id ? "active" : ""}`}
                key={mode.id}
                onClick={() => onChangePracticeMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="target-image-frame">
        <img src={activity.targetImage.objectUrl} alt={activity.targetImage.alt} draggable={false} />
      </div>

      <SelectedTray choices={selectedChoices} submitted={submitted} onRemoveChoice={onRemoveChoice} />
    </section>
  );
}
