import { assertEquals } from "@std/assert";
import { MarkdownNode, markdownToHTML, parseMarkdown } from "./md.ts";

const parserTestData: { input: string; expected: MarkdownNode[] }[] = [
  {
    input: "",
    expected: [],
  },
  {
    input: "some textttt ",
    expected: [
      {
        type: "paragraph",
        value: [{ type: "text", value: "some textttt" }],
      },
    ],
  },
  {
    input: ` multiple 
    line
    paragraph`,
    expected: [
      {
        type: "paragraph",
        value: [{ type: "text", value: "multiple line paragraph" }],
      },
    ],
  },
  {
    input: "# hi",
    expected: [{ type: "heading", level: 1, value: "hi" }],
  },
  {
    input: "## hi",
    expected: [{ type: "heading", level: 2, value: "hi" }],
  },
  {
    input: "### hi",
    expected: [{ type: "heading", level: 3, value: "hi" }],
  },
  {
    input: "#### hi",
    expected: [{ type: "heading", level: 4, value: "hi" }],
  },
  {
    input: "##### hi",
    expected: [{ type: "heading", level: 5, value: "hi" }],
  },
  {
    input: "###### hi",
    expected: [{ type: "heading", level: 6, value: "hi" }],
  },
  {
    input: `[link text](https://link-url.org)`,
    expected: [
      {
        type: "paragraph",
        value: [
          {
            type: "link",
            href: "https://link-url.org",
            text: "link text",
          },
        ],
      },
    ],
  },
  {
    input: `**bold text**`,
    expected: [
      {
        type: "paragraph",
        value: [
          {
            type: "bold",
            value: "bold text",
          },
        ],
      },
    ],
  },
  {
    input: `*italic text*`,
    expected: [
      {
        type: "paragraph",
        value: [
          {
            type: "italic",
            value: "italic text",
          },
        ],
      },
    ],
  },
  {
    input: `Text with **bold** and *italic* :)`,
    expected: [
      {
        type: "paragraph",
        value: [
          {
            type: "text",
            value: "Text with ",
          },
          {
            type: "bold",
            value: "bold",
          },
          {
            type: "text",
            value: " and ",
          },
          {
            type: "italic",
            value: "italic",
          },
          {
            type: "text",
            value: " :)",
          },
        ],
      },
    ],
  },
];

Deno.test("markdown parsing", async (t) => {
  for (const { input, expected } of parserTestData) {
    await t.step(`parses "${input}" correctly`, () => {
      const result = parseMarkdown(input);
      assertEquals(result.content, expected);
    });
  }
});

const htmlTestData = [
  {
    input: "# hi",
    expected: `<h1>hi</h1>\n`,
  },
  {
    input: "## hi",
    expected: `<h2>hi</h2>\n`,
  },
  {
    input: "### hi",
    expected: `<h3>hi</h3>\n`,
  },
  {
    input: "#### hi",
    expected: `<h4>hi</h4>\n`,
  },
  {
    input: "##### hi",
    expected: `<h5>hi</h5>\n`,
  },
  {
    input: "###### hi",
    expected: `<h6>hi</h6>\n`,
  },
  {
    input: "This is a paragraph",
    expected: `<p>This is a paragraph</p>\n`,
  },
  {
    input: `Multi line
paragraph content`,
    expected: `<p>Multi line paragraph content</p>\n`,
  },
  {
    input: `[link text](https://link-url.org)`,
    expected: `<p><a href="https://link-url.org">link text</a></p>\n`,
  },
  {
    input: `**bold text**`,
    expected: `<p><strong>bold text</strong></p>\n`,
  },
  {
    input: `*italic text*`,
    expected: `<p><em>italic text</em></p>\n`,
  },
  {
    input: `Text with **bold** and *italic* :)`,
    expected: `<p>Text with <strong>bold</strong> and <em>italic</em> :)</p>\n`,
  },
];

Deno.test("html generation", () => {
  for (const { input, expected } of htmlTestData) {
    const parsedContent = parseMarkdown(input);
    const out = markdownToHTML(parsedContent.content);
    assertEquals(out, expected);
  }
});
