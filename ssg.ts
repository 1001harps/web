import { walk } from "@std/fs/walk";
import { markdownToHTML, parseMarkdown } from "./md.ts";

const SOURCE_DIR = "content";
const OUTPUT_DIR = "public";

const TEMPLATE = Deno.readTextFileSync(`${SOURCE_DIR}/__template.html`);

interface BlogPage {
  title: string;
  date: string;
  path: string;
}

const blogPages: BlogPage[] = [];

for await (const entry of walk(SOURCE_DIR, { exts: ["md"] })) {
  const relativePath = entry.path
    .replace(SOURCE_DIR, "")
    .replace(".md", ".html");

  const outputPath = `${OUTPUT_DIR}/${relativePath}`;

  // make sure output directory exists
  const outputDir = outputPath.split("/").slice(0, -1).join("/");
  Deno.mkdirSync(outputDir, { recursive: true });

  const fileContent = Deno.readTextFileSync(entry.path);
  const md = parseMarkdown(fileContent);
  const contentHTML = markdownToHTML(md.content);

  let page = TEMPLATE;

  for (const key in md.frontMatter) {
    if (key === "title") {
      page = page.replace(
        `{{title}}`,
        `1001harps dot com - ${md.frontMatter.title}`
      );
      continue;
    }

    page = page.replace(`{{${key}}}`, md.frontMatter[key]);
  }

  // blog header idk maybe i need a better templating system
  if (relativePath.startsWith("/blog/")) {
    let content = `<h2>${md.frontMatter.date}: ${md.frontMatter.title}</h2>\n`;
    content += contentHTML;
    page = page.replace("{{content}}", content);

    // collect metadata for later
    blogPages.push({
      title: md.frontMatter.title,
      date: md.frontMatter.date,
      path: relativePath,
    });
  } else {
    page = page.replace("{{content}}", contentHTML);
  }

  Deno.writeTextFileSync(outputPath, page);
}

// special casing our index page because its special
const content = `<h3>blog:</h3>
<ul>
${blogPages
  .sort((a, b) => (a.date < b.date ? 1 : -1))
  .map(
    (page) => `<li><a href="${page.path}">${page.date}: ${page.title}</a></li>`
  )
  .join("\n")}
<ul>
`;

const indexPage = TEMPLATE.replace("{{title}}", "1001harps dot com").replace(
  "{{content}}",
  content
);

Deno.writeTextFileSync(`${OUTPUT_DIR}/index.html`, indexPage);
