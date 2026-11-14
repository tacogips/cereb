import input_1 from "./message-parse-1.md" with { type: "text" };
import input_2 from "./message-parse-2.md" with { type: "text" };
import input_3 from "./message-parse-3.md" with { type: "text" };
import input_4 from "./message-parse-4.md" with { type: "text" };
import input_5 from "./message-parse-5.md" with { type: "text" };
import input_6 from "./message-parse-6.md" with { type: "text" };
import input_7 from "./message-parse-7.md" with { type: "text" };

import { type MessageBody } from "~/ai-service";

import { type QueryMessages } from "~/query";

const datas: (string | QueryMessages)[][] = [
  [
    input_1,
    {
      history: [],
      newMessage: [
        {
          type: "text",
          text: "this is a user message",
        },
      ],
    },
  ],

  [
    input_2,

    {
      history: [
        {
          messages: [
            {
              text: "this  is a user message",
              type: "text",
            },
          ],
          role: "user",
        },
        {
          messages: [
            {
              text: "hi i am a assistant",
              type: "text",
            },
          ],
          role: "assistant",
        },
      ],

      newMessage: [],
    },
  ],

  [
    input_3,

    {
      history: [
        {
          messages: [
            {
              text: "this  is a user message",
              type: "text",
            },
          ],
          role: "user",
        },
        {
          messages: [
            {
              text: "hi i am a assistant",
              type: "text",
            },
          ],
          role: "assistant",
        },
      ],

      newMessage: [],
    },
  ],

  [
    input_4,

    {
      history: [
        {
          messages: [
            {
              text: "this  is a user message",
              type: "text",
            },
          ],
          role: "user",
        },
        {
          messages: [
            {
              text: "hi i am a assistant",
              type: "text",
            },
          ],
          role: "assistant",
        },
      ],

      newMessage: [
        {
          text: "this  is new user message",
          type: "text",
        },
      ],
    },
  ],

  [
    input_5,

    {
      history: [
        {
          messages: [
            {
              text: "this  is a user message",
              type: "text",
            },
          ],
          role: "user",
        },
        {
          messages: [
            {
              text: "hi i am a assistant",
              type: "text",
            },
          ],
          role: "assistant",
        },

        {
          messages: [
            {
              text: "I'm a chattering assistant",
              type: "text",
            },
          ],
          role: "assistant",
        },
      ],

      newMessage: [],
    },
  ],

  [
    input_6,

    {
      history: [
        {
          messages: [
            {
              text: "this  is a user message",
              type: "text",
            },
          ],
          role: "user",
        },
        {
          messages: [
            {
              text: "hi i am a assistant",
              type: "text",
            },
          ],
          role: "assistant",
        },
      ],

      newMessage: [
        {
          text: "this  is new user message",
          type: "text",
        },
      ],
    },
  ],

  [
    input_7,

    {
      history: [
        {
          messages: [
            {
              text: "tell me about markdon",
              type: "text",
            },
          ],
          role: "user",
        },
        {
          messages: [
            {
              text: 'I believe you may be referring to "Markdown" rather than "Markdon." If that\'s the case, here\'s some information about Markdown:',
              type: "text",
            },
            {
              text: "Markdown is a lightweight markup language created by John Gruber and Aaron Swartz in 2004. It's designed to be easy to read, write, and convert to HTML. Some key points about Markdown include:",
              type: "text",
            },
            {
              text: "- Simplicity: It uses simple and intuitive syntax for formatting text.\n",
              type: "text",
            },
            {
              text: "Simplicity: It uses simple and intuitive syntax for formatting text.",
              type: "text",
            },
            {
              text: "- Readability: Markdown files are easily readable even in their raw form.\n",
              type: "text",
            },
            {
              text: "Readability: Markdown files are easily readable even in their raw form.",
              type: "text",
            },
            {
              text: "- Versatility: It can be converted to many formats, including HTML, PDF, and others.\n",
              type: "text",
            },
            {
              text: "Versatility: It can be converted to many formats, including HTML, PDF, and others.",
              type: "text",
            },
            {
              text: "- Wide adoption: It's used in many platforms like GitHub, Reddit, and Stack Overflow.\n",
              type: "text",
            },
            {
              text: "Wide adoption: It's used in many platforms like GitHub, Reddit, and Stack Overflow.",
              type: "text",
            },
            {
              text: "- Common uses: Documentation, readme files, forum posts, and simple web content.\n",
              type: "text",
            },
            {
              text: "Common uses: Documentation, readme files, forum posts, and simple web content.",
              type: "text",
            },
            {
              text: "- Syntax: Uses symbols like asterisks for bold/italic, hashes for headers, and brackets/parentheses for links.\n",
              type: "text",
            },
            {
              text: "Syntax: Uses symbols like asterisks for bold/italic, hashes for headers, and brackets/parentheses for links.",
              type: "text",
            },
            {
              text: "- Variants: There are several flavors of Markdown, including CommonMark and GitHub Flavored Markdown.\n",
              type: "text",
            },
            {
              text: "Variants: There are several flavors of Markdown, including CommonMark and GitHub Flavored Markdown.",
              type: "text",
            },
            {
              text: "- File extension: Typically .md or .markdown\n",
              type: "text",
            },
            {
              text: "File extension: Typically .md or .markdown",
              type: "text",
            },
            {
              text: "Markdown is popular among writers, developers, and content creators for its simplicity and efficiency in creating formatted text without the complexity of full HTML.",
              type: "text",
            },
            {
              text: 'If you meant something else by "markdon," please clarify, and I\'ll be happy to provide information on that instead.',

              type: "text",
            },
          ],
          role: "assistant",
        },
      ],

      newMessage: [
        {
          text: "give me the history",
          type: "text",
        },
      ],
    },
  ],
];

export default datas;
