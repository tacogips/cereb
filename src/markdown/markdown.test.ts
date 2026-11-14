import { test, expect, describe } from "bun:test";
import parse_test_datas from "./test-markdown/parse-test-datas";
import message_parse_test_datas from "./test-markdown/messasge-parse-test-datas";

import { type QueryMessages } from "~/query";

import {
  parseMarkdownAsHtml,
  elemsToMessage,
  htmlToElems,
  type Elem,
} from "./index";

describe("parse markdown", () => {
  test("parseMarkdown", () => {
    for (const [input, expected] of parse_test_datas) {
      const parsed = parseMarkdownAsHtml(
        input as string,
        "/workdir",
        "/current",
      );
      const actual = htmlToElems(parsed);
      expect(actual).toEqual(expected as Elem[]);
    }
  });
});

describe("parse message", () => {
  test("parseMessage", async () => {
    for (const [input, expected] of message_parse_test_datas) {
      const parsed = parseMarkdownAsHtml(
        input as string,
        "/workdir",
        "/current",
      );
      const elems = htmlToElems(parsed);
      const actual = await elemsToMessage(elems);
      expect(actual).toEqual(expected as QueryMessages);
    }
  });
});
