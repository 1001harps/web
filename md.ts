// for future agnes: https://spec.commonmark.org/

export type InlineNode =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "link";
      href: string;
      text: string;
    }
  | {
      type: "bold";
      value: string;
    }
  | {
      type: "italic";
      value: string;
    };

export type BlockNode =
  | {
      type: "heading";
      level: number;
      value: string;
    }
  | {
      type: "paragraph";
      value: InlineNode[];
    };

export type MarkdownNode = BlockNode;

type MarkdownDocument = {
  frontMatter: Record<string, string>;
  content: MarkdownNode[];
};

export const parseMarkdown = (markdown: string): MarkdownDocument => {
  const lines = markdown.split("\n");
  let inFrontMatter = false;
  const frontMatter: Record<string, string> = {};
  let contentStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "---") {
      if (!inFrontMatter) {
        inFrontMatter = true;
      } else {
        contentStartIndex = i + 1;
        break;
      }
    } else if (inFrontMatter) {
      const [key, ...rest] = line.split(":");
      frontMatter[key.trim()] = rest.join(":").trim();
    }
  }

  const content: MarkdownNode[] = [];

  let lineIndex = contentStartIndex;
  let paragraphLines: string[] = [];

  const parseInlineElements = (text: string): InlineNode[] => {
    const inlineNodes: InlineNode[] = [];
    let remaining = text;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        const [fullMatch, boldText] = boldMatch;
        inlineNodes.push({ type: "bold", value: boldText });
        remaining = remaining.slice(fullMatch.length);
        continue;
      }

      const italicMatch = remaining.match(/^\*(.+?)\*/);
      if (italicMatch) {
        const [fullMatch, italicText] = italicMatch;
        inlineNodes.push({ type: "italic", value: italicText });
        remaining = remaining.slice(fullMatch.length);
        continue;
      }

      const linkMatch = remaining.match(/^\[(.+?)\]\((.+?)\)/);
      if (linkMatch) {
        const [fullMatch, linkText, href] = linkMatch;
        inlineNodes.push({ type: "link", href, text: linkText });
        remaining = remaining.slice(fullMatch.length);
        continue;
      }

      // find the next inline element or slurp text up to it
      const nextElementIndex = remaining.search(/\*\*|\*|\[.+?\]\(.+?\)/);
      const textContent =
        nextElementIndex >= 0
          ? remaining.slice(0, nextElementIndex)
          : remaining;

      if (textContent) {
        inlineNodes.push({ type: "text", value: textContent });
      }
      remaining =
        nextElementIndex >= 0 ? remaining.slice(nextElementIndex) : "";
    }

    return inlineNodes;
  };

  const finalizeParagraph = () => {
    if (paragraphLines.length > 0) {
      const paragraphText = paragraphLines.join(" ").trim();
      const inlineElements = parseInlineElements(paragraphText);
      content.push({
        type: "paragraph",
        value: inlineElements,
      });
      paragraphLines = [];
    }
  };

  while (lineIndex < lines.length) {
    const line = lines[lineIndex].trim();

    if (line === "") {
      finalizeParagraph();
      lineIndex++;
      continue;
    }

    if (line.startsWith("#")) {
      finalizeParagraph();
      const level = line.match(/^#+/)![0].length;
      const value = line.slice(level).trim();
      content.push({ type: "heading", level, value });
      lineIndex++;
      continue;
    }

    paragraphLines.push(line);
    lineIndex++;
  }

  finalizeParagraph();

  return { frontMatter, content };
};

const renderInlineHTML = (nodes: InlineNode[]): string => {
  let html = "";
  for (const node of nodes) {
    if (node.type === "text") {
      html += node.value;
    } else if (node.type === "link") {
      html += `<a href="${node.href}">${node.text}</a>`;
    } else if (node.type === "bold") {
      html += `<strong>${node.value}</strong>`;
    } else if (node.type === "italic") {
      html += `<em>${node.value}</em>`;
    }
  }
  return html;
};

export const markdownToHTML = (md: MarkdownNode[]): string => {
  let out = ``;

  for (const node of md) {
    if (node.type === "heading") {
      out += `<h${node.level}>${node.value}</h${node.level}>\n`;
    } else if (node.type === "paragraph") {
      const inlineHTML = renderInlineHTML(node.value);
      out += `<p>${inlineHTML}</p>\n`;
    }
  }

  return out;
};
