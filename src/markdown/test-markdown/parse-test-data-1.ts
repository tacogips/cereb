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

![[inner_image.png]]

[aaa](http://funny-example.me/some.jpg)

[[http://inner-image.me/some.jpg]]

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
    class: "attached-image",
  },
  {
    type: "p_with_link",
    href: "/current/image.png",
    text: "aaa",
    class: "link",
  },
  {
    type: "p_without_link",
    text: "what is this?",
  },
  {
    class: "inner-link",
    href: "/workdir/inner_image.png",
    text: "inner_image.png",
    type: "p_with_link",
  },
  {
    type: "p_with_link",
    href: "http://funny-example.me/some.jpg",
    text: "aaa",
    class: "link",
  },
  {
    class: "link",
    type: "p_with_link",
    href: "http://inner-image.me/some.jpg",
    text: "http://inner-image.me/some.jpg",
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
