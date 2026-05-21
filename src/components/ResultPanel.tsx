import type { SubmitResult, WorkplaceSubmitResult } from "../types";

type ResultPanelProps = {
  result: SubmitResult;
  workplaceResult?: WorkplaceSubmitResult;
  activityName: string;
};

function labels(items: { label: string }[]) {
  return items.map((item) => item.label).join(", ");
}

export default function ResultPanel({ result, workplaceResult, activityName }: ResultPanelProps) {
  const totalCorrect = result.correctSelected.length + result.missedCorrect.length;
  const workplaceIsPerfect = workplaceResult ? workplaceResult.isCorrect !== false : true;
  const isPerfect = result.isPerfect && workplaceIsPerfect;

  return (
    <aside className={`result-panel ${isPerfect ? "is-perfect" : ""}`} aria-live="polite">
      <h2>{isPerfect ? "答對了！" : "還差一點"}</h2>
      {result.isPerfect ? <p>你找到了全部相關物品。</p> : null}
      {!result.isPerfect && (
        <div>
          <p>
            你選對了 {result.correctSelected.length} / {totalCorrect} 個
          </p>
          {result.missedCorrect.length > 0 && <p>漏選：{labels(result.missedCorrect)}</p>}
          {result.wrongSelected.length > 0 && <p>多選：{labels(result.wrongSelected)}</p>}
        </div>
      )}

      {workplaceResult && workplaceResult.isCorrect === true && (
        <p>
          工作場所：正確，{activityName}在{workplaceResult.correctWorkplaceName}工作。
        </p>
      )}
      {workplaceResult && workplaceResult.isCorrect === false && (
        <p>
          工作場所：答案是{workplaceResult.correctWorkplaceName}
          {workplaceResult.selectedWorkplaceName ? `，你選了${workplaceResult.selectedWorkplaceName}。` : "。"}
        </p>
      )}
    </aside>
  );
}
