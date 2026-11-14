import { Marked, Renderer, MarkedOptions } from "@ts-stack/markdown";
import { isUrl, pathOrUrlToAttachmentMessage } from "~/attachment";
import {
  Role,
  type MessageHistory,
  type MessageBody,
  newIgnoreBody,
  newTextBody,
  type TokenUsage,
  detectImageTypeFromFilePathOrUrl,
} from "~/ai-service";
import path from "path";
import * as cheerio from "cheerio";
import { type QueryMessages } from "~/query";

const obsidianInternalLinkRegex = /!\[\[([^\[\]]+?)\]\]/g;

function roleDescription(role: Role): string {
  return "cereb-" + role;
}

enum AttachmentClass {
  Image = "attached-image",
  Link = "link",
  InnerLink = "inner-link",
}

class CustomMdRenderer extends Renderer {
  constructor(
    private rootDirPath?: string,
    private currentDirPath?: string,
    options?: MarkedOptions,
  ) {
    super(options);
  }

  override link(href: string, title: string, text: string): string {
    let destination;

    let imageType = detectImageTypeFromFilePathOrUrl(href);

    if (imageType) {
      if (isUrl(href)) {
        destination = href;
      } else {
        destination = this.currentDirPath
          ? path.join(this.currentDirPath, href)
          : href;
      }

      return `<a href="${destination}" class="${AttachmentClass.Link}">${text}</a>`;
    } else {
      return `[${text}](${href})`;
    }
  }
  override image(href: string, title: string, text: string): string {
    let destination;

    let imageType = detectImageTypeFromFilePathOrUrl(href);
    if (imageType) {
      if (isUrl(href)) {
        destination = href;
      } else {
        destination = this.currentDirPath
          ? path.join(this.currentDirPath, href)
          : href;
      }

      return `<a href="${destination}" class="${AttachmentClass.Image}">${text}</a>`;
    } else {
      return href;
    }
  }

  override paragraph(text: string) {
    text = text.replace(obsidianInternalLinkRegex, (match, innerLink) => {
      if (isUrl(innerLink)) {
        return "![[" + innerLink + "]]";
      }
      let destination;
      let imageType = detectImageTypeFromFilePathOrUrl(innerLink);
      if (imageType) {
        destination = this.rootDirPath
          ? path.join(this.rootDirPath, innerLink)
          : innerLink;
        return `<a href="${destination}" class="${AttachmentClass.InnerLink}">${innerLink}</a> ![[${innerLink}]]`;
      } else {
        return "![[" + innerLink + "]]";
      }
    });

    return `<p>` + text + `</p>\n`;
  }
}

export function parseMarkdownAsHtml(
  md: string,
  rootDir?: string,
  currentDir?: string,
): string {
  const result = Marked.parse(md, {
    renderer: new CustomMdRenderer(rootDir, currentDir),
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: true,
    sanitize: true,
  });

  return result;
}

export type Elem =
  | {
      type: "hr";
      headOfPage: boolean;
    }
  | {
      type: "h2";
      id?: string;
      text?: string;
    }
  | {
      type: "pre";
      content: string;
      class?: string;
    }
  | {
      type: "list_elem";
      text: string;
    }
  | {
      type: "p_with_link";
      href?: string;
      text: string;
      class: string | undefined;
    }
  | {
      type: "p_without_link";
      text: string;
    };

export function htmlToElems(html: string): Array<Elem> {
  Array<MessageBody>;
  let parser = cheerio.load(html);

  const elements: Elem[] = [];

  parser("hr, h, h2, h3, pre, p, li").each((index, element) => {
    const el = parser(element);
    if (!el) {
      return null;
    }
    const rawTagName = el.prop("tagName");
    if (!rawTagName) {
      return null;
    }
    const tagName = rawTagName.toLowerCase();

    switch (tagName) {
      case "hr":
        elements.push({
          type: "hr",
          headOfPage: index === 0,
        });
        break;

      case "h2":
        elements.push({
          type: "h2",
          id: el.attr("id"),
          text: el.text(),
        });
        break;
      case "pre":
        elements.push({
          type: "pre",
          content: el.text().trim(),
          class: el.find("code").attr("class"),
        });
        break;

      case "li":
        elements.push({
          type: "list_elem",
          text: el.text(),
        });
        break;
      case "p":
        const links = el.find("a");
        if (links.length > 0) {
          links.each((index, eachLink) => {
            elements.push({
              type: "p_with_link",
              href: parser(eachLink).attr("href"),
              text: parser(eachLink).text(),
              class: parser(eachLink).attr("class"),
            });
          });
        } else {
          elements.push({
            type: "p_without_link",
            text: el.text(),
          });
        }
        break;
      default:
        elements.push({
          type: "p_without_link",
          text: el.text(),
        });
    }
  });
  return elements;
}

