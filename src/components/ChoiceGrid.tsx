import type { ChoiceItem, SubmitResult } from "../types";
import ChoiceCard from "./ChoiceCard";

type ChoiceGridProps = {
  choices: ChoiceItem[];
  selectedChoiceIds: string[];
  submitted: boolean;
  result: SubmitResult | null;
  onToggleChoice: (choiceId: string) => void;
};

export default function ChoiceGrid({ choices, selectedChoiceIds, submitted, result, onToggleChoice }: ChoiceGridProps) {
  return (
    <section className="choice-grid-panel" aria-labelledby="choice-grid-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">物品圖片</p>
          <h2 id="choice-grid-title">選出相關物品</h2>
        </div>
        <span className="choice-count">{selectedChoiceIds.length} 已選</span>
      </div>

      <div className="choice-grid">
        {choices.map((choice) => (
          <ChoiceCard
            key={choice.id}
            choice={choice}
            selected={selectedChoiceIds.includes(choice.id)}
            submitted={submitted}
            result={result}
            onToggle={onToggleChoice}
          />
        ))}
      </div>
    </section>
  );
}
