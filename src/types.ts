export type Manifest = {
  title: string;
  version?: string;
  activities: ManifestActivity[];
  items?: ManifestItem[];
  workplaces?: ManifestWorkplace[];
  duties?: ManifestDuty[];
};

export type ManifestActivity = {
  id: string;
  displayName: string;
  englishName?: string;
  category?: string;
  personImage?: string;
  correctItems: string[];
  correctDuties?: string[];
  workplaceId?: string;
  distractorCount?: number;
};

export type ManifestItem = {
  id: string;
  displayName?: string;
  englishName?: string;
  image?: string;
};

export type ManifestWorkplace = {
  id: string;
  displayName?: string;
  englishName?: string;
  image?: string;
};

export type ManifestDuty = {
  id: string;
  displayName?: string;
  englishName?: string;
  image?: string;
};

export type Activity = {
  id: string;
  displayName: string;
  englishName?: string;
  category?: string;
  targetImage: ImageAsset;
  correctItemIds: string[];
  correctDutyIds?: string[];
  workplaceId?: string;
  distractorCount?: number;
  itemPool: ImageAsset[];
};

export type Workplace = {
  id: string;
  displayName: string;
  englishName?: string;
  image: ImageAsset;
};

export type Duty = {
  id: string;
  displayName: string;
  englishName?: string;
  image?: ImageAsset;
};

export type ImageAsset = {
  id: string;
  fileName: string;
  objectUrl: string;
  alt: string;
};

export type ChoiceItem = {
  id: string;
  label: string;
  image: ImageAsset;
  isCorrect: boolean;
};

export type ActivityStats = {
  activityId: string;
  timesPlayed: number;
  correctCount: number;
  wrongCount: number;
  lastPlayedAt?: string;
  lastScore?: {
    correctSelected: number;
    totalCorrect: number;
    extraWrongSelected: number;
    missedCorrect: number;
  };
};

export type PracticeState = {
  currentActivityId: string | null;
  selectedChoiceIds: string[];
  submitted: boolean;
  result: SubmitResult | null;
};

export type SubmitResult = {
  correctSelected: ChoiceItem[];
  wrongSelected: ChoiceItem[];
  missedCorrect: ChoiceItem[];
  isPerfect: boolean;
};

export type WorkplaceSubmitResult = {
  selectedWorkplaceId: string | null;
  correctWorkplaceId?: string;
  selectedWorkplaceName?: string;
  correctWorkplaceName?: string;
  isCorrect: boolean | null;
};

export type DutySubmitResult = {
  correctSelected: Duty[];
  wrongSelected: Duty[];
  missedCorrect: Duty[];
  isPerfect: boolean;
};

export type LoadActivitiesResult = {
  title: string;
  version?: string;
  activities: Activity[];
  workplaces: Workplace[];
  duties: Duty[];
  warnings: string[];
};
