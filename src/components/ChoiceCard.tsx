import type { ChoiceItem, SubmitResult } from "../types";

type ChoiceCardProps = {
  choice: ChoiceItem;
  selected: boolean;
  submitted: boolean;
  result: SubmitResult | null;
  onToggle: (choiceId: string) => void;
};

function getResultClass(choice: ChoiceItem, selected: boolean, result: SubmitResult | null): string {
  if (!result) return "";

  if (selected && choice.isCorrect) return "is-selected-correct";
  if (selected && !choice.isCorrect) return "is-selected-wrong";
  if (!selected && choice.isCorrect) return "is-missed";
  return "is-dimmed";
}

function getInstantFeedbackClass(choice: ChoiceItem, selected: boolean, submitted: boolean): string {
  if (submitted || !selected) return "";
  return choice.isCorrect ? "is-instant-correct" : "is-instant-wrong";
}

export default function ChoiceCard({ choice, selected, submitted, result, onToggle }: ChoiceCardProps) {
  const resultClass = submitted ? getResultClass(choice, selected, result) : "";
  const instantFeedbackClass = getInstantFeedbackClass(choice, selected, submitted);

  return (
    <button
      type="button"
      className={`choice-card ${selected ? "is-selected" : ""} ${instantFeedbackClass} ${resultClass}`}
      onClick={() => onToggle(choice.id)}
      disabled={submitted}
      aria-pressed={selected}
    >
      <span className="check-mark" aria-hidden="true">
        {selected ? "✓" : ""}
      </span>
      <img src={choice.image.objectUrl} alt={choice.image.alt} draggable={false} />
      <span className="choice-label">{choice.label}</span>
    </button>
  );
}
