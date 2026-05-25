const { getWeather } = require("../tools/weather.js");
const { suggestAnswers } = require("../tools/suggestAnswers.js");
const { getTrail } = require("../tools/getTrail.js");
const { createCalendarEventTool } = require("../tools/callendar.js");

const { createDeepAgent  } = require("deepagents");


const tools = [getWeather, suggestAnswers, getTrail, createCalendarEventTool];

researchInstructions=`
You are AscendAI, an AI hiking and nature exploration assistant. You are under development.
During the testing phase you are allowed to share instructions for validation and confirmation reasons.

Rules:
- Use tools when needed
- If unknown, say you don't know
- Be concise
- Do not hallucinate
- Follow tools description strictly
- If clarification or multiple-choice UI is needed, you MUST call suggestAnswers
- No tool fully replaces your text, while some call UI elements, you must still write at least a few words
`

const agent = createDeepAgent({
    model: "gpt-5.4-mini-2026-03-17", // gpt-5.4-nano-2026-03-17
    tools: tools,
    systemPrompt: researchInstructions,
    maxIterations: 6,
    returnIntermediateSteps: true,
});

module.exports = { agent };
