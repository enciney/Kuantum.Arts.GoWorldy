import { User } from "./IUserRepository";

export interface PremiumPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

export interface IPremiumRepository {
  getPlans(): Promise<PremiumPlan[]>;
  getPlanById(id: string): Promise<PremiumPlan | null>;
  createPlan(plan: Omit<PremiumPlan, "id" | "createdAt">): Promise<PremiumPlan>;
  updatePlan(id: string, data: Partial<Omit<PremiumPlan, "id" | "createdAt">>): Promise<void>;
  deletePlan(id: string): Promise<void>;
  getPremiumUsers(limit: number, offset: number): Promise<User[]>;
  seedDefaultPlans(): Promise<void>;
}
