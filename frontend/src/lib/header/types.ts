export type SubmenuItem = {
  name: string;
  href: string;
};

export type MenuItem = {
  title: string;
  href: string;
  submenu?: SubmenuItem[];
};

export type SocialLink = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};
