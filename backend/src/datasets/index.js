const fs = require("fs");
const { parse } = require("csv-parse");
const { pipeline } = require("stream/promises");
const path = require("path");
const { pool } = require("../database/database.js");

const filePath = path.join(__dirname, "alltrails_top50.csv");
const difficultyMap = {
    Easy: -1,
    Moderate: 0,
    Hard: 1
};


// // Use stream.pipeline for proper backpressure handling and error propagation
// async function readCSV() {
//     const client = await pool.connect();
//     const parser = fs
//         .createReadStream(filePath)
//         .pipe(parse({ delimiter: ",", from_line: 2 }));

//     try {
//         // NodeJS has no parallelization (at least as convenient)
//         for await (const row of parser) {
//         const transformed = [
//             row[0], 
//             row[1], 
//             difficultyMap[row[2]],
//             parseFloat(row[3]),
//             parseFloat(row[4]), 
//             parseInt(row[5], 10), // reviews
//             parseFloat(row[6]), // rating
//             row[7] // type
//         ];

//         console.log(transformed);

//         await client.query(`
//             INSERT INTO trails (name, location, difficulty, length, elevation, reviews, rating, route_type)
//             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
//         `, transformed);
//     }
//     console.log("Finished reading CSV file");
//     } catch (error) {
//             console.error("Error:", error.message);
//             throw error;
//     }
// }

// readCSV().catch((error) => {
//     console.error("Failed to read CSV:", error.message);
//     process.exit(1);
// });

// async function checkUpload() {
//   try {
//     const countRes = await pool.query(`SELECT COUNT(*) FROM trails;`);
//     console.log("Total rows:", countRes.rows[0].count);

//     const sampleRes = await pool.query(`SELECT * FROM trails LIMIT 5;`);
//     console.log("Sample rows:", sampleRes.rows);
//   } catch (err) {
//     console.error("Check failed:", err.message);
//   } finally {
//     await pool.end();
//   }
// }

// checkUpload()