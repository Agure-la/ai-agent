import { stepCountIs, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { SYSTEM_PROMPT } from "./prompts.js";
import { generateCommitMessageTool, getFileChangesInDirectoryTool, writeReviewToMarkdownTool } from "./tools.js";

const codeReviewAgent = async (prompt: string) => {
    const result = streamText({
        model: google("models/gemini-1.5-flash"),
        prompt, system: SYSTEM_PROMPT,
        tools: {
            getFileChangesInDirectoryTool: getFileChangesInDirectoryTool,
            generateCommitMessageTool: generateCommitMessageTool,
            writeReviewToMarkdownTool: writeReviewToMarkdownTool,
        },
        stopWhen: stepCountIs(10),
    });

    for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
    }
}

export default codeReviewAgent;