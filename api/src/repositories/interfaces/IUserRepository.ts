export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  bio?: string;
  role: "admin" | "moderator" | "user";
  userType: "emigrant" | "consultant" | "expat";
  createdAt: string;
}

export interface IUserRepository {
  create(user: Omit<User, "id" | "createdAt">): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateRole(id: string, role: User["role"]): Promise<void>;
  update(id: string, data: Partial<User>): Promise<void>;
}
