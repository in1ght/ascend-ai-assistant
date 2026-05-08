// const { tool } = require("@langchain/core/tools");
// const { z } = require("zod");

// const ragTool = tool(
//   async ({ query }) => {
//     return `This is a testing message. RAG is under development, tool is a success.`;
//   },
//   {
//     name: "rag_search",
//     description: "Search internal knowledge base using semantic search.",
//     schema: z.object({
//       query: z.string().describe("Search query for retrieving relevant documents"),
//     }),
//   }
// );

// module.exports = { ragTool };

// // const { StructuredTool } = require("@langchain/core/tools");
// // const { z } = require("zod");

// // async function searchRAG(query) { 
// //     return `This is a testing message, The app is under development, 
// //     the user who requested infromatino about something is a tester.
// //     Tell him RAG is under development, tool is a success.`;
// // }

// // // 2. RAG Search Tool
// // const ragTool = StructuredTool.from_function({
// //   name: "rag_search",
// //   description: `Search internal knowledge base using semantic search. 
// //   Use this for answering questions about private or domain-specific data.
// //   Return top 5 replies that match the question.`,
// //   args_schema: z.object({
// //     query: z.string().describe("Search query for retrieving relevant documents"),
// //   }),
// //   func: async ({ query }) => {
// //     return await searchRAG(query);
// //   },
// // });

// // module.exports = { ragTool };