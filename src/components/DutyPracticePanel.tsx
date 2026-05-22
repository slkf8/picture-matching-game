import type { Duty } from "../types";

type DutyPracticePanelProps = {
  activityName: string;
  duties: Duty[];
  correctDutyIds?: string[];
  selectedDutyIds: string[];
  onToggleDuty: (dutyId: string) => void;
  submitted: boolean;
};

function getDutyClass(dutyId: string, selectedDutyIds: string[], correctDutyIds: string[] | undefined) {
  const isSelected = selectedDutyIds.includes(dutyId);
  if (!isSelected) return "";
  if (!correctDutyIds || correctDutyIds.length === 0) return "selected";
  return correctDutyIds.includes(dutyId) ? "correct" : "incorrect";
}

function getDutyMark(dutyId: string, selectedDutyIds: string[], correctDutyIds: string[] | undefined) {
  if (!selectedDutyIds.includes(dutyId) || !correctDutyIds || correctDutyIds.length === 0) return "";
  return correctDutyIds.includes(dutyId) ? "✓" : "×";
}

export default function DutyPracticePanel({
  activityName,
  duties,
  correctDutyIds,
  selectedDutyIds,
  onToggleDuty,
  submitted,
}: DutyPracticePanelProps) {
  const selectedDuty = duties.find((duty) => duty.id === selectedDutyIds[selectedDutyIds.length - 1]);

  return (
    <section className="choice-grid-panel duty-panel" aria-labelledby="duty-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">職責圖片</p>
          <h2 id="duty-title">選出工作內容</h2>
        </div>
      </div>

      <div className="duty-sentence-row">
        <span className="duty-sentence-text">{activityName}的職責是</span>
        <div className="duty-center-box" aria-label="已選職責">
          {selectedDuty?.image ? (
            <img src={selectedDuty.image.objectUrl} alt={selectedDuty.displayName} draggable={false} />
          ) : selectedDuty ? (
            <span>{selectedDuty.displayName}</span>
          ) : null}
        </div>
      </div>

      {duties.length === 0 ? (
        <p className="empty-text duty-empty-state">此題庫未提供職責選項</p>
      ) : !correctDutyIds || correctDutyIds.length === 0 ? (
        <div>
          <p className="empty-text duty-empty-state">此人物尚未設定職責</p>
          <div className="duty-options-grid">
            {duties.map((duty) => (
              <button
                type="button"
                className={`duty-option-card ${selectedDutyIds.includes(duty.id) ? "selected" : ""}`}
                key={duty.id}
                onClick={() => onToggleDuty(duty.id)}
                disabled={submitted}
                aria-pressed={selectedDutyIds.includes(duty.id)}
              >
                {duty.image && <img src={duty.image.objectUrl} alt={duty.displayName} draggable={false} />}
                <span>{duty.displayName}</span>
                {duty.englishName && <small>{duty.englishName}</small>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="duty-options-grid">
          {duties.map((duty) => {
            const dutyClass = getDutyClass(duty.id, selectedDutyIds, correctDutyIds);
            const dutyMark = getDutyMark(duty.id, selectedDutyIds, correctDutyIds);

            return (
              <button
                type="button"
                className={`duty-option-card ${dutyClass}`}
                key={duty.id}
                onClick={() => onToggleDuty(duty.id)}
                disabled={submitted}
                aria-pressed={selectedDutyIds.includes(duty.id)}
              >
                <span className="duty-feedback-mark" aria-hidden="true">
                  {dutyMark}
                </span>
                {duty.image && <img src={duty.image.objectUrl} alt={duty.displayName} draggable={false} />}
                <span>{duty.displayName}</span>
                {duty.englishName && <small>{duty.englishName}</small>}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
