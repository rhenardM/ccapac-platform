import { ReactNode } from "react";
import { renderInlineMarkdown } from "./inlineMarkdown";

type ListType = "ul" | "ol";

export default function RichTextContent({ body }: { body: string }) {
  const lines = body.split(/\r?\n/);
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let listType: ListType | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;

    const text = paragraph.join(" ");
    elements.push(
      <p
        key={`p-${elements.length}`}
        className="text-base font-medium leading-8 text-muted-foreground"
      >
        {renderInlineMarkdown(text)}
      </p>
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || listItems.length === 0) return;

    const ListTag = listType;
    elements.push(
      <ListTag
        key={`list-${elements.length}`}
        className={`space-y-3 pl-6 text-base font-medium leading-8 text-muted-foreground ${
          listType === "ol" ? "list-decimal" : "list-disc"
        }`}
      >
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ListTag>
    );
    listItems = [];
    listType = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      elements.push(renderHeading(heading[1].length, heading[2], elements.length));
      return;
    }

    const unorderedItem = trimmed.match(/^[-*]\s+(.+)$/);
    const orderedItem = trimmed.match(/^\d+\.\s+(.+)$/);
    if (unorderedItem || orderedItem) {
      flushParagraph();

      const nextType: ListType = orderedItem ? "ol" : "ul";
      if (listType && listType !== nextType) {
        flushList();
      }

      listType = nextType;
      listItems.push((orderedItem || unorderedItem)?.[1] || "");
      return;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className="rounded-r-2xl border-l-4 border-primary bg-white px-6 py-5 text-lg font-semibold leading-relaxed text-foreground shadow-sm"
        >
          {renderInlineMarkdown(trimmed.replace(/^>\s?/, ""))}
        </blockquote>
      );
      return;
    }

    flushList();
    paragraph.push(trimmed);
  });

  flushParagraph();
  flushList();

  return <div className="space-y-6">{elements}</div>;
}

function renderHeading(level: number, text: string, index: number) {
  const className =
    level === 1
      ? "text-3xl md:text-4xl"
      : level === 2
        ? "text-2xl md:text-3xl"
        : "text-xl md:text-2xl";
  const HeadingTag = `h${level + 1}` as "h2" | "h3" | "h4";

  return (
    <HeadingTag
      key={`h-${index}`}
      className={`${className} pt-4 font-bold uppercase leading-tight tracking-tight text-foreground`}
    >
      {renderInlineMarkdown(text)}
    </HeadingTag>
  );
}
