export interface NavItem {
  href: string;
  label: string;
}

export interface SidebarNavItem extends NavItem {
  labelEn: string;
}

/** ヘッダーに表示する主要メニュー */
export const headerNavItems: NavItem[] = [
  { href: "/", label: "トップ" },
  { href: "/schedule", label: "日程・結果" },
  { href: "/standings", label: "順位" },
  { href: "/awards", label: "個人賞" },
  { href: "/teams", label: "チーム一覧" },
];

/** サイドバー上部に表示するアクションボタン */
export const sidebarActionItems: SidebarNavItem[] = [
  { href: "/entry", label: "エントリー", labelEn: "ENTRY" },
  { href: "/contact", label: "お問い合わせ", labelEn: "CONTACT" },
];

/** サイドバーに表示する全体メニュー */
export const sidebarNavItems: SidebarNavItem[] = [
  { href: "/", label: "トップ", labelEn: "TOP" },
  { href: "/about", label: "ボッチャリーグひめじとは", labelEn: "ABOUT" },
  { href: "/schedule", label: "日程・結果", labelEn: "SCHEDULE" },
  { href: "/standings", label: "順位表", labelEn: "STANDINGS" },
  { href: "/awards", label: "個人賞", labelEn: "AWARDS" },
  { href: "/teams", label: "チーム一覧", labelEn: "TEAMS" },
  { href: "/reports", label: "大会レポート", labelEn: "REPORTS" },
  { href: "/archive", label: "過去大会", labelEn: "ARCHIVE" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
