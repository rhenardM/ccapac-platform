"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Loader2, Reply as ReplyIcon, Send } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { postComment, postReply } from "@/actions/comments";
import type { ArticleComment, CommentAuthorRole } from "@/types/comment";

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Horodatage relatif façon réseau social ("il y a 2 heures"), retombe sur une date absolue passé une semaine. */
const formatRelative = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffSec = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return "à l'instant";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `il y a ${diffH} h`;
  const diffDay = Math.round(diffH / 24);
  if (diffDay < 7) return `il y a ${diffDay} j`;
  return DATE_FMT.format(date);
};

const ROLE_LABEL: Record<CommentAuthorRole, string> = {
  visitor: "",
  member: "Membre",
  admin: "Centre culturel",
};

type SortOrder = "newest" | "oldest";

interface CommentSectionProps {
  slug: string;
  initialComments: ArticleComment[];
  isLoggedIn: boolean;
}

export default function CommentSection({ slug, initialComments, isLoggedIn }: CommentSectionProps) {
  const [comments, setComments] = useState<ArticleComment[]>(initialComments);
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  const sortedComments = useMemo(() => {
    const sorted = [...comments];
    if (sortOrder === "newest") sorted.reverse();
    return sorted;
  }, [comments, sortOrder]);

  return (
    <section className="container mx-auto mt-16 px-4 sm:mt-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-muted/20 pt-10">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 bg-primary" />
            <h2 className="text-xl font-bold uppercase tracking-tight text-foreground sm:text-2xl">
              Commentaires {totalCount > 0 && `(${totalCount})`}
            </h2>
          </div>

          {comments.length > 1 && (
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
              <button
                type="button"
                onClick={() => setSortOrder("oldest")}
                className={`rounded-full px-3.5 py-1.5 transition ${
                  sortOrder === "oldest"
                    ? "bg-foreground text-white"
                    : "bg-white text-muted-foreground ring-1 ring-muted/20 hover:text-foreground"
                }`}
              >
                Plus anciens
              </button>
              <button
                type="button"
                onClick={() => setSortOrder("newest")}
                className={`rounded-full px-3.5 py-1.5 transition ${
                  sortOrder === "newest"
                    ? "bg-foreground text-white"
                    : "bg-white text-muted-foreground ring-1 ring-muted/20 hover:text-foreground"
                }`}
              >
                Plus récents
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-6">
          {sortedComments.length === 0 && (
            <p className="rounded-2xl bg-white p-5 text-sm text-muted-foreground shadow-sm ring-1 ring-muted/10">
              Soyez le premier à commenter cet article.
            </p>
          )}

          {sortedComments.map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              isLoggedIn={isLoggedIn}
              onReplyPosted={(reply) =>
                setComments((prev) =>
                  prev.map((c) =>
                    c.id === comment.id ? { ...c, replies: [...c.replies, reply] } : c
                  )
                )
              }
            />
          ))}
        </div>

        <NewCommentForm
          slug={slug}
          onPosted={(comment) => setComments((prev) => [...prev, comment])}
        />
      </div>
    </section>
  );
}

function CommentThread({
  comment,
  isLoggedIn,
  onReplyPosted,
}: {
  comment: ArticleComment;
  isLoggedIn: boolean;
  onReplyPosted: (reply: ArticleComment) => void;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-muted/10">
      <CommentBubble comment={comment} />

      {isLoggedIn && (
        <button
          type="button"
          onClick={() => setShowReplyForm((v) => !v)}
          className="mt-3 ml-[52px] inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
        >
          <ReplyIcon size={13} />
          Répondre
        </button>
      )}

      {showReplyForm && (
        <div className="ml-[52px] mt-3">
          <ReplyForm
            commentId={comment.id}
            onPosted={(reply) => {
              onReplyPosted(reply);
              setShowReplyForm(false);
            }}
          />
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="ml-[52px] mt-4 space-y-4 border-l-2 border-muted/20 pl-5">
          {comment.replies.map((reply) => (
            <CommentBubble key={reply.id} comment={reply} compact />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentBubble({ comment, compact }: { comment: ArticleComment; compact?: boolean }) {
  return (
    <div className="flex gap-3">
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold uppercase text-primary ${
          compact ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
        }`}
      >
        {comment.authorName.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-bold text-foreground">{comment.authorName}</span>
          {comment.authorRole === "admin" && (
            <BadgeCheck size={15} className="text-primary" aria-label={ROLE_LABEL.admin} />
          )}
          {comment.authorRole === "member" && (
            <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {ROLE_LABEL.member}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{formatRelative(comment.createdAt)}</span>
        </div>
        <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-foreground/90">
          {comment.content}
        </p>
      </div>
    </div>
  );
}

function NewCommentForm({
  slug,
  onPosted,
}: {
  slug: string;
  onPosted: (comment: ArticleComment) => void;
}) {
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authorName.trim() || !authorEmail.trim() || !content.trim()) {
      toast.error("Merci de remplir tous les champs.");
      return;
    }

    setIsLoading(true);
    try {
      const comment = await postComment(slug, {
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
        content: content.trim(),
      });
      onPosted(comment);
      setContent("");
      toast.success("Commentaire publié !");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Le commentaire n'a pas pu être publié."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-muted/10"
    >
      <div className="border-b border-muted/15 bg-muted/5 px-5 py-3 sm:px-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Laisser un commentaire
        </h3>
      </div>
      <div className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Votre nom"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            disabled={isLoading}
          />
          <Input
            type="email"
            placeholder="Votre e-mail (non publié)"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <Textarea
          className="mt-3 rounded-xl"
          rows={3}
          placeholder="Partagez votre avis sur cet article..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isLoading}
        />
        <div className="mt-4 flex justify-end">
          <Button
            type="submit"
            className="rounded-full px-6 uppercase tracking-wide"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Send />
                Publier
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ReplyForm({
  commentId,
  onPosted,
}: {
  commentId: number;
  onPosted: (reply: ArticleComment) => void;
}) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const reply = await postReply(commentId, content.trim());
      onPosted(reply);
      setContent("");
      toast.success("Réponse publiée !");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "La réponse n'a pas pu être publiée."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <Textarea
        rows={2}
        placeholder="Votre réponse"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isLoading}
        className="rounded-xl bg-white"
      />
      <Button type="submit" size="sm" className="rounded-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : <Send />}
      </Button>
    </form>
  );
}
