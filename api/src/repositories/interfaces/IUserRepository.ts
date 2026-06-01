export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  bio?: string;
  role: "admin" | "moderator" | "user";
  userType: "emigrant" | "consultant" | "diaspora";
  isPremium: boolean;
  premiumUntil?: string;
  autoRenew?: boolean;
  phoneNumber?: string;
  sharePhoneNumber?: boolean;
  avatarUrl?: string;
  onboardingCompleted?: boolean;
  targetCountryId?: string;
  activeGuideCountryId?: string;
  isBanned?: boolean;
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
  setBanned(id: string, banned: boolean): Promise<void>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
  getUserTypeStats(): Promise<UserTypeStats[]>;
  getRecent(limit: number): Promise<User[]>;
  search(params: UserSearchParams): Promise<User[]>;
  findByRole(role: User["role"]): Promise<User[]>;
}
