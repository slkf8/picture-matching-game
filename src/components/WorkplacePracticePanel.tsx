import type { Workplace } from "../types";

type WorkplacePracticePanelProps = {
  leftText?: string;
  rightText?: string;
  workplaces: Workplace[];
  correctWorkplaceId?: string;
  selectedWorkplaceId?: string | null;
  submitted: boolean;
  onSelectWorkplace: (workplaceId: string) => void;
};

function getOptionClass(
  workplaceId: string,
  selectedWorkplaceId: string | null | undefined,
  correctWorkplaceId: string | undefined,
  submitted: boolean,
) {
  if (!correctWorkplaceId) {
    return selectedWorkplaceId === workplaceId ? "selected" : "";
  }

  if (selectedWorkplaceId === workplaceId && correctWorkplaceId === workplaceId) return "correct";
  if (selectedWorkplaceId === workplaceId && correctWorkplaceId !== workplaceId) return "incorrect";
  if (submitted && correctWorkplaceId === workplaceId) return "missed";
  return "";
}

function getFeedbackMark(
  workplaceId: string,
  selectedWorkplaceId: string | null | undefined,
  correctWorkplaceId: string | undefined,
) {
  if (selectedWorkplaceId !== workplaceId || !correctWorkplaceId) return "";
  return selectedWorkplaceId === correctWorkplaceId ? "✓" : "×";
}

export default function WorkplacePracticePanel({
  leftText = "在",
  rightText = "工作",
  workplaces,
  correctWorkplaceId,
  selectedWorkplaceId,
  submitted,
  onSelectWorkplace,
}: WorkplacePracticePanelProps) {
  const selectedWorkplace = workplaces.find((workplace) => workplace.id === selectedWorkplaceId);

  return (
    <section className="choice-grid-panel workplace-panel" aria-labelledby="workplace-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">工作場所句型</p>
          <h2 id="workplace-title">選出工作的地方</h2>
        </div>
      </div>

      <div className="workplace-sentence-row">
        <span className="workplace-sentence-text">{leftText}</span>
        <div className="workplace-center-box" aria-label="已選工作場所">
          {selectedWorkplace && (
            <img src={selectedWorkplace.image.objectUrl} alt={selectedWorkplace.displayName} draggable={false} />
          )}
        </div>
        <span className="workplace-sentence-text">{rightText}</span>
      </div>

      {workplaces.length === 0 ? (
        <p className="empty-text workplace-empty">此題庫未提供工作場所選項</p>
      ) : (
        <div className="workplace-options-grid">
          {workplaces.map((workplace) => {
            const optionClass = getOptionClass(
              workplace.id,
              selectedWorkplaceId,
              correctWorkplaceId,
              submitted,
            );
            const feedbackMark = getFeedbackMark(
              workplace.id,
              selectedWorkplaceId,
              correctWorkplaceId,
            );

            return (
              <button
                type="button"
                className={`workplace-option-card ${optionClass}`}
                key={workplace.id}
                onClick={() => onSelectWorkplace(workplace.id)}
                disabled={submitted}
                aria-pressed={selectedWorkplaceId === workplace.id}
              >
                <span className="workplace-feedback-mark" aria-hidden="true">
                  {feedbackMark}
                </span>
                <img src={workplace.image.objectUrl} alt={workplace.displayName} draggable={false} />
                <span>{workplace.displayName}</span>
                {workplace.englishName && <small>{workplace.englishName}</small>}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
