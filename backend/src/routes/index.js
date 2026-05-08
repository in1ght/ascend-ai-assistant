const express = require('express');
const router = express.Router();
const { pool, openai } = require("../database/database.js");
const { decodeJwt } = require("jose");
const axios = require("axios");
const {OAuth2Client} = require("google-auth-library");
const crypto = require("crypto");
const { agent } = require("../agent/index.js");
const { ToolMessage } = require("@langchain/core/messages");

const client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || token === "null" || token === "undefined") {
      req.user = { sub: 12 }; // default test user
      return next();
    }
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.OAUTH_CLIENT_ID,
    });

    req.user = ticket.getPayload();
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}
//


router.get('/', auth , async (req, res) => {
  const userId = req.user.sub;
  const result = await pool.query(
    'SELECT * FROM messages WHERE user_id = $1',
    [userId]
  );
  res.json(result.rows);
});

router.post('/',auth, async (req, res) => {
  const { speaker, content } = req.body;
  const userId = req.user.sub;

  const client = await pool.connect();

  const hash = crypto.createHash("md5").update(String(userId)).digest();
  
  const key1 = hash.readInt32BE(0);
  const key2 = hash.readInt32BE(4);

  await client.query("SELECT pg_advisory_lock($1, $2)", [key1, key2]);
  try {
    await client.query(`BEGIN`);

    const userInsert = await client.query(
      `INSERT INTO messages (user_id, speaker, content)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [userId, speaker, content]
    );
    
    const history = await client.query(
      `SELECT speaker, content
      FROM messages
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10`,
      [userId]
    );

    // const embedding = await openai.embeddings.create({
    //   model: "text-embedding-3-small",
    //   input: content
    // });

    
    const formatted = (history.rows.slice().reverse()).map(msg => ({
      role: msg.speaker === 1 ? `user` : `assistant`,
      content: msg.content
    }));
    
    if (formatted[formatted.length - 1]?.role === "assistant") {
      throw new Error("Double API call detected");
    }

    const response = await agent.invoke({
      messages: formatted
    }, {
      metadata: {
        userId: req.user.sub
      }
    });

    const aiResponce = response.messages[response.messages.length - 1];

    
    const aiInsert = await client.query(
      `INSERT INTO messages (user_id, speaker, content)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [userId, 2, aiResponce.content]
    );

    const suggestions = response.intermediateSteps?.filter(step => step.action?.tool === "suggestAnswers").map(step => step.observation).pop(); 

    const toolMessages = response.messages.filter(
      (m) => m instanceof ToolMessage
    );  

    // const toolMessagessuggestAnswers = response.messages.filter(
    //   (m) => m["name"] === "suggestAnswers"
    // );  

    const toolMessageSuggestAnswers = toolMessages.filter(
      (m) => m["name"] === "suggestAnswers"
    );  

    suggestion = toolMessageSuggestAnswers[toolMessageSuggestAnswers.length - 1]?.content

    // const toolInsert = await client.query(
    //   `INSERT INTO messages (user_id, speaker, content)
    //   VALUES ($1, $2, $3)
    //   RETURNING *`,
    //   [userId, 2, aiResponce.content]
    // );
    
    await client.query(`COMMIT`);

    res.json({
      user: userInsert.rows[0],
      assistant: aiInsert.rows[0],
      suggestions: {id: Date.now(),speaker: 3, content: suggestion}
    });
  } catch (err) {
    console.warn("ERROR:", err)
    await client.query(`ROLLBACK`);
    res.status(500).json({ error: `Something went wrong` });
  } finally {
    await client.query("SELECT pg_advisory_unlock($1, $2)", [key1, key2]);
    client.release();
  }
});



router.post("/login", async (req, res) => {
  const { code } = req.body;
  // code for tokens
  const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
    code,
    client_id: process.env.OAUTH_CLIENT_ID,
    client_secret: process.env.OAUTH_CLIENT_SECRET,
    redirect_uri: "postmessage",
    grant_type: "authorization_code",
  });
  const { id_token } = tokenRes.data;
  res.json({ id_token });
});


module.exports = router;