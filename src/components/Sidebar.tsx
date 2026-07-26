"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, sidebarActionItems, sidebarNavItems } from "@/lib/navigation";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export default function Sidebar({ open, onClose, onOpen }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* オーバーレイ */}
      <button
        type="button"
        aria-label="メニューを閉じる"
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* 右側ドロワー */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-72 sm:w-80 bg-primary-dark shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="h-1 bg-stripe shrink-0" />

        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
          <div>
            <p className="text-[10px] font-semibold text-white/50 tracking-[0.2em]">MENU</p>
            <p className="text-sm font-bold text-white">メニュー</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {sidebarNavItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block px-5 py-4 border-b border-white/5 transition-colors ${
                  active
                    ? "bg-white/10 border-l-4 border-l-accent"
                    : "hover:bg-white/5 border-l-4 border-l-transparent"
                }`}
              >
                <span className="block text-[10px] font-semibold text-white/45 tracking-[0.15em] leading-none mb-1.5">
                  {item.labelEn}
                </span>
                <span className={`block text-sm font-bold ${active ? "text-white" : "text-white/90"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

        </nav>

        <div className="px-5 py-4 border-t border-white/10 shrink-0 space-y-3">
          {sidebarActionItems.map((item) => {
            const active = isNavActive(pathname, item.href);
            const isEntry = item.href === "/entry";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block w-full text-center py-3.5 rounded-full font-bold text-sm transition-all ${
                  isEntry
                    ? active
                      ? "bg-accent-light text-white ring-2 ring-white/40"
                      : "bg-accent text-white hover:bg-accent-light"
                    : active
                      ? "bg-primary-light text-white ring-2 ring-white/40"
                      : "bg-primary text-white hover:bg-primary-light"
                }`}
              >
                <span className="block text-[9px] font-semibold tracking-[0.15em] opacity-80 mb-0.5">
                  {item.labelEn}
                </span>
                {item.label}
              </Link>
            );
          })}
          <p className="text-[10px] text-white/40 tracking-wider text-center pt-1">BOCCIA LEAGUE HIMEJI</p>
          <Link
            href="/admin"
            onClick={onClose}
            className="block text-center text-[10px] text-white/25 hover:text-white/45 transition-colors tracking-wide py-1"
          >
            管理
          </Link>
        </div>
      </aside>

      {/* 閉じているときの右端タブ（播磨オープンゴルフ風） */}
      <button
        type="button"
        onClick={onOpen}
        className={`fixed top-1/2 right-0 z-30 -translate-y-1/2 bg-primary-dark text-white shadow-lg rounded-l-lg py-4 px-1.5 flex flex-col items-center gap-2 transition-all duration-300 hover:bg-primary hover:pl-2 ${
          open ? "opacity-0 pointer-events-none translate-x-full" : "opacity-100"
        }`}
        aria-label="メニューを開く"
        aria-expanded={open}
      >
        <span className="text-[9px] font-bold tracking-widest [writing-mode:vertical-rl]">MENU</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </>
  );
}
