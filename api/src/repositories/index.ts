import { IUserRepository, IForumRepository, IGuideRepository, IPaymentProvider, INotificationRepository, IPremiumRepository } from "./interfaces";
import { MongoUserRepository } from "./mongodb/MongoUserRepository";
import { MongoForumRepository } from "./mongodb/MongoForumRepository";
import { MongoGuideRepository } from "./mongodb/MongoGuideRepository";
import { MongoNotificationRepository } from "./mongodb/MongoNotificationRepository";
import { MongoPremiumRepository } from "./mongodb/MongoPremiumRepository";
import { StripePaymentProvider } from "./stripe/StripePaymentProvider";

export interface Repositories {
  users: IUserRepository;
  forum: IForumRepository;
  guide: IGuideRepository;
  payment: IPaymentProvider;
  notifications: INotificationRepository;
  premium: IPremiumRepository;
}

export function createRepositories(): Repositories {
  return {
    users: new MongoUserRepository(),
    forum: new MongoForumRepository(),
    guide: new MongoGuideRepository(),
    payment: new StripePaymentProvider(),
    notifications: new MongoNotificationRepository(),
    premium: new MongoPremiumRepository(),
  };
}
