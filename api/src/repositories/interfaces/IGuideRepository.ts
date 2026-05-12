export interface GuideStep {
  id: string;
  countryId: string;
  order: number;
  question: string;
  description?: string;
  blockingAnswer?: string;
  options?: string[];
  faqUrl?: string;
}

export interface UserGuideProgress {
  id: string;
  userId: string;
  stepId: string;
  answer: string;
  completedAt: string;
}

export interface GuideStats {
  totalSteps: number;
  totalUsersWithProgress: number;
  averageCompletion: number;
}

export interface IGuideRepository {
  getSteps(countryId: string): Promise<GuideStep[]>;
  createStep(data: Omit<GuideStep, "id">): Promise<GuideStep>;
  getUserProgress(userId: string): Promise<UserGuideProgress[]>;
  saveProgress(data: Omit<UserGuideProgress, "id" | "completedAt">): Promise<UserGuideProgress>;
  getStats(): Promise<GuideStats>;
  getRecentProgress(userId: string, limit: number): Promise<{
    stepId: string;
    question: string;
    answer: string;
    completedAt: string;
  }[]>;
}
