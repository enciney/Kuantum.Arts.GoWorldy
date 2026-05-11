import crypto from "crypto";
import { getDb } from "./db";
import { IUserRepository, User, UserSearchParams, UserTypeStats } from "../interfaces";

function toUser(row: unknown): User | null {
  if (!row) return null;
  const r = row as Record<string, unknown>;
  return {
    ...r,
    isPremium: r.isPremium === 1 || r.isPremium === true,
    sharePhoneNumber: r.sharePhoneNumber === 1 || r.sharePhoneNumber === true,
  } as User;
}

export class SqliteUserRepository implements IUserRepository {
  async create(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const db = getDb();
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO users (id, email, passwordHash, displayName, bio, role, userType, credits, isPremium, premiumUntil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id, data.email, data.passwordHash, data.displayName, data.bio || null,
      data.role, data.userType, data.credits ?? 0, data.isPremium ? 1 : 0, data.premiumUntil || null
    );
    return this.findById(id) as Promise<User>;
  }

  async findById(id: string): Promise<User | null> {
    return toUser(getDb().prepare("SELECT * FROM users WHERE id = ?").get(id));
  }

  async findByEmail(email: string): Promise<User | null> {
    return toUser(getDb().prepare("SELECT * FROM users WHERE email = ?").get(email));
  }

  async addCredits(id: string, amount: number): Promise<void> {
    getDb().prepare("UPDATE users SET credits = credits + ? WHERE id = ?").run(amount, id);
  }

  async deductCredits(id: string, amount: number): Promise<boolean> {
    const result = getDb()
      .prepare("UPDATE users SET credits = credits - ? WHERE id = ? AND credits >= ?")
      .run(amount, id, amount) as { changes: number };
    return result.changes > 0;
  }

  async updateRole(id: string, role: User["role"]): Promise<void> {
    getDb().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    const fields = Object.entries(data).filter(([k]) => k !== "id" && k !== "createdAt");
    if (!fields.length) return;
    const set = fields.map(([k]) => `${k} = ?`).join(", ");
    const sqlValues = fields.map(([, v]) => (typeof v === "boolean" ? (v ? 1 : 0) : v));
    getDb().prepare(`UPDATE users SET ${set} WHERE id = ?`).run(...sqlValues, id);
  }

  async count(): Promise<number> {
    const result = getDb().prepare("SELECT COUNT(*) as count FROM users").get() as unknown as { count: number };
    return result.count;
  }

  async getUserTypeStats(): Promise<UserTypeStats[]> {
    return getDb().prepare("SELECT userType, COUNT(*) as count FROM users GROUP BY userType").all() as unknown as UserTypeStats[];
  }

  async getRecent(limit: number): Promise<User[]> {
    return (getDb().prepare("SELECT * FROM users ORDER BY createdAt DESC LIMIT ?").all(limit) as unknown[]).map(toUser).filter(Boolean) as User[];
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

    return (getDb().prepare(query).all(...bindings) as unknown[]).map(toUser).filter(Boolean) as User[];
  }
}
