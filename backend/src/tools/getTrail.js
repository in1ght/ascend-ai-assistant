require('dotenv').config();
const { tool } = require("langchain");
const { z } = require("zod");
const axios = require("axios");
const { pool } = require("../database/database.js");

const getTrailFunction = async (input, userId) => {
    const filterMaps = {
        difficulty: {
            moderate: "difficulty = 0",
            hard: "difficulty = 1"
        },
        length: {
            short: "length < 6.317",
            average: "length BETWEEN 6.317 AND 10.368",
            long: "length > 10.368"
        },
        popularity: {
            average: "reviews < 10986",
            high: "reviews > 10986"
        }
    };

    const conditions = [];

    for (const [key, map] of Object.entries(filterMaps)) {
        const condition = map?.[input[key]];
        if (condition) conditions.push(condition);
    }

    const query = `
        SELECT *
        FROM trails
        WHERE ${conditions.join(" AND ")}
        ORDER BY RANDOM()
        LIMIT 1;
    `;
    
    const dbClient = await pool.connect();

    try {
        const result = await dbClient.query(query);
        return JSON.stringify(result.rows);;
    } catch (err) {
        console.error(err);
        console.log("\n\n\nAn error occurred, servers are down, apologize to the user.\n\n\n");
        return "An error occurred, servers are down, apologize to the user.";
    } finally {
        dbClient.release();
    }
};


const getTrail = tool(
  async (input) => {
    return getTrailFunction(input);
  },
  {
    name: "get_trail",
    description:
        "Returns the most suitable hiking trail for a user based on constraints. " +

        "INPUT RULES: user MUST specify 1. difficulty (moderate or hard), 2. length (short, average or long), and 3. popularity (average or high) to get a valid result. " +
        "ALL these values MUST be derived from explicit user input or inferred only when clearly implied. " +
        "If user requests values outside allowed options (e.g. 'easy'), map them to the closest valid category (moderate). " +
        "do NOT suggest values outside the allowed schema values. " +

        "OUTPUT: Returns a single trail with image URL and key metadata (difficulty, length, popularity). " +
        "Metadata is NOT included in the final text response; it is consumed by the UI system as a card. " +

        "ADDITIONAL CONTEXT:  Includes short natural-language context about the location. " +
        "This context is for the agent to use in its response and is NOT part of the UI card. (under development)",

    schema: z.object({
      difficulty: z
        .enum(["moderate", "hard"])
        .describe("Trail difficulty level."),

      length: z
        .enum(["short", "average", "long"])
        .describe("Trail length category."),

      popularity: z
        .enum(["average", "high"])
        .describe("Trail popularity level."),
    }),
  }
);

module.exports = { getTrail };