import Link from "next/link";
import { getContactEmail, getSiteConfig } from "@/lib/site";
import { HIMEJI_CITY_ENTRY_URL } from "@/lib/entryInfo";

export default async function Footer() {
  const { contact } = await getSiteConfig();
  const email = getContactEmail(contact);

  return (
    <footer className="mt-auto">
      <div className="h-1 bg-stripe" />
      <div className="bg-primary-dark text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <span className="boccia-ball absolute top-0 left-0 w-6 h-6 bg-primary-light opacity-90" />
                <span className="boccia-ball absolute bottom-0 right-0 w-6 h-6 bg-accent opacity-90" />
              </div>
              <div>
                <p className="font-bold text-xl">ボッチャリーグひめじ</p>
                <p className="text-sm text-white/60 tracking-wider">BOCCIA LEAGUE HIMEJI</p>
              </div>
            </div>
            <div className="text-sm text-white/70 space-y-1">
              <p>申込・問い合わせ：{contact.organization}</p>
              {contact.phone && (
                <p>
                  電話：{" "}
                  <a
                    href={`tel:${contact.phone.replace(/[^\d+-]/g, "")}`}
                    className="hover:text-white hover:underline"
                  >
                    {contact.phone}
                  </a>
                </p>
              )}
              <p>
                メール：{" "}
                <a href={`mailto:${email}`} className="hover:text-white hover:underline break-all">
                  {email}
                </a>
              </p>
              <p className="pt-1">
                <Link href="/entry" className="hover:text-white hover:underline">
                  エントリー
                </Link>
                {" · "}
                <Link href="/contact" className="hover:text-white hover:underline">
                  お問い合わせ
                </Link>
                {" · "}
                <a
                  href={HIMEJI_CITY_ENTRY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline"
                >
                  姫路市公式ページ
                </a>
              </p>
            </div>
          </div>
          <div className="border-t border-white/15 mt-8 pt-6 text-center text-xs text-white/40">
            <p>&copy; {new Date().getFullYear()} ボッチャリーグひめじ All Rights Reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
