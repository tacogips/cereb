import { type MessageHistory, type MessageBody } from "~/ai-service";

export interface QueryMessages {
  history: Array<MessageHistory>;
  newMessage: Array<MessageBody>;
}
