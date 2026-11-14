import { type Elem } from "~/markdown";

const input = `
user
---

\`\`\`python
1+2
\`\`\`

\`\`\`sql
select * from sss
\`\`\`

\`\`\`
some text
\`\`\`


![some](image.png)

[aaa](image.png)

what is this?

[[image.png]]

[aaa](http://funny-example.me/some.jpg)

what is this, again?





assistant
---

	asdf
\`\`\`cereb-meta
this block will be ignored

\`\`\`
`;

const expected = [
  {
    type: "h2",
    id: "user",
    text: "user",
  },
  {
    type: "pre",
    content: "1+2",
    class: "lang-python",
  },
  {
    type: "pre",
    content: "select * from sss",
    class: "lang-sql",
  },
  {
    type: "pre",
    content: "some text",
    class: undefined,
  },
  {
    type: "p_with_link",
    href: "/current/image.png",
    text: "some",
  },
  {
    type: "p_with_link",
    href: "/current/image.png",
    text: "aaa",
  },
  {
    type: "p_without_link",
    text: "what is this?",
  },
  {
    type: "p_with_link",
    href: "/workdir/image.png",
    text: "image.png",
  },
  {
    type: "p_with_link",
    href: "http://funny-example.me/some.jpg",
    text: "aaa",
  },
  {
    type: "p_without_link",
    text: "what is this, again?",
  },
  {
    type: "h2",
    id: "assistant",
    text: "assistant",
  },
  {
    type: "pre",
    content: "asdf",
    class: undefined,
  },
  {
    class: "lang-cereb-meta",
    content: "this block will be ignored",
    type: "pre",
  },
];

export default [input, expected] as Array<string | Elem[]>;
