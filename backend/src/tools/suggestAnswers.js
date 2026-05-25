const { tool } = require("langchain");
const { z } = require("zod");

const suggestAnswersFunc = async (input) => {
  console.log(input); 
  return JSON.stringify(input.options);
};

const suggestAnswers = tool(
  (input) => suggestAnswersFunc(input),
  {
    name: "suggestAnswers",
    description:`
    UI TOOL ONLY.
    Returns up to 4 options for frontend rendering.
    DO NOT output these options in chat as part of your response.
    DO NOT explain, repeat, or summarize.
    This tool provides UI suggestions alongside the assistant message.
    You MUST still ask the corresponding question.
    Do NOT repeat the same question twice, if user answered, do NOT suggest it again.`,
    schema: z.object({
      options: z
        .array(z.string())
        .max(4)
        .describe(
          "Array of answer options (max 4 items). Each item must be 1–3 words, concise and user-selectable."
        ),
    }),
  }
);

module.exports = { suggestAnswers };



// `Generate up to 4 short answer options for the user to select. Each option must be 1–3 words.
//     Returns UI options ONLY. These are rendered by the frontend. Do not explain or repeat them in text.
//     Returns are 'success' or 'failure', do not repeat it.`

