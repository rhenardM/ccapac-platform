import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <div className="flex min-w-0 items-center justify-start">
      <Link
        href="/"
        className="flex items-center rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Image
          src="/logo-grand-tambour.png"
          alt="Logo Grand Tambour"
          width={100}
          height={100}
          className="h-12 w-auto flex-shrink-0 drop-shadow-md sm:h-16"
        />
      </Link>
    </div>
  );
}
