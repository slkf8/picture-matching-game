import type { ChoiceItem, SubmitResult } from "../types";

export function scoreChoices(
  choices: ChoiceItem[],
  selectedChoiceIds: string[],
  correctItemIds: string[],
): SubmitResult {
  const selectedIds = new Set(selectedChoiceIds);
  const correctIds = new Set(correctItemIds);
  const selected = choices.filter((item) => selectedIds.has(item.id));
  const correctItems = choices.filter((item) => correctIds.has(item.id));
  const correctSelected = selected.filter((item) => correctIds.has(item.id));
  const wrongSelected = selected.filter((item) => !correctIds.has(item.id));
  const missedCorrect = correctItems.filter((item) => !selectedIds.has(item.id));

  return {
    correctSelected,
    wrongSelected,
    missedCorrect,
    isPerfect: wrongSelected.length === 0 && missedCorrect.length === 0,
  };
}
