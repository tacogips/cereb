import { Anthropic } from "@anthropic-ai/sdk";
import { type ClaudeConfig, loadClaudeConfig } from "./config";

import {
  type AiClient,
  type Chat,
  type Query,
  type MessageHistory,
  type MessageBody,
  type TokenUsage,
  type QueryResponse,
  Role,
  strToImageType,
} from "~/ai-service";

const claudeConfig: ClaudeConfig = loadClaudeConfig();

export class ClaudeClient implements AiClient {
  private client: Anthropic;
  private config: ClaudeConfig;
  constructor(private modelName: string) {
    if (!claudeConfig.apiKey) {
      throw new Error("apiKey for claude is not set");
    }
    this.client = new Anthropic({ apiKey: claudeConfig.apiKey });
    this.config = claudeConfig;
  }

  async newChat(): Promise<Chat> {
    return new ClaudeChat(this.client, this.modelName, this.config) as Chat;
  }
}

class ClaudeChat implements Chat {
  inputTokenSummary: number = 0;
  outputTokenSummary: number = 0;
  messageHistory: Array<MessageHistory> = [];

  constructor(
    private client: Anthropic,
    private model: string,
    private config: ClaudeConfig,
  ) {}

  tokenUsage(): TokenUsage {
    return {
      inputToken: this.inputTokenSummary,
      outputToken: this.outputTokenSummary,
    };
  }
  history(): Array<MessageHistory> {
    return this.messageHistory;
  }

  pushHistories(histories: Array<MessageHistory>) {
    this.messageHistory.push(...histories);
  }

  async sendQuery(query: Query): Promise<QueryResponse> {
    let messages: Array<Anthropic.MessageParam> = this.messageHistory.map(
      (eachMessage) => messageHistoryToParam(eachMessage),
    );
    const newMessageParams = query.bodies.map((eachBody) =>
      messageBodyToParam(eachBody),
    );
    const newMessage: Anthropic.MessageParam = {
      role: Role.User,
      content: newMessageParams,
    };
    messages.push(newMessage);

    let maxToken: number;

    if (query.maxToken) {
      maxToken = query.maxToken | 0;
      if (maxToken <= 0) {
        maxToken = this.config.defaultMaxToken;
      }
    } else {
      maxToken = this.config.defaultMaxToken;
    }
    const response: Anthropic.Message = await this.client.messages.create({
      model: this.model,
      max_tokens: maxToken,
      system: query.systemPrompt,
      temperature: query.temperature,

      messages,
    });

    const responseBodies = response.content.map((each) =>
      contentToMessageBody(each),
    );
    const newAssistantMesageHisotries: MessageHistory = {
      role: Role.Assistant,
      messages: responseBodies,
    };

    const newUserMessageHistories: MessageHistory = {
      role: Role.User,
      messages: newMessageParams.map((eachMessage) =>
        paramToMessageBody(eachMessage),
      ),
    };
    this.messageHistory.push(
      newUserMessageHistories,
      newAssistantMesageHisotries,
    );
    const { input_tokens, output_tokens } = response.usage;
    this.inputTokenSummary += input_tokens;
    this.outputTokenSummary += output_tokens;

    return {
      tokenUsage: { inputToken: input_tokens, outputToken: output_tokens },
      usedModel: this.model,
      content: responseBodies,
    };
  }
}

function messageBodyToParam(
  messageBody: MessageBody,
): Anthropic.TextBlockParam | Anthropic.ImageBlockParam {
  switch (messageBody.type) {
    case "text":
      return { text: messageBody.text, type: "text" };
    case "image":
      return {
        source: {
          data: messageBody.base64Image,
          media_type: messageBody.imageType,
          type: "base64",
        },
        type: "image",
      };
  }
}

function messageHistoryToParam(
  messageHistory: MessageHistory,
): Anthropic.MessageParam {
  return {
    role: messageHistory.role,
    content: messageHistory.messages.map((eachMessage) =>
      messageBodyToParam(eachMessage),
    ),
  };
}

function paramToMessageBody(
  param: Anthropic.TextBlockParam | Anthropic.ImageBlockParam,
): MessageBody {
  switch (param.type) {
    case "text":
      return { type: "text", text: param.text };

    case "image":
      const imageType = strToImageType[param.source.media_type];
      if (!imageType) {
        throw new Error("unknown image type ${param.source.media_type}");
      }
      return {
        type: "image",
        imageType,
        base64Image: param.source.data,
      };
  }
}

function contentToMessageBody(
  param: Anthropic.TextBlock | Anthropic.ToolUseBlock,
): MessageBody {
  switch (param.type) {
    case "text":
      return { type: "text", text: param.text };

    default:
      throw new Error(`not supporte content type ${param.type}`);
  }
}
