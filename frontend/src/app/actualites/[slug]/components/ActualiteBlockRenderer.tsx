import Image from "next/image";
import { FileText, Quote } from "lucide-react";
import { ActualiteBlock } from "@/types/actualite";
import RichTextContent from "./RichTextContent";

export default function ActualiteBlockRenderer({
  block,
}: {
  block: ActualiteBlock;
}) {
  if (block.__component === "shared.quote") {
    return (
      <blockquote className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-muted/10 sm:p-8">
        <Quote className="mb-5 h-8 w-8 text-primary" />
        {block.title && (
          <h2 className="mb-4 text-2xl font-bold uppercase tracking-tight">
            {block.title}
          </h2>
        )}
        {block.body && (
          <p className="text-lg font-medium leading-relaxed text-muted-foreground">
            {block.body}
          </p>
        )}
      </blockquote>
    );
  }

  if (block.__component === "shared.rich-text" && block.body) {
    return <RichTextContent body={block.body} />;
  }

  if (block.__component === "shared.media" && block.file?.url) {
    return <MediaBlock file={block.file} />;
  }

  if (block.__component === "shared.slider" && block.files?.length) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {block.files.map((file) => (
          <MediaBlock key={file.url || file.name} file={file} />
        ))}
      </div>
    );
  }

  return null;
}

function MediaBlock({ file }: { file: { url?: string; name?: string } }) {
  if (!file.url) return null;

  const isImage = /\.(png|jpe?g|webp|gif|avif)$/i.test(file.url);

  if (!isImage) {
    return (
      <a
        href={file.url}
        className="flex items-center gap-3 rounded-2xl bg-white p-5 font-semibold text-primary shadow-sm ring-1 ring-muted/10 transition hover:text-primary/80"
      >
        <FileText size={20} />
        {file.name || "Voir le fichier"}
      </a>
    );
  }

  return (
    <figure className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-muted/10">
      <div className="relative aspect-[16/10]">
        <Image
          src={file.url}
          alt={file.name || "Image actualité"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      {file.name && (
        <figcaption className="px-5 py-3 text-sm text-muted-foreground">
          {file.name}
        </figcaption>
      )}
    </figure>
  );
}
