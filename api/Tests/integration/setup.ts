import path from "path";
import fs from "fs";

const uriFile = path.join(__dirname, ".mongo-uri");
if (fs.existsSync(uriFile)) {
  process.env.DB_CONNECTION_STRING = fs.readFileSync(uriFile, "utf-8").trim();
}
