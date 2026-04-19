import crypto from "crypto";
import { getDb } from "./db";
import { IUserRepository, User, UserSearchParams, UserTypeStats } from "../interfaces";

export class SqliteUserRepository implements IUserRepository {
  async create(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const db = getDb();
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO users (id, email, passwordHash, displayName, bio, role, userType) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.email, data.passwordHash, data.displayName, data.bio || null, data.role, data.userType);
    return this.findById(id) as Promise<User>;
  }

  async findById(id: string): Promise<User | null> {
    return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return getDb().prepare("SELECT * FROM users WHERE email = ?").get(email) as User | null;
  }

  async updateRole(id: string, role: User["role"]): Promise<void> {
    getDb().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    const fields = Object.entries(data).filter(([k]) => k !== "id" && k !== "createdAt");
    if (!fields.length) return;
    const set = fields.map(([k]) => `${k} = ?`).join(", ");
    getDb().prepare(`UPDATE users SET ${set} WHERE id = ?`).run(...fields.map(([, v]) => v), id);
  }

  async count(): Promise<number> {
    const result = getDb().prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
    return result.count;
  }

  async getUserTypeStats(): Promise<UserTypeStats[]> {
    return getDb().prepare("SELECT userType, COUNT(*) as count FROM users GROUP BY userType").all() as UserTypeStats[];
  }

  async getRecent(limit: number): Promise<User[]> {
    return getDb().prepare("SELECT * FROM users ORDER BY createdAt DESC LIMIT ?").all(limit) as User[];
  }

  async search(params: UserSearchParams): Promise<User[]> {
    let query = "SELECT * FROM users WHERE 1=1";
    const bindings: any[] = [];

    if (params.search) {
      query += " AND (displayName LIKE ? OR email LIKE ?)";
      const searchPattern = `%${params.search}%`;
      bindings.push(searchPattern, searchPattern);
    }
    if (params.role) {
      query += " AND role = ?";
      bindings.push(params.role);
    }
    if (params.userType) {
      query += " AND userType = ?";
      bindings.push(params.userType);
    }

    query += " ORDER BY createdAt DESC LIMIT ? OFFSET ?";
    bindings.push(params.limit, params.offset);

    return getDb().prepare(query).all(...bindings) as User[];
  }
}
