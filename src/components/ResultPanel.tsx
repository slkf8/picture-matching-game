import type { SubmitResult } from "../types";

type ResultPanelProps = {
  result: SubmitResult;
};

function labels(items: { label: string }[]) {
  return items.map((item) => item.label).join(", ");
}

export default function ResultPanel({ result }: ResultPanelProps) {
  const totalCorrect = result.correctSelected.length + result.missedCorrect.length;

  return (
    <aside className={`result-panel ${result.isPerfect ? "is-perfect" : ""}`} aria-live="polite">
      <h2>{result.isPerfect ? "答對了！" : "還差一點"}</h2>
      {result.isPerfect ? (
        <p>你找到了全部相關物品。</p>
      ) : (
        <>
          <p>
            你選對了 {result.correctSelected.length} / {totalCorrect} 個
          </p>
          {result.missedCorrect.length > 0 && <p>漏選：{labels(result.missedCorrect)}</p>}
          {result.wrongSelected.length > 0 && <p>多選：{labels(result.wrongSelected)}</p>}
        </>
      )}
    </aside>
  );
}
