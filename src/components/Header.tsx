"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { headerNavItems, isNavActive } from "@/lib/navigation";

interface HeaderProps {
  sidebarOpen: boolean;
  onMenuToggle: () => void;
}

export default function Header({ sidebarOpen, onMenuToggle }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="h-1 bg-stripe" />
      <div className="border-b border-gray-100">
        <div className="flex items-center justify-between h-16 px-4 max-w-6xl mx-auto w-full">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="relative w-11 h-11 flex-shrink-0">
              <span className="boccia-ball absolute top-0 left-0 w-7 h-7 bg-primary" />
              <span className="boccia-ball absolute bottom-0 right-0 w-7 h-7 bg-accent" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-primary-dark text-lg leading-tight group-hover:text-primary transition-colors truncate">
                ボッチャリーグひめじ
              </p>
              <p className="text-xs text-gray-400 tracking-wider hidden sm:block">
                BOCCIA LEAGUE HIMEJI
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* ヘッダー主要メニュー（タブレット以上） */}
            <nav className="hidden md:flex items-center gap-1">
              {headerNavItems.map((item, i) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 lg:px-4 py-2 text-sm font-medium rounded-full transition-all ${
                      active
                        ? i % 2 === 0
                          ? "bg-primary-pale text-primary"
                          : "bg-accent-pale text-accent-dark"
                        : i % 2 === 0
                          ? "text-gray-700 hover:text-primary hover:bg-primary-pale"
                          : "text-gray-700 hover:text-accent hover:bg-accent-pale"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* メニュー開閉（右端） */}
            <button
              type="button"
              onClick={onMenuToggle}
              className={`ml-1 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold transition-all ${
                sidebarOpen
                  ? "bg-primary text-white"
                  : "bg-primary-dark text-white hover:bg-primary"
              }`}
              aria-label={sidebarOpen ? "メニューを閉じる" : "メニューを開く"}
              aria-expanded={sidebarOpen}
            >
              <span className="hidden sm:inline text-[10px] tracking-widest">MENU</span>
              {sidebarOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
