import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Activity,
  ActivityStats,
  ChoiceItem,
  Duty,
  DutySubmitResult,
  PracticeState,
  Workplace,
  WorkplaceSubmitResult,
} from "../types";
import { buildChoicesForActivity } from "../utils/choices";
import { pickWeightedRandomActivity } from "../utils/randomPicker";
import { scoreChoices } from "../utils/scoring";
import { shuffleArray } from "../utils/shuffle";
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
import DutyPracticePanel from "./DutyPracticePanel";
import ResultPanel from "./ResultPanel";
import WorkplacePracticePanel from "./WorkplacePracticePanel";
import ZipImportButton from "./ZipImportButton";

type PracticeMode = "items" | "workplace" | "duties";
const MAX_WORKPLACE_OPTIONS = 4;
const MAX_DUTY_OPTIONS = 4;

function buildWorkplacesForActivity(workplaces: Workplace[], correctWorkplaceId?: string): Workplace[] {
  if (workplaces.length <= MAX_WORKPLACE_OPTIONS) {
    return workplaces;
  }

  const correctWorkplace = workplaces.find((workplace) => workplace.id === correctWorkplaceId);
  const distractors = shuffleArray(workplaces.filter((workplace) => workplace.id !== correctWorkplaceId));

  if (!correctWorkplace) {
    return distractors.slice(0, MAX_WORKPLACE_OPTIONS);
  }

  return shuffleArray([correctWorkplace, ...distractors.slice(0, MAX_WORKPLACE_OPTIONS - 1)]);
}

function buildDutiesForActivity(duties: Duty[], correctDutyIds: string[] = []): Duty[] {
  if (duties.length <= MAX_DUTY_OPTIONS) {
    return duties;
  }

  const correctIdSet = new Set(correctDutyIds);
  const correctDuties = duties.filter((duty) => correctIdSet.has(duty.id)).slice(0, MAX_DUTY_OPTIONS);
  const distractors = shuffleArray(duties.filter((duty) => !correctIdSet.has(duty.id)));

  return shuffleArray([...correctDuties, ...distractors.slice(0, MAX_DUTY_OPTIONS - correctDuties.length)]);
}

type PracticeScreenProps = {
  title: string;
  activities: Activity[];
  workplaces: Workplace[];
  duties: Duty[];
  warnings: string[];
  onPackLoaded: (pack: {
    title: string;
    version?: string;
    activities: Activity[];
    workplaces: Workplace[];
    duties: Duty[];
    warnings: string[];
  }) => void;
};

