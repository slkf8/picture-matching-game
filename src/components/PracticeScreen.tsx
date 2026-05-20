import { useEffect, useMemo, useRef, useState } from "react";
import type { Activity, ActivityStats, ChoiceItem, PracticeState } from "../types";
import { buildChoicesForActivity } from "../utils/choices";
import { pickWeightedRandomActivity } from "../utils/randomPicker";
import { scoreChoices } from "../utils/scoring";
import {
  loadRecentIds,
  loadStats,
  pushRecentId,
  saveRecentIds,
  saveStats,
  updateStatsAfterSubmit,
} from "../utils/storage";
import ActivityPanel from "./ActivityPanel";
import ActivityPickerSheet from "./ActivityPickerSheet";
import ChoiceGrid from "./ChoiceGrid";
import ResultPanel from "./ResultPanel";

type PracticeScreenProps = {
  title: string;
  activities: Activity[];
  warnings: string[];
  onResetPack: () => void;
};

export default function PracticeScreen({ title, activities, warnings, onResetPack }: PracticeScreenProps) {
  const [stats, setStats] = useState<Record<string, ActivityStats>>(() => loadStats());
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecentIds());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const didMountRef = useRef(false);
  const [practiceState, setPracticeState] = useState<PracticeState>(() => {
    const firstActivity = pickWeightedRandomActivity(activities, loadStats(), loadRecentIds());
    return {
      currentActivityId: firstActivity.id,
      selectedChoiceIds: [],
      submitted: false,
      result: null,
    };
  });
  const [currentChoices, setCurrentChoices] = useState<ChoiceItem[]>(() => {
    const firstActivity = activities.find((activity) => activity.id === practiceState.currentActivityId) ?? activities[0];
    return buildChoicesForActivity(firstActivity);
  });

  const currentActivity = useMemo(
    () => activities.find((activity) => activity.id === practiceState.currentActivityId) ?? activities[0],
    [activities, practiceState.currentActivityId],
  );

  const selectedChoices = useMemo(() => {
    const selectedIds = new Set(practiceState.selectedChoiceIds);
    return currentChoices.filter((choice) => selectedIds.has(choice.id));
  }, [currentChoices, practiceState.selectedChoiceIds]);

  const totalPlayed = Object.values(stats).reduce((sum, item) => sum + item.timesPlayed, 0);
  const totalCorrect = Object.values(stats).reduce((sum, item) => sum + item.correctCount, 0);
  const accuracy = totalPlayed === 0 ? 0 : Math.round((totalCorrect / totalPlayed) * 100);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const nextActivity = pickWeightedRandomActivity(activities, stats, recentIds);
    setPracticeState({
      currentActivityId: nextActivity.id,
      selectedChoiceIds: [],
      submitted: false,
      result: null,
    });
    setCurrentChoices(buildChoicesForActivity(nextActivity));
  }, [activities]);

  function resetAttempt(activity: Activity) {
    setPracticeState({
      currentActivityId: activity.id,
      selectedChoiceIds: [],
      submitted: false,
      result: null,
    });
    setCurrentChoices(buildChoicesForActivity(activity));
    setNotice("");
  }

  function handleToggleChoice(choiceId: string) {
    if (practiceState.submitted) return;

    const choice = currentChoices.find((item) => item.id === choiceId);
    const isSelected = practiceState.selectedChoiceIds.includes(choiceId);

    if (isSelected) {
      setNotice("");
    } else if (choice?.isCorrect) {
      setNotice(`正確：${choice.label} 是相關物品`);
    } else if (choice) {
      setNotice(`再試試：${choice.label} 不是這題的正確物品`);
    }

    setPracticeState((previousState) => {
      const isAlreadySelected = previousState.selectedChoiceIds.includes(choiceId);
      return {
        ...previousState,
        selectedChoiceIds: isAlreadySelected
          ? previousState.selectedChoiceIds.filter((id) => id !== choiceId)
          : [...previousState.selectedChoiceIds, choiceId],
      };
    });
  }

  function handleClearSelection() {
    resetAttempt(currentActivity);
  }

  function handleSubmit() {
    if (practiceState.submitted) return;
    if (practiceState.selectedChoiceIds.length === 0) {
      setNotice("請先選擇物品");
      return;
    }

    const result = scoreChoices(currentChoices, practiceState.selectedChoiceIds, currentActivity.correctItemIds);
    const correctTotal = currentActivity.correctItemIds.length;
    const nextStats = updateStatsAfterSubmit(stats, currentActivity.id, result, correctTotal);
    const nextRecentIds = pushRecentId(recentIds, currentActivity.id);

    setStats(nextStats);
    setRecentIds(nextRecentIds);
    saveStats(nextStats);
    saveRecentIds(nextRecentIds);
    setPracticeState((previousState) => ({
      ...previousState,
      submitted: true,
      result,
    }));
    setNotice("");
  }

  function handleNextRandom() {
    const nextActivity = pickWeightedRandomActivity(activities, stats, recentIds, currentActivity.id);
    resetAttempt(nextActivity);
  }

  function handleSelectActivity(activityId: string) {
    const activity = activities.find((item) => item.id === activityId);
    if (!activity) return;
    resetAttempt(activity);
    setIsPickerOpen(false);
  }

  return (
    <section className="practice-screen">
      <header className="top-bar">
        <div>
          <p className="eyebrow">圖片配對練習</p>
          <h1>{title}</h1>
        </div>
        <div className="top-actions" aria-label="練習操作">
          <button type="button" className="secondary-button" onClick={handleNextRandom}>
            隨機練習
          </button>
          <button type="button" className="secondary-button" onClick={() => setIsPickerOpen(true)}>
            選擇人物
          </button>
          <button type="button" className="ghost-button" onClick={onResetPack}>
            重新匯入
          </button>
        </div>
      </header>

      <div className="status-row">
        <span>目前題目：{currentActivity.displayName} {currentActivity.englishName}</span>
        <span>已完成：{totalPlayed} 題</span>
        <span>正確率：{accuracy}%</span>
      </div>

      {warnings.length > 0 && (
        <details className="message-box warning-box">
          <summary>題庫有 {warnings.length} 則提醒</summary>
          <pre>{warnings.join("\n\n")}</pre>
        </details>
      )}

      <div className="practice-layout">
        <ActivityPanel
          activity={currentActivity}
          selectedChoices={selectedChoices}
          submitted={practiceState.submitted}
          onRemoveChoice={handleToggleChoice}
        />
        <ChoiceGrid
          choices={currentChoices}
          selectedChoiceIds={practiceState.selectedChoiceIds}
          submitted={practiceState.submitted}
          result={practiceState.result}
          onToggleChoice={handleToggleChoice}
        />
      </div>

      <footer className="bottom-actions">
        <div className="notice" role="status" aria-live="polite">
          {notice}
        </div>
        <div className="action-cluster">
          <button type="button" className="secondary-button" onClick={handleClearSelection}>
            {practiceState.submitted ? "再做一次" : "清除選擇"}
          </button>
          {!practiceState.submitted ? (
            <button type="button" className="primary-button" onClick={handleSubmit}>
              提交答案
            </button>
          ) : (
            <>
              <button type="button" className="primary-button" onClick={handleNextRandom}>
                隨機下一題
              </button>
              <button type="button" className="secondary-button" onClick={() => setIsPickerOpen(true)}>
                選擇人物
              </button>
            </>
          )}
        </div>
      </footer>

      {practiceState.result && <ResultPanel result={practiceState.result} />}

      <ActivityPickerSheet
        isOpen={isPickerOpen}
        activities={activities}
        stats={stats}
        recentIds={recentIds}
        currentActivityId={currentActivity.id}
        onClose={() => setIsPickerOpen(false)}
        onSelectActivity={handleSelectActivity}
      />
    </section>
  );
}
