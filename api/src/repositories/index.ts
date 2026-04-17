import { config } from "../config";
import { IUserRepository, IForumRepository, IGuideRepository, IPaymentProvider } from "./interfaces";
import { SqliteUserRepository } from "./sqlite/SqliteUserRepository";
import { SqliteForumRepository } from "./sqlite/SqliteForumRepository";
import { SqliteGuideRepository } from "./sqlite/SqliteGuideRepository";
import { StripePaymentProvider } from "./stripe/StripePaymentProvider";

export interface Repositories {
  users: IUserRepository;
  forum: IForumRepository;
  guide: IGuideRepository;
  payment: IPaymentProvider;
}

export function createRepositories(): Repositories {
  const payment = new StripePaymentProvider();

  if (config.db.provider === "mongodb") {
    // TODO: MongoDB implementasyonları eklenecek
    throw new Error("MongoDB provider henüz implement edilmedi. DB_PROVIDER=sqlite kullanın.");
  }

  return {
    users: new SqliteUserRepository(),
    forum: new SqliteForumRepository(),
    guide: new SqliteGuideRepository(),
    payment,
  };
}
