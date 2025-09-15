import { generateText } from "ai";
// Import the google module from ai-sdk package
import { google } from "@ai-sdk/google";

//specify the model to use for generating text and a prompt

const {text} = await generateText({model: google("gemini-2.0-flash-001"), prompt: "What is an AI agent?"});

console.log(text);