export async function elemsToMessage(
  elems: Array<Elem>,
  ignoreHeaderBlock: boolean = true,
): Promise<QueryMessages> {
  let messageHistories: Array<MessageHistory> = [];

  let currentRole = Role.User;
  let currentRoleMessages: Array<MessageBody> = [];

  const userRoleDesc = roleDescription(Role.User);
  const assistantRoleDesc = roleDescription(Role.Assistant);
  let beforeHeaderBlock = true;
  let duringHeaderBlock = false;

  let mustSkipHeaderBlock = false;

  if (elems && elems.length > 0) {
    if (
      ignoreHeaderBlock &&
      elems[0].type == "hr" &&
      elems[0].headOfPage == true
    ) {
      mustSkipHeaderBlock = true;
    }
  }

  for (const eachElem of elems) {
    switch (eachElem.type) {
      case "hr":
        if (mustSkipHeaderBlock) {
          if (beforeHeaderBlock) {
            beforeHeaderBlock = false;
            duringHeaderBlock = true;
          } else if (duringHeaderBlock) {
            currentRoleMessages = [];
            duringHeaderBlock = false;
          }
        }

        break;

      case "h2":
        if (
          eachElem.id.toString() == assistantRoleDesc ||
          eachElem.id.toString() === userRoleDesc
        ) {
          if (currentRoleMessages.length !== 0) {
            messageHistories.push({
              role: currentRole,
              messages: currentRoleMessages,
            });
            switch (eachElem.id) {
              case assistantRoleDesc:
                currentRole = Role.Assistant;
                break;
              case userRoleDesc:
                currentRole = Role.User;
                break;
            }
            currentRoleMessages = [];
          }
        }

        // the closing hr tag  might be parse as "h2"
        if (mustSkipHeaderBlock) {
          if (duringHeaderBlock) {
            currentRoleMessages = [];
            duringHeaderBlock = false;
          }
        }

        break;

      case "pre":
        if (eachElem.class) {
          if (eachElem.class.startsWith("lang-")) {
            if (eachElem.class !== "lang-cereb-meta") {
              const lang = eachElem.class.replace("lang-", "");
              currentRoleMessages.push(
                newTextBody(`\`\`\`${lang}\n${eachElem.content}\n\`\`\``),
              );
            }
          } else {
            currentRoleMessages.push(
              newTextBody(`\`\`\`\n${eachElem.content}\n\`\`\``),
            );
          }
        } else {
          currentRoleMessages.push(
            newTextBody(`\`\`\`\n${eachElem.content}\n\`\`\``),
          );
        }
        break;
      case "list_elem":
        currentRoleMessages.push(newTextBody("- " + eachElem.text));
        break;

      case "p_with_link":
        if (eachElem.href) {
          currentRoleMessages.push(
            await pathOrUrlToAttachmentMessage(eachElem.href),
          );
        }

        let ignoreBody: string | undefined;
        switch (eachElem.class) {
          case AttachmentClass.Image:
            ignoreBody = `![${eachElem.text}](${eachElem.href})`;
            break;
          case AttachmentClass.InnerLink:
            ignoreBody = `![[${eachElem.href}]]`;
            break;
          case AttachmentClass.Link:
            ignoreBody = `[${eachElem.text}](${eachElem.href})`;
            break;
        }

        if (ignoreBody) {
          currentRoleMessages.push(newIgnoreBody(ignoreBody));
        }

        break;

      case "p_without_link":
        currentRoleMessages.push(newTextBody(eachElem.text));
        break;
    }
  }

  if (mustSkipHeaderBlock && duringHeaderBlock) {
    currentRoleMessages = [];
    duringHeaderBlock = false;
  }

  if (currentRoleMessages.length !== 0) {
    messageHistories.push({
      role: currentRole,
      messages: currentRoleMessages,
    });
    currentRoleMessages = [];
  }

  if (messageHistories.length === 0) {
    return {
      history: [],
      newMessage: [],
    };
  }
  const lastRoleMessages = messageHistories.pop() as MessageHistory;
  if (lastRoleMessages.role === Role.User) {
    return {
      history: messageHistories,
      newMessage: lastRoleMessages.messages,
    };
  } else {
    messageHistories.push(lastRoleMessages);
    return {
      history: messageHistories,
      newMessage: [],
    };
  }
}

export async function messagesFromMarkdown(
  md: string,
  rootDir?: string,
  currentDir?: string,
): Promise<QueryMessages> {
  const parsedHtml = parseMarkdownAsHtml(md, currentDir);

  const elems = htmlToElems(parsedHtml);

  return await elemsToMessage(elems);
}

export function messageBodyToMarkdown(
  role: Role,
  contents: Array<MessageBody>,
  tokenUsae?: TokenUsage,
  usedModel?: string | null,
): string {
  let content = contents
    .map((content) => {
      if (content.type === "text" || content.type === "ignore") {
        return content.text;
      }
      return null;
    })
    .join("\n");
  if (tokenUsae) {
    content += `\n\`\`\`cereb-meta
 input token: ${tokenUsae.inputToken}
output token: ${tokenUsae.outputToken}
       model: ${usedModel}
\`\`\`
`;
  }

  return `${roleDescription(role)}
---
${content}`;
}
