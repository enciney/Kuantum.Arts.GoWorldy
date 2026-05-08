const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.resolve(__dirname, "../data/goworldy.sqlite");
const db = new Database(dbPath, { readonly: true });

console.log(`DB: ${dbPath}\n`);

const tables = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
).all();

console.log("Tablolar:");
tables.forEach((t) => {
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get();
  console.log(`  ${t.name.padEnd(28)} ${count.c} kayit`);
});

console.log("\nÖrnek veriler:");
const users = db.prepare("SELECT email, role, userType FROM users LIMIT 5").all();
console.log(" Users:", users);

const countries = db.prepare("SELECT name, code FROM forum_countries").all();
console.log(" Countries:", countries.map((c) => `${c.code} ${c.name}`).join(", "));

db.close();
