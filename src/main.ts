import {
  type MessageBody,
  type MessageHistory,
  type QueryResponse,
  Role,
  newAiClientFromModel,
  newTextBody,
  type TokenUsage,
  emptyResponse,
  allModelList,
} from "./ai-service";
import { pathOrUrlToAttachmentMessage } from "./attachment";
import { messagesFromMarkdown, messageBodyToMarkdown } from "./markdown";

import { type QueryMessages } from "./query";

import { Command } from "commander";
import getStdin from "get-stdin";

const program = new Command();
program
  .name("cereb")
  .argument("[input_file]", "input file name or input from stdin")
  .option("--list-models")
  .option("--raw-input", "treat the input as raw text, not markdown")
  .option("--dry-run")
  .option("--no-latest-query", "output without latest query")
  .option("--no-history", "output without history but the latest query")
  .option("--format <string>", "json|markdown", "markdown")
  .option("--max-token <number>", "maximum token to generate")
  .option(
    "--work-current-dir <string>",
    "dir to search attachment file in markdown",
  )
  .option(
    "--work-root-dir <string>",
    "dir to search attachment file in markdown",
  )
  .option(
    "--model <string>",
    "specified or read from environment ${CEREB_DEFAULT_MODEL}",
  )
  .option("--attachment <string>", "file path or url")
  .option("--pretty")
  .description(
    `
API keys for each service are given by environment variables:
'CEREB_OPENAI_API_KEY' for OpenAI API
'CEREB_ANTHROPIC_API_KEY' for	Claude API`,
  )
  .parse();

const [inputFile] = program.args;
const {
  model,
  format,
  rawInput,
  dryRun,
  attachment,
  pretty,
  latestQuery,
  history,
  maxToken,
  listModels,
  workRootDir,
  workCurrentDir,
} = program.opts();
if (listModels) {
  console.log(JSON.stringify(allModelList(), null, 2));
  process.exit(0);
}

type Format = "json" | "markdown";

function validateFormat(format: string): Format {
  if (format !== "json" && format !== "markdown") {
    throw new Error(`Invalid format: ${format}`);
  }
  return format as Format;
}

let input: string;
if (inputFile) {
  input = await Bun.file(inputFile).text();
} else {
  input = await getStdin();
  input = input.trim();
}

if (!input || !input.trim()) {
  console.error("No input file or stdin");
  program.outputHelp();
  process.exit(1);
}

const typedFormat = validateFormat(format);

const queryMessage: QueryMessages = {
  history: [],
  newMessage: [],
};

if (attachment) {
  const attachmentMessage = await pathOrUrlToAttachmentMessage(attachment);
  queryMessage.newMessage.push(attachmentMessage);
}

if (rawInput) {
  queryMessage.newMessage.push(newTextBody(input));
} else {
  const { history, newMessage } = await messagesFromMarkdown(
    input,
    workRootDir,
    workCurrentDir || process.cwd(),
  );
  queryMessage.history = history;
  queryMessage.newMessage = newMessage;
}

if (queryMessage.newMessage.length === 0) {
  console.error("No new user query");
  process.exit(1);
}

let response: QueryResponse;
if (dryRun) {
  response = emptyResponse();
} else {
  const aiClient = newAiClientFromModel(model);
  const chat = await aiClient.newChat();
  chat.pushHistories(queryMessage.history);

  response = await chat.sendQuery({
    bodies: queryMessage.newMessage,
    maxToken,
  });
}

if (typedFormat === "markdown") {
  const markdownResponse = messageBodyToMarkdown(
    Role.Assistant,
    response.content,
    response.tokenUsage,
    response.usedModel,
  );

  if (history) {
    queryMessage.history.forEach((history) => {
      const markdownInput = messageBodyToMarkdown(
        history.role,
        history.messages,
      );
      process.stdout.write(markdownInput + "\n\n");
    });
  }

  if (latestQuery) {
    const markdownInput = messageBodyToMarkdown(
      Role.User,
      queryMessage.newMessage,
    );
    process.stdout.write(markdownInput + "\n\n");
  }

  process.stdout.write(markdownResponse);
  process.exit(0);
} else if (typedFormat === "json") {
  let jsonResult: {
    input?: Array<MessageHistory>;
    response: Array<MessageBody>;
    tokenUsage: TokenUsage;
    model: string | null;
  };

  const input = [];
  if (latestQuery) {
    input.push(...queryMessage.history);
  }

  if (latestQuery) {
    input.push({
      role: Role.User,
      messages: queryMessage.newMessage,
    });
  }

  jsonResult = {
    input: input,
    response: response.content,
    tokenUsage: response.tokenUsage,
    model: response.usedModel,
  };

  if (pretty) {
    process.stdout.write(JSON.stringify(jsonResult, null, 4));
  } else {
    process.stdout.write(JSON.stringify(jsonResult));
  }

  process.exit(0);
}
