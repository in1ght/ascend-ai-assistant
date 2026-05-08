// const { StructuredTool } = require("@langchain/core/tools");
// const { z } = require("zod");

// async function changeThemeSettings(theme) { 
//     return `Success`;
// }

// // 4. Theme Tool
// const themeSettingsTool = new StructuredTool({
//   name: "change_theme",
//   description: `Change the application's UI theme (light or dark). 
//   Use when the user asks to modify appearance.`,
//   schema: z.object({
//     theme: z.enum(["light", "dark"]).describe("Theme to switch to"),
//   }),
//   func: async ({ theme }) => {
//     return await changeThemeSettings(theme);
//   },
// });

// module.exports = { themeSettingsTool };