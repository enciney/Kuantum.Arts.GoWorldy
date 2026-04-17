import crypto from "crypto";
import { getDb } from "./db";
import { IUserRepository, User } from "../interfaces";

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
}
