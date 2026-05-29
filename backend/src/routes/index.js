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

const parseToolContent = (content) => {
  if (content == null) return null;
  if (typeof content !== "string") return content;

  try {
    return JSON.parse(content);
  } catch (err) {
    return content;
  }
};

const normalizeToolMessage = (message) => {
  const helperName =
    message.name ||
    message.toolName ||
    message.additional_kwargs?.name ||
    message.lc_kwargs?.name ||
    message.kwargs?.name;
  const rawContent = message.content ?? message.lc_kwargs?.content ?? message.kwargs?.content;
  const payload = parseToolContent(rawContent);

  return {
    helperName,
    helperPayload: payload,
    helperCallId:
      message.tool_call_id ||
      message.toolCallId ||
      message.lc_kwargs?.tool_call_id ||
      message.kwargs?.tool_call_id ||
      message.id ||
      null,
    content: typeof payload === "string" ? payload : JSON.stringify(payload),
  };
};

const normalizeIntermediateStep = (step) => {
  const helperName = step.action?.tool;
  const payload = parseToolContent(step.observation);

  return {
    helperName,
    helperPayload: payload,
    helperCallId: step.action?.toolCallId || step.action?.tool_call_id || null,
    content: typeof payload === "string" ? payload : JSON.stringify(payload),
  };
};

const getMessageType = (message) => {
  if (typeof message?._getType === "function") return message._getType();
  return message?.type || message?.lc_kwargs?.type || message?.kwargs?.type;
};

const isToolMessage = (message) => (
  message instanceof ToolMessage ||
  getMessageType(message) === "tool" ||
  message?.constructor?.name === "ToolMessage" ||
  Boolean((message?.tool_call_id || message?.lc_kwargs?.tool_call_id || message?.kwargs?.tool_call_id) && (message?.content || message?.lc_kwargs?.content || message?.kwargs?.content))
);

const findIntermediateStepLists = (value, found = [], seen = new WeakSet()) => {
  if (!value || typeof value !== "object") return found;
  if (seen.has(value)) return found;
  seen.add(value);

  if (Array.isArray(value)) {
    if (value.some((item) => item?.action?.tool && Object.prototype.hasOwnProperty.call(item, "observation"))) {
      found.push(value);
      return found;
    }

    value.forEach((item) => findIntermediateStepLists(item, found, seen));
    return found;
  }

  Object.values(value).forEach((item) => findIntermediateStepLists(item, found, seen));
  return found;
};

const formatToolHistoryForLlm = (row) => {
  const payload = row.helper_payload ?? parseToolContent(row.content);
  const payloadText = typeof payload === "string" ? payload : JSON.stringify(payload);

  return [
    "Preserved helper tool output from an earlier turn.",
    `Tool: ${row.helper_name || "unknown"}`,
    `Payload: ${payloadText}`,
  ].join("\n");
};

const insertHelperMessage = async (client, userId, helper) => {
  const result = await client.query(
    `INSERT INTO messages (user_id, speaker, content, helper_name, helper_payload, helper_call_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      userId,
      3,
      helper.content || "",
      helper.helperName,
      JSON.stringify(helper.helperPayload ?? null),
      helper.helperCallId,
    ]
  );

  return result.rows[0];
};

const summarizeHelpers = (helpers) => helpers.map((helper) => ({
  helperName: helper.helperName,
  helperCallId: helper.helperCallId,
  contentPreview: String(helper.content || "").slice(0, 160),
}));

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

const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
};


router.get('/', auth , async (req, res) => {
  const userId = req.user.sub;
  const result = await pool.query(
    'SELECT * FROM messages WHERE user_id = $1 ORDER BY id ASC',
    [userId]
  );
  res.json(result.rows);
});

router.delete('/', auth, async (req, res) => {
  const userId = req.user.sub;
  await pool.query(
    'DELETE FROM messages WHERE user_id = $1',
    [userId]
  );

  res.json({ status: "success" });
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
      `SELECT speaker, content, helper_name, helper_payload
      FROM (
        SELECT speaker, content, helper_name, helper_payload, id
        FROM messages
        WHERE user_id = $1
        ORDER BY id DESC
        LIMIT 15
      ) recent_messages
      ORDER BY id ASC`,
      [userId]
    );

    // const embedding = await openai.embeddings.create({
    //   model: "text-embedding-3-small",
    //   input: content
    // });

    
    const formatted = history.rows.map(msg => ({
      role: msg.speaker === 1 ? `user` : `assistant`,
      content: msg.speaker === 3 ? formatToolHistoryForLlm(msg) : msg.content
    }));

    const helperHistoryCount = history.rows.filter((msg) => msg.speaker === 3).length;
    console.log("[message] LLM history prepared", {
      userId,
      rows: formatted.length,
      helperRows: helperHistoryCount,
      latestRoles: formatted.slice(-5).map((msg) => msg.role),
    });
    
    if (formatted[formatted.length - 1]?.role === "assistant") {
      throw new Error("Double API call detected");
    }

    const response = await agent.invoke({
      messages: formatted
    }, {
      metadata: {
        userId: req.user.sub,
        calendarAccessToken: req.headers["x-calendar-access-token"],
        clientTimeZone: req.headers["x-client-time-zone"],
        clientIp: getClientIp(req),
      }
    });

    const aiResponce = response.messages[response.messages.length - 1];

    const toolMessageHelpers = response.messages
      .filter(isToolMessage)
      .map(normalizeToolMessage);
    const discoveredStepLists = [
      response.intermediateSteps || [],
      response.intermediate_steps || [],
      ...findIntermediateStepLists(response),
    ];
    const intermediateStepHelpers = discoveredStepLists.flat()
      .map(normalizeIntermediateStep);
    const helperRows = [];
    const helperKeys = new Set();
    const helpers = [...toolMessageHelpers, ...intermediateStepHelpers]
      .filter((helper) => helper.helperName && helper.content);
    console.log("[message] Tool outputs discovered", {
      userId,
      toolMessages: toolMessageHelpers.length,
      intermediateSteps: intermediateStepHelpers.length,
      helpers: summarizeHelpers(helpers),
    });
    
    const aiInsert = await client.query(
      `INSERT INTO messages (user_id, speaker, content)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [userId, 2, aiResponce.content]
    );

    for (const helper of helpers) {
      const helperKey = `${helper.helperName}:${helper.helperCallId || helper.content}`;
      if (helperKeys.has(helperKey)) continue;
      helperKeys.add(helperKey);
      helperRows.push(await insertHelperMessage(client, userId, helper));
    }
    console.log("[message] Helper rows inserted", {
      userId,
      inserted: helperRows.map((row) => ({
        id: row.id,
        helper_name: row.helper_name,
        helper_call_id: row.helper_call_id,
      })),
    });
    
    await client.query(`COMMIT`);

    res.json({
      user: userInsert.rows[0],
      assistant: aiInsert.rows[0],
      helpers: helperRows,
      items: [aiInsert.rows[0], ...helperRows]
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
  const { id_token, access_token } = tokenRes.data;
  res.json({ id_token, access_token });
});


module.exports = router;
