import { MongoMemoryServer } from "mongodb-memory-server";
import path from "path";
import fs from "fs";

export default async function () {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  // Write URI to a temp file that each test worker can read
  fs.writeFileSync(path.join(__dirname, ".mongo-uri"), uri, "utf-8");
  (global as any).__MONGOD__ = mongod;
  process.env.DB_CONNECTION_STRING = uri;
}
