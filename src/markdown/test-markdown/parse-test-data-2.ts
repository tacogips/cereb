import { type Elem } from "~/markdown";

const input = `

---
id: some
aliases: []
tags:
  - clippings
	- other
author:
  - "[[@auth0]]"
created: "2024-09-20"
description: xxx
source:  somewhere
title: no
---


user
---
user text

alice:
	greeding
bob:
	hi


"atags":
	- clippings
	- eee

asf



assistant
---
text

`;

const expected = [
  {
    headOfPage: true,
    type: "hr",
  },

  {
    text: "id: some\naliases: []\ntags:",
    type: "p_without_link",
  },
  {
    text: "clippings\n\nother\nauthor:\n\n",
    type: "list_elem",
  },
  {
    text: "other\nauthor:",
    type: "list_elem",
  },
  {
    text: '"[[@auth0]]"\ncreated: "2024-09-20"\ndescription: xxx\nsource:  somewhere\ntitle: no',
    type: "list_elem",
  },

  {
    headOfPage: false,
    type: "hr",
  },

  {
    id: "user",
    text: "user",
    type: "h2",
  },
  {
    text: "user text",
    type: "p_without_link",
  },

  {
    text: "alice:\n    greeding\nbob:\n    hi",
    type: "p_without_link",
  },
  {
    text: '"atags":',
    type: "p_without_link",
  },
  {
    class: undefined,
    content: "- clippings\n- eee",
    type: "pre",
  },
  {
    text: "asf",
    type: "p_without_link",
  },

  {
    id: "assistant",
    text: "assistant",
    type: "h2",
  },
  {
    text: "text",
    type: "p_without_link",
  },
];

export default [input, expected] as Array<string | Elem[]>;
