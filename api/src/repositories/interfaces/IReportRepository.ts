export type ReportTargetType = "topic" | "comment";
export type ReportReason = "spam" | "abuse" | "misleading" | "copyright" | "other";
export type ReportStatus = "pending" | "resolved" | "dismissed";

export interface ContentReport {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface IReportRepository {
  create(data: {
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    description?: string;
  }): Promise<ContentReport>;

  findByReporterAndTarget(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string
  ): Promise<ContentReport | null>;

  getByStatus(status: ReportStatus, limit: number, offset: number): Promise<ContentReport[]>;
  getById(id: string): Promise<ContentReport | null>;
  resolve(id: string, status: "resolved" | "dismissed", resolvedBy: string, resolution?: string): Promise<void>;
  countByStatus(status: ReportStatus): Promise<number>;
}
