import crypto from "crypto";
import { getCollections, toDoc } from "./db";
import { IUserRepository, User, UserSearchParams, UserTypeStats } from "../interfaces";

export class MongoUserRepository implements IUserRepository {
  async create(data: Omit<User, "id" | "createdAt">): Promise<User> {
    const { users } = await getCollections();
    const id = crypto.randomUUID();
    const doc = { _id: id, ...data, createdAt: new Date().toISOString() };
    await users.insertOne(doc);
    return toDoc<User>(doc);
  }

  async findById(id: string): Promise<User | null> {
    const { users } = await getCollections();
    const doc = await users.findOne({ _id: id });
    return doc ? toDoc<User>(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { users } = await getCollections();
    const doc = await users.findOne({ email });
    return doc ? toDoc<User>(doc) : null;
  }

  async addCredits(id: string, amount: number): Promise<void> {
    const { users } = await getCollections();
    await users.updateOne({ _id: id }, { $inc: { credits: amount } });
  }

  async deductCredits(id: string, amount: number): Promise<boolean> {
    const { users } = await getCollections();
    const result = await users.updateOne(
      { _id: id, credits: { $gte: amount } },
      { $inc: { credits: -amount } }
    );
    return result.modifiedCount > 0;
  }

  async updateRole(id: string, role: User["role"]): Promise<void> {
    const { users } = await getCollections();
    await users.updateOne({ _id: id }, { $set: { role } });
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    const { users } = await getCollections();
    const { id: _omitId, createdAt: _omitCa, ...fields } = data as any;
    if (!Object.keys(fields).length) return;
    await users.updateOne({ _id: id }, { $set: fields });
  }

  async count(): Promise<number> {
    const { users } = await getCollections();
    return users.countDocuments();
  }

  async getUserTypeStats(): Promise<UserTypeStats[]> {
    const { users } = await getCollections();
    const agg = await users.aggregate([
      { $group: { _id: "$userType", count: { $sum: 1 } } },
    ]).toArray();
    return agg.map((r) => ({ userType: r._id as string, count: r.count as number }));
  }

  async getRecent(limit: number): Promise<User[]> {
    const { users } = await getCollections();
    const docs = await users.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map((d) => toDoc<User>(d));
  }

  async search(params: UserSearchParams): Promise<User[]> {
    const { users } = await getCollections();
    const filter: Record<string, unknown> = {};
    if (params.search) {
      // SEC-04: Regex özel karakterlerini escape et — NoSQL injection önleme
      const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(escaped, "i");
      filter.$or = [{ displayName: re }, { email: re }];
    }
    if (params.role) filter.role = params.role;
    if (params.userType) filter.userType = params.userType;
    const docs = await users.find(filter).sort({ createdAt: -1 }).skip(params.offset).limit(params.limit).toArray();
    return docs.map((d) => toDoc<User>(d));
  }

  async findByRole(role: User["role"]): Promise<User[]> {
    const { users } = await getCollections();
    const docs = await users.find({ role }).toArray();
    return docs.map((d) => toDoc<User>(d));
  }
}
