// npm install puppeteer openai cheerio dotenv
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const routes = require('./src/routes/index.js');

const app = express();

app.set('trust proxy', true);
app.use(cors());
app.use(express.json());
app.use('/message', routes);

const PORT = process.env.PORT || 5000;

const pool = new Pool({
  host: process.env.DB_ENDPOINT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

pool.query('SELECT NOW()')
  .then(res => console.log('DB connected, time:', res.rows[0]))
  .catch(err => console.error('DB connection error:', err.message));

app.get('/', (req, res) => {
  res.send('API Running');
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
