export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  bio?: string;
  role: "admin" | "moderator" | "user";
  userType: "emigrant" | "consultant" | "diaspora";
  credits: number;
  isPremium: boolean;
  premiumUntil?: string;
  phoneNumber?: string;
  sharePhoneNumber?: boolean;
  avatarUrl?: string;
  onboardingCompleted?: boolean;
  targetCountryId?: string;
  createdAt: string;
}

export interface UserSearchParams {
  search?: string;
  role?: string;
  userType?: string;
  limit: number;
  offset: number;
}

export interface UserTypeStats {
  userType: string;
  count: number;
}

export interface IUserRepository {
  create(user: Omit<User, "id" | "createdAt">): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateRole(id: string, role: User["role"]): Promise<void>;
  update(id: string, data: Partial<User>): Promise<void>;
  addCredits(id: string, amount: number): Promise<void>;
  deductCredits(id: string, amount: number): Promise<boolean>;
  count(): Promise<number>;
  getUserTypeStats(): Promise<UserTypeStats[]>;
  getRecent(limit: number): Promise<User[]>;
  search(params: UserSearchParams): Promise<User[]>;
}
