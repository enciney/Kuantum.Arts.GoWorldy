import path from "path";
import fs from "fs";

export default async function () {
  const mongod = (global as any).__MONGOD__;
  if (mongod) await mongod.stop();
  const uriFile = path.join(__dirname, ".mongo-uri");
  if (fs.existsSync(uriFile)) fs.unlinkSync(uriFile);
}
