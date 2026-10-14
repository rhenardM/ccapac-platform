import { SOCIAL_LINKS } from "@/lib/header/constants";

export function SocialBar() {
  return (
    <div className="hidden border-b border-white/10 bg-secondary sm:block">
      <div className="mx-auto flex min-h-10 max-w-[1440px] items-center justify-end px-6 lg:px-8">
        <div className="flex items-center gap-1.5">
          {SOCIAL_LINKS.map(({ href, icon: Icon, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Icon className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
