import { z } from "zod";
import { tool } from "ai";
import { simpleGit } from "simple-git";
import { createStreamableValue, streamText } from "ai";
import { google } from "@ai-sdk/google";
import { COMMIT_MSG_PROMPT } from "./prompts";
import fs from "fs/promises";

const excludeFiles = ["dist", "bun.lock"];

const fileChange = z.object({
    rootDir: z.string().min(1).describe("The root directory"),
});

type FileChange = z.infer<typeof fileChange>;


async function getFileChangesInDirectory({rootDir}: FileChange) {
    const git = simpleGit(rootDir);
    const summary = await git.diffSummary();
    const diffs: {file: string, diff: string}[] = [];

    for (const file of summary.files) {
        if (excludeFiles.includes(file.file)) continue;
        const diff = await git.diff(["--", file.file]);
        diffs.push({file: file.file, diff});
    }

    return diffs;
}

export const getFileChangesInDirectoryTool = tool({
    description: "Gets the code changes made in given directory",
    inputSchema: fileChange,
    execute: getFileChangesInDirectory,
});

const commitMessage = z.object({
    changes: z.array(z.object({
        file: z.string(),
        diff: z.string(),
    })),
});

type CommitMessage = z.infer<typeof commitMessage>;

async function generateCommitMessage({changes}: CommitMessage) {
    const stream = createStreamableValue();

    (async () => {
        const { textStream } = await streamText({
            model: google("models/gemini-1.5-flash"),
            system: COMMIT_MSG_PROMPT,
            prompt: `Generate a commit message for the following changes: ${JSON.stringify(changes)}`,
        });

        for await (const delta of textStream) {
            stream.update(delta);
        }

        stream.done();
    })();

    return stream.value;
}

export const generateCommitMessageTool = tool({
    description: "Generates a commit message for the given code changes",
    inputSchema: commitMessage,
    execute: generateCommitMessage,
});

const review = z.object({
    review: z.string(),
    filePath: z.string(),
});

type Review = z.infer<typeof review>;

async function writeReviewToMarkdown({review, filePath}: Review) {
    await fs.writeFile(filePath, review);
    return "Review written to markdown file";
}

export const writeReviewToMarkdownTool = tool({
    description: "Writes the code review to a markdown file",
    inputSchema: review,
    execute: writeReviewToMarkdown,
});