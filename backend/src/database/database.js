require('dotenv').config();
const { Pool } = require("pg");
const OpenAI = require('openai');

const pool = new Pool({
  host: process.env.DB_ENDPOINT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

// async function test() {
//   try {
//     // Drop table safely
//     await pool.query(`DROP TABLE IF EXISTS messages;`);

//     // Create table
//     await pool.query(`
//       CREATE TABLE messages (
//         id SERIAL PRIMARY KEY,
//         user_id TEXT,
//         speaker SMALLINT,
//         content TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     // Create index
//     await pool.query(`
//       CREATE INDEX idx_messages_user_id ON messages(user_id);
//     `);

//     console.log("Table and index created successfully");
//   } catch (err) {
//     console.error("Error running migrations:", err);
//   } finally {
//     await pool.end();
//   }
// }

// test();

// async function test() {
//   try {
//     // Drop table safely
//     await pool.query(`DROP TABLE IF EXISTS trails;`);

//     // Create table
//     await pool.query(`
//     CREATE TABLE trails (
//       id SERIAL PRIMARY KEY,
//       name TEXT NOT NULL,
//       location TEXT,
//       difficulty SMALLINT CHECK (difficulty IN (-1, 0, 1)),
//       length REAL,
//       elevation REAL,
//       reviews INTEGER,
//       rating REAL,
//       route_type TEXT
//     );
//   `);

//     // Optional index (useful for searching by name)
//     await pool.query(`
//       CREATE INDEX idx_trails_name ON trails(name);
//     `);

//     console.log("Trails table created successfully");
//   } catch (err) {
//     console.error("Error running migrations:", err);
//   } finally {
//     await pool.end();
//   }
// }

// test();





module.exports = { pool, openai };