import Image from "next/image";
import { IoIosMail } from "react-icons/io";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import type { Member } from "@/data/member";

interface MemberCardProps {
  member: Member;
}

export default function MemberCard({ member }: MemberCardProps) {
  return (
    <Card className="group overflow-hidden rounded-xl border-0 bg-gradient-to-br from-white to-muted/20">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-muted/30 to-muted/60">
        <Image
          src={member.photo || "/placeholder.svg"}
          alt={member.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <CardHeader className="text-center pb-2 pt-4 px-3 sm:px-4">
        <CardTitle className="text-sm sm:text-base font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
          {member.name}
        </CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
          {member.position}
        </p>
      </CardHeader>

      <CardContent className="text-center pb-4 pt-1 px-3 sm:px-4">
        <a
          href={`mailto:${member.email}`}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-xs sm:text-sm bg-primary/5 hover:bg-primary/10 px-3 py-2 rounded-full group-hover:shadow-md"
          aria-label={`Envoyer un email à ${member.name}`}
        >
          <IoIosMail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="truncate max-w-[120px] sm:max-w-[150px]">
            {member.email}
          </span>
        </a>
      </CardContent>
    </Card>
  );
}

