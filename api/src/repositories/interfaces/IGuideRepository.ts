export interface GuideStep {
  id: string;
  countryId: string;
  order: number;
  question: string;
  description?: string;
}

export interface UserGuideProgress {
  id: string;
  userId: string;
  stepId: string;
  answer: string;
  completedAt: string;
}

export interface IGuideRepository {
  getSteps(countryId: string): Promise<GuideStep[]>;
  createStep(data: Omit<GuideStep, "id">): Promise<GuideStep>;
  getUserProgress(userId: string): Promise<UserGuideProgress[]>;
  saveProgress(data: Omit<UserGuideProgress, "id" | "completedAt">): Promise<UserGuideProgress>;
}
