import OpenAI from "openai";
import { type OpenAIConfig, loadOpenAIConfig } from "./config";

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

const openAIConfig: OpenAIConfig = loadOpenAIConfig();

export class OpenAIClient implements AiClient {
  private client: OpenAI;
  private config: OpenAIConfig;

  constructor(private modelName: string) {
    if (!openAIConfig.apiKey) {
      throw new Error("apiKey for OpenAI is not set");
    }
    this.client = new OpenAI({ apiKey: openAIConfig.apiKey });
    this.config = openAIConfig;
  }

  async newChat(): Promise<Chat> {
    return new OpenAIChat(this.client, this.modelName, this.config) as Chat;
  }
}

class OpenAIChat implements Chat {
  inputTokenSummary: number = 0;
  outputTokenSummary: number = 0;
  messageHistory: Array<MessageHistory> = [];

  constructor(
    private client: OpenAI,
    private model: string,
    private config: OpenAIConfig,
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
    let messages: Array<OpenAI.Chat.ChatCompletionMessageParam> = [];

    //TODO(tacogips) add system prompt
    const historyMessages = this.messageHistory.map((eachMessage) =>
      messageHistoryToParam(eachMessage),
    );
    messages.push(...historyMessages);

    const newUserMessageContents = query.bodies
      .filter((eachBody) => eachBody.type != "ignore")
      .map((eachBody) => messageBodyToOpenAIContent(eachBody));
    const newMessage: OpenAI.Chat.ChatCompletionUserMessageParam = {
      role: Role.User,
      content: newUserMessageContents,
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
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages,
      model: this.model,
      max_tokens: maxToken,
      temperature: query.temperature,
    };

    const response: OpenAI.Chat.ChatCompletion =
      await this.client.chat.completions.create(params);

    const responseBodies = response.choices
      .map((each) => choiceToMessageBody(each))
      .filter((each) => each != null) as Array<MessageBody>;
    if (responseBodies.length == 0) {
      throw new Error("no response body from OpenAI");
    }

    const newUserMessageHistories: MessageHistory = {
      role: Role.User,
      messages: newUserMessageContents.map((eachMessage) =>
        paramToMessageBody(eachMessage),
      ),
    };

    const newAssistantMesageHisotries: MessageHistory = {
      role: Role.Assistant,
      messages: responseBodies,
    };

    this.messageHistory.push(
      newUserMessageHistories,
      newAssistantMesageHisotries,
    );

    let inputToken = 0;
    let outputToken = 0;
    if (response.usage) {
      const { completion_tokens, prompt_tokens } = response.usage;
      inputToken = prompt_tokens;
      outputToken = completion_tokens;
      this.inputTokenSummary += prompt_tokens;
      this.outputTokenSummary += completion_tokens;
    }

    return {
      tokenUsage: { inputToken, outputToken },
      usedModel: this.model,
      content: responseBodies,
    };
  }
}

function messageBodyToOpenAIContent(
  messageBody: MessageBody,
):
  | OpenAI.Chat.ChatCompletionContentPartText
  | OpenAI.Chat.ChatCompletionContentPartImage {
  switch (messageBody.type) {
    case "text":
      return { text: messageBody.text, type: "text" };
    case "image":
      return {
        image_url: {
          url: `data:${messageBody.imageType};base64,${messageBody.base64Image}`,
          detail: "auto",
        },
        type: "image_url",
      };

    case "ignore":
      throw new Error("ignore message body should not be sent ");
  }
}

const imageUrlRegex = /^data:([^;]+);base64,(.+)$/;
interface ExtractedImage {
  imageTypeStr: string;
  base64Image: string;
}
function extractImageFromUrl(urlStr: string): ExtractedImage {
  const match = urlStr.match(imageUrlRegex);

  if (match && match.length >= 3 && match[1] && match[2]) {
    return {
      imageTypeStr: match[1],
      base64Image: match[2],
    };
  } else {
    throw new Error("invalid image url ${urlStr}");
  }
}

function messageHistoryToParam(
  messageHistory: MessageHistory,
): OpenAI.Chat.ChatCompletionMessageParam {
  const content = messageHistory.messages
    .filter((eachBody) => eachBody.type != "ignore")
    .map((eachMessage) => messageBodyToOpenAIContent(eachMessage));
  switch (messageHistory.role) {
    case Role.User:
      return {
        role: messageHistory.role,
        content,
      };

    case Role.Assistant:
      const assistantContent = content.filter((each) => each.type == "text");
      return {
        role: messageHistory.role,
        content: assistantContent,
      };
  }
}

function paramToMessageBody(
  param:
    | OpenAI.Chat.Completions.ChatCompletionContentPartText
    | OpenAI.Chat.Completions.ChatCompletionContentPartImage,
): MessageBody {
  switch (param.type) {
    case "text":
      return { type: "text", text: param.text };

    case "image_url":
      const { imageTypeStr, base64Image } = extractImageFromUrl(
        param.image_url.url,
      );
      const imageType = strToImageType[imageTypeStr];
      if (!imageType) {
        throw new Error(`unknown image type ${imageTypeStr}`);
      }
      return {
        type: "image",
        imageType,
        base64Image: base64Image,
      };
  }
}

function choiceToMessageBody(
  choice: OpenAI.Chat.Completions.ChatCompletion.Choice,
): MessageBody | null {
  if (
    choice.finish_reason == "stop" ||
    choice.finish_reason == "length" ||
    choice.finish_reason == "content_filter"
  ) {
    if (choice.message.content == null) {
      return null;
    }
    return { text: choice.message.content, type: "text" };
  } else {
    throw new Error(`not support finish reason ${choice.finish_reason}`);
  }
}
