import Link from "next/link";
import { ReactNode } from "react";

export function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      const href = getSafeHref(match[3]);
      nodes.push(
        href ? (
          <Link
            key={`link-${match.index}`}
            href={href}
            className="font-black text-primary underline underline-offset-4"
          >
            {match[2]}
          </Link>
        ) : (
          match[2]
        )
      );
    } else if (match[4]) {
      nodes.push(
        <strong key={`strong-${match.index}`} className="font-black text-black">
          {match[4]}
        </strong>
      );
    } else if (match[5]) {
      nodes.push(
        <em key={`em-${match.index}`} className="italic text-zinc-900">
          {match[5]}
        </em>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function getSafeHref(href: string) {
  const trimmed = href.trim();

  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("mailto:")
  ) {
    return trimmed;
  }

  return "";
}
