import type { ChoiceItem } from "../types";

type SelectedTrayProps = {
  choices: ChoiceItem[];
  submitted: boolean;
  onRemoveChoice: (choiceId: string) => void;
};

export default function SelectedTray({ choices, submitted, onRemoveChoice }: SelectedTrayProps) {
  return (
    <section className="selected-tray" aria-labelledby="selected-title">
      <h3 id="selected-title">已選物品</h3>
      {choices.length === 0 ? (
        <p className="empty-text">尚未選擇物品</p>
      ) : (
        <div className="selected-items">
          {choices.map((choice) => (
            <button
              type="button"
              className="selected-chip"
              key={choice.id}
              onClick={() => onRemoveChoice(choice.id)}
              disabled={submitted}
              aria-label={`移除 ${choice.label}`}
            >
              <img src={choice.image.objectUrl} alt={choice.image.alt} draggable={false} />
              <span>{choice.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