export default function PracticeScreen({ title, activities, workplaces, duties, warnings, onPackLoaded }: PracticeScreenProps) {
  const [stats, setStats] = useState<Record<string, ActivityStats>>(() => loadStats());
  const [recentIds, setRecentIds] = useState<string[]>(() => loadRecentIds());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [importError, setImportError] = useState("");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("items");
  const [selectedWorkplaceId, setSelectedWorkplaceId] = useState<string | null>(null);
  const [selectedDutyIds, setSelectedDutyIds] = useState<string[]>([]);
  const [dutyResult, setDutyResult] = useState<DutySubmitResult | null>(null);
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
  const [currentWorkplaces, setCurrentWorkplaces] = useState<Workplace[]>(() => {
    const firstActivity = activities.find((activity) => activity.id === practiceState.currentActivityId) ?? activities[0];
    return buildWorkplacesForActivity(workplaces, firstActivity.workplaceId);
  });
  const [currentDuties, setCurrentDuties] = useState<Duty[]>(() => {
    const firstActivity = activities.find((activity) => activity.id === practiceState.currentActivityId) ?? activities[0];
    return buildDutiesForActivity(duties, firstActivity.correctDutyIds);
  });

  const currentActivity = useMemo(
    () => activities.find((activity) => activity.id === practiceState.currentActivityId) ?? activities[0],
    [activities, practiceState.currentActivityId],
  );

  const selectedChoices = useMemo(() => {
    const selectedIds = new Set(practiceState.selectedChoiceIds);
    return currentChoices.filter((choice) => selectedIds.has(choice.id));
  }, [currentChoices, practiceState.selectedChoiceIds]);

  const currentWorkplaceId = useMemo(
    () => currentActivity.workplaceId,
    [currentActivity.workplaceId],
  );

  const workplaceSubmitResult = useMemo<WorkplaceSubmitResult | undefined>(() => {
    if (!practiceState.submitted || !currentWorkplaceId) {
      return undefined;
    }

    const correctWorkplace = workplaces.find((workplace) => workplace.id === currentWorkplaceId);
    const selectedWorkplace = workplaces.find((workplace) => workplace.id === selectedWorkplaceId);

    return {
      selectedWorkplaceId,
      correctWorkplaceId: currentWorkplaceId,
      selectedWorkplaceName: selectedWorkplace?.displayName,
      correctWorkplaceName: correctWorkplace?.displayName,
      isCorrect: correctWorkplace ? selectedWorkplaceId === currentWorkplaceId : null,
    };
  }, [currentWorkplaceId, practiceState.submitted, selectedWorkplaceId, workplaces]);

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
    setCurrentWorkplaces(buildWorkplacesForActivity(workplaces, nextActivity.workplaceId));
    setCurrentDuties(buildDutiesForActivity(duties, nextActivity.correctDutyIds));
    setSelectedWorkplaceId(null);
    setSelectedDutyIds([]);
    setDutyResult(null);
  }, [activities, workplaces, duties]);

  function resetAttempt(activity: Activity) {
    setPracticeState({
      currentActivityId: activity.id,
      selectedChoiceIds: [],
      submitted: false,
      result: null,
    });
    setCurrentChoices(buildChoicesForActivity(activity));
    setCurrentWorkplaces(buildWorkplacesForActivity(workplaces, activity.workplaceId));
    setCurrentDuties(buildDutiesForActivity(duties, activity.correctDutyIds));
    setSelectedWorkplaceId(null);
    setSelectedDutyIds([]);
    setDutyResult(null);
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

    if (practiceMode === "duties") {
      const correctDutyIds = currentActivity.correctDutyIds ?? [];
      if (correctDutyIds.length === 0) {
        setNotice("此人物尚未設定職責");
        return;
      }

      if (selectedDutyIds.length === 0) {
        setNotice("請先選擇職責");
        return;
      }

      const selectedIds = new Set(selectedDutyIds);
      const correctIds = new Set(correctDutyIds);
      const selectedDuties = duties.filter((duty) => selectedIds.has(duty.id));
      const correctSelected = selectedDuties.filter((duty) => correctIds.has(duty.id));
      const wrongSelected = selectedDuties.filter((duty) => !correctIds.has(duty.id));
      const missedCorrect = duties.filter((duty) => correctIds.has(duty.id) && !selectedIds.has(duty.id));

      setDutyResult({
        correctSelected,
        wrongSelected,
        missedCorrect,
        isPerfect: wrongSelected.length === 0 && missedCorrect.length === 0,
      });
      setPracticeState((previousState) => ({
        ...previousState,
        submitted: true,
      }));
      setNotice("");
      return;
    }

    if (practiceState.selectedChoiceIds.length === 0) {
      setNotice("請先選擇物品");
      return;
    }

    const correctWorkplace = workplaces.find((workplace) => workplace.id === currentWorkplaceId);
    if (correctWorkplace && !selectedWorkplaceId) {
      setNotice("請先選擇工作場所");
      return;
    }

    const result = scoreChoices(currentChoices, practiceState.selectedChoiceIds, currentActivity.correctItemIds);
    const workplaceIsPerfect = correctWorkplace ? selectedWorkplaceId === currentWorkplaceId : true;
    const correctTotal = currentActivity.correctItemIds.length;
    const nextStats = updateStatsAfterSubmit(
      stats,
      currentActivity.id,
      { ...result, isPerfect: result.isPerfect && workplaceIsPerfect },
      correctTotal,
    );
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
    setDutyResult(null);
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

  function handleChangePracticeMode(nextMode: PracticeMode) {
    setPracticeMode(nextMode);
    setNotice("");
  }

  function handleToggleDuty(dutyId: string) {
    if (practiceState.submitted) return;

    const duty = duties.find((item) => item.id === dutyId);
    const correctDutyIds = currentActivity.correctDutyIds ?? [];

    setSelectedDutyIds([dutyId]);

    if (correctDutyIds.length === 0) {
      setNotice("此人物尚未設定職責");
    } else if (correctDutyIds.includes(dutyId)) {
      setNotice(`正確：${duty?.displayName ?? "這項"} 是相關職責`);
    } else {
      setNotice(`再試試：${duty?.displayName ?? "這項"} 不是這題的正確職責`);
    }
  }

  function handleSelectWorkplace(workplaceId: string) {
    const workplace = workplaces.find((item) => item.id === workplaceId);
    setSelectedWorkplaceId(workplaceId);

    if (practiceState.submitted) return;

    if (!currentWorkplaceId) {
      setNotice("此人物尚未設定工作場所");
      return;
    }

    if (workplaceId === currentWorkplaceId) {
      setNotice(`正確，${currentActivity.displayName}在${workplace?.displayName ?? "這裡"}工作。`);
      return;
    }

    setNotice(`再試試，這不是${currentActivity.displayName}工作的地方。`);
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
          <ZipImportButton className="secondary-button" onPackLoaded={onPackLoaded} onError={setImportError} />
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

      {importError && (
        <div className="message-box error-box" role="alert">
          {importError}
        </div>
      )}

      <div className="practice-layout">
        <ActivityPanel
          activity={currentActivity}
          selectedChoices={selectedChoices}
          submitted={practiceState.submitted}
          practiceMode={practiceMode}
          onRemoveChoice={handleToggleChoice}
          onChangePracticeMode={handleChangePracticeMode}
        />
        {practiceMode === "items" ? (
          <ChoiceGrid
            choices={currentChoices}
            selectedChoiceIds={practiceState.selectedChoiceIds}
            submitted={practiceState.submitted}
            result={practiceState.result}
            onToggleChoice={handleToggleChoice}
          />
        ) : practiceMode === "workplace" ? (
          <WorkplacePracticePanel
            leftText="在"
            rightText="工作"
            workplaces={currentWorkplaces}
            correctWorkplaceId={currentWorkplaceId}
            selectedWorkplaceId={selectedWorkplaceId}
            submitted={practiceState.submitted}
            onSelectWorkplace={handleSelectWorkplace}
          />
        ) : (
          <DutyPracticePanel
            activityName={currentActivity.displayName}
            duties={currentDuties}
            correctDutyIds={currentActivity.correctDutyIds}
            selectedDutyIds={selectedDutyIds}
            onToggleDuty={handleToggleDuty}
            submitted={practiceState.submitted}
          />
        )}
      </div>

      <footer className="bottom-actions">
        <div className="notice" role="status" aria-live="polite">
          {notice}
        </div>
        <div className="action-cluster">
          {!practiceState.submitted ? (
            <>
              <button type="button" className="secondary-button" onClick={handleClearSelection}>
                清除選擇
              </button>
              <button type="button" className="primary-button" onClick={handleSubmit}>
                提交答案
              </button>
            </>
          ) : (
            <>
              <button type="button" className="secondary-button" onClick={handleClearSelection}>
                再做一次
              </button>
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

      {practiceState.result && (
        <ResultPanel
          result={practiceState.result}
          workplaceResult={workplaceSubmitResult}
          activityName={currentActivity.displayName}
        />
      )}

      {dutyResult && (
        <aside className={`result-panel ${dutyResult.isPerfect ? "is-perfect" : ""}`} aria-live="polite">
          <h2>{dutyResult.isPerfect ? "答對了！" : "還差一點"}</h2>
          <p>
            職責答對了 {dutyResult.correctSelected.length} /{" "}
            {dutyResult.correctSelected.length + dutyResult.missedCorrect.length} 個
          </p>
          {dutyResult.missedCorrect.length > 0 && (
            <p>漏選：{dutyResult.missedCorrect.map((duty) => duty.displayName).join(", ")}</p>
          )}
          {dutyResult.wrongSelected.length > 0 && (
            <p>多選：{dutyResult.wrongSelected.map((duty) => duty.displayName).join(", ")}</p>
          )}
        </aside>
      )}

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
