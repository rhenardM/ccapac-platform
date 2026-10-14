"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  removeProfilePhotoAction,
  updateProfilePhotoAction,
} from "./actions";

type ProfilePhotoUploaderProps = {
  initialImageUrl: string | null;
  userName: string;
};

const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

export function ProfilePhotoUploader({
  initialImageUrl,
  userName,
}: ProfilePhotoUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const displayImageUrl = previewUrl || imageUrl;
  const initial = userName.charAt(0).toUpperCase();

  const handleChooseFile = () => {
    inputRef.current?.click();
  };

  const clearPreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    setPreviewUrl(null);
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearPreviewUrl();
    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);

    const formData = new FormData();
    formData.append("photo", file);

    startTransition(async () => {
      try {
        const result = await updateProfilePhotoAction(formData);

        if (!result.success) {
          toast.error(result.error || "La photo n'a pas pu être mise à jour.");
          return;
        }

        setImageUrl(result.imageUrl || null);
        toast.success("Photo de profil mise à jour");
        router.refresh();
      } catch (error) {
        console.error("Erreur lors de l'upload de la photo:", error);
        toast.error("La photo n'a pas pu être mise à jour.");
      } finally {
        clearPreviewUrl();
        event.target.value = "";
      }
    });
  };

  const handleRemovePhoto = () => {
    startTransition(async () => {
      const result = await removeProfilePhotoAction();

      if (!result.success) {
        toast.error(result.error || "La photo n'a pas pu être supprimée.");
        return;
      }

      setImageUrl(null);
      clearPreviewUrl();
      toast.success("Photo de profil supprimée");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="relative">
        <Avatar
          className={cn(
            "w-24 h-24 border-4 border-background shadow-lg",
            isPending && "opacity-70"
          )}
        >
          {displayImageUrl && (
            <AvatarImage src={displayImageUrl} alt={userName} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {initial}
          </AvatarFallback>
        </Avatar>
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          className="hidden"
          onChange={handleFileChange}
          disabled={isPending}
        />
        <Button
          type="button"
          size="sm"
          onClick={handleChooseFile}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
          Changer la photo
        </Button>
        {imageUrl && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleRemovePhoto}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
