import crypto from "crypto";
import { getCollections, toDoc } from "./db";
import {
  IReportRepository,
  ContentReport,
  ReportTargetType,
  ReportReason,
  ReportStatus,
} from "../interfaces";

export class MongoReportRepository implements IReportRepository {
  async create(data: {
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    description?: string;
  }): Promise<ContentReport> {
    const { contentReports } = await getCollections();
    const id = crypto.randomUUID();
    const doc = {
      _id: id,
      reporterId: data.reporterId,
      targetType: data.targetType,
      targetId: data.targetId,
      reason: data.reason,
      description: data.description,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };
    await contentReports.insertOne(doc);
    return toDoc<ContentReport>(doc);
  }

  async findByReporterAndTarget(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string
  ): Promise<ContentReport | null> {
    const { contentReports } = await getCollections();
    const doc = await contentReports.findOne({ reporterId, targetType, targetId });
    return doc ? toDoc<ContentReport>(doc) : null;
  }

  async getByStatus(status: ReportStatus, limit: number, offset: number): Promise<ContentReport[]> {
    const { contentReports } = await getCollections();
    const docs = await contentReports
      .find({ status })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    return docs.map((d) => toDoc<ContentReport>(d));
  }

  async getById(id: string): Promise<ContentReport | null> {
    const { contentReports } = await getCollections();
    const doc = await contentReports.findOne({ _id: id });
    return doc ? toDoc<ContentReport>(doc) : null;
  }

  async resolve(id: string, status: "resolved" | "dismissed", resolvedBy: string, resolution?: string): Promise<void> {
    const { contentReports } = await getCollections();
    const update: Record<string, unknown> = {
      status,
      resolvedBy,
      resolvedAt: new Date().toISOString(),
    };
    if (resolution !== undefined) update.resolution = resolution;
    await contentReports.updateOne({ _id: id }, { $set: update });
  }

  async countByStatus(status: ReportStatus): Promise<number> {
    const { contentReports } = await getCollections();
    return contentReports.countDocuments({ status });
  }
}
