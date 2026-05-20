import type { Activity, ChoiceItem, ImageAsset } from "../types";
import { shuffleArray } from "./shuffle";

const DEFAULT_CHOICE_COUNT = 12;

function choiceFromItem(item: ImageAsset, correctIds: Set<string>): ChoiceItem {
  return {
    id: item.id,
    label: item.alt,
    image: item,
    isCorrect: correctIds.has(item.id),
  };
}

export function buildChoicesForActivity(activity: Activity): ChoiceItem[] {
  const correctIds = new Set(activity.correctItemIds);
  const correctItems = activity.itemPool.filter((item) => correctIds.has(item.id));
  const distractorPool = activity.itemPool.filter((item) => !correctIds.has(item.id));
  const targetCount = correctItems.length + (activity.distractorCount ?? DEFAULT_CHOICE_COUNT - correctItems.length);
  const distractorCount = Math.min(
    Math.max(targetCount - correctItems.length, 0),
    distractorPool.length,
  );
  const distractors = shuffleArray(distractorPool).slice(0, distractorCount);

  return shuffleArray([...correctItems, ...distractors].map((item) => choiceFromItem(item, correctIds)));
}
