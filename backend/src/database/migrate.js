require("dotenv").config();
const { Pool } = require("pg");

const shouldClearMessages = process.argv.includes("--clear-messages");
const shouldResetMessagesTable = process.argv.includes("--reset-messages-table");
const shouldResetTrailsTable = process.argv.includes("--reset-trails-table");

const pool = new Pool({
  host: process.env.DB_ENDPOINT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

const createMessagesTable = `
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    speaker SMALLINT NOT NULL,
    content TEXT NOT NULL,
    helper_name TEXT,
    helper_payload JSONB,
    helper_call_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createTrailsTable = `
  CREATE TABLE IF NOT EXISTS trails (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    difficulty SMALLINT CHECK (difficulty IN (-1, 0, 1)),
    length REAL,
    elevation REAL,
    reviews INTEGER,
    rating REAL,
    route_type TEXT
  );
`;

async function migrate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (shouldResetMessagesTable) {
      await client.query("DROP TABLE IF EXISTS messages;");
      console.log("Dropped existing messages table.");
    }

    if (shouldResetTrailsTable) {
      await client.query("DROP TABLE IF EXISTS trails;");
      console.log("Dropped existing trails table.");
    }

    await client.query(createMessagesTable);
    await client.query(createTrailsTable);
    await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS helper_name TEXT;");
    await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS helper_payload JSONB;");
    await client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS helper_call_id TEXT;");
    await client.query("CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);");
    await client.query("CREATE INDEX IF NOT EXISTS idx_messages_user_id_id ON messages(user_id, id);");
    await client.query("CREATE INDEX IF NOT EXISTS idx_trails_name ON trails(name);");

    if (shouldClearMessages) {
      await client.query("TRUNCATE TABLE messages RESTART IDENTITY;");
      console.log("Cleared all message rows.");
    }

    await client.query("COMMIT");
    console.log("Database migration completed.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Database migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
