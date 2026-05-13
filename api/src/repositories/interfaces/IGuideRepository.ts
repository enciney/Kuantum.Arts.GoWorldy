export interface GuideStep {
  id: string;
  countryId: string;
  order: number;
  question: string;
  description?: string;
  blockingAnswer?: string;
  options?: string[];
  faqUrl?: string;
  stepType?: "checklist" | "assessment";
  isGlobal?: boolean;
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

export interface UserGuideHomeStats {
  countryId: string;
  countryName: string;
  completedSteps: number;
  totalSteps: number;
  completionPct: number;
  countriesWithProgress: number;
}

export interface IGuideRepository {
  getSteps(countryId: string): Promise<GuideStep[]>;
  createStep(data: Omit<GuideStep, "id">): Promise<GuideStep>;
  getUserProgress(userId: string): Promise<UserGuideProgress[]>;
  getUserProgressForCountry(userId: string, countryId: string): Promise<UserGuideProgress[]>;
  saveProgress(data: Omit<UserGuideProgress, "id" | "completedAt">): Promise<UserGuideProgress>;
  resetAllChecklistProgress(userId: string, countryId: string): Promise<number>;
  getUserCountryProgressCount(userId: string): Promise<number>;
  getUserHomeStats(userId: string, countryId: string): Promise<UserGuideHomeStats>;
  getStats(): Promise<GuideStats>;
  getRecentProgress(userId: string, limit: number): Promise<{
    stepId: string;
    question: string;
    answer: string;
    completedAt: string;
  }[]>;
}
