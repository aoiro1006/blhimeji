import Link from "next/link";
import { getContactEmail, getGoogleFormEmbedUrl, getSiteConfig } from "@/lib/site";
import { HIMEJI_CITY_ENTRY_URL } from "@/lib/entryInfo";
import ContactForm from "@/components/ContactForm";
import SectionTitle from "@/components/SectionTitle";

export const dynamic = "force-dynamic";

export const metadata = { title: "お問い合わせ" };

export default async function ContactPage() {
  const { contact } = await getSiteConfig();
  const toEmail = getContactEmail(contact);
  const googleFormUrl = getGoogleFormEmbedUrl(contact);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionTitle title="お問い合わせ" subtitle="CONTACT" />

      <div className="grid lg:grid-cols-5 gap-8">
        {/* 連絡先 */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <h2 className="font-bold text-lg text-primary-dark mb-4">連絡先</h2>
            {contact.note && (
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">{contact.note}</p>
            )}
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              大会への参加申込、個人参加のご相談、チーム編成のご相談など、お気軽にお問い合わせください。
              <strong className="text-gray-800">個人での参加も受け付けています。</strong>
            </p>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              参加条件の詳細は
              <Link href="/entry" className="text-primary font-medium hover:underline mx-1">
                エントリーページ
              </Link>
              、募集要項は
              <a
                href={HIMEJI_CITY_ENTRY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline mx-1"
              >
                姫路市の公式ページ
              </a>
              もご覧ください。
            </p>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  団体名
                </dt>
                <dd className="font-medium text-gray-800">{contact.organization}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  メール
                </dt>
                <dd>
                  <a
                    href={`mailto:${toEmail}`}
                    className="font-medium text-primary hover:underline break-all"
                  >
                    {toEmail}
                  </a>
                </dd>
              </div>
              {contact.phone && (
                <div>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    電話
                  </dt>
                  <dd>
                    <a href={`tel:${contact.phone.replace(/[^\d+-]/g, "")}`} className="font-medium text-gray-800">
                      {contact.phone}
                    </a>
                  </dd>
                </div>
              )}
              {contact.address && (
                <div>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    所在地
                  </dt>
                  <dd className="text-gray-800 whitespace-pre-wrap">{contact.address}</dd>
                </div>
              )}
              {contact.hours && (
                <div>
                  <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    受付時間
                  </dt>
                  <dd className="text-gray-800 whitespace-pre-wrap">{contact.hours}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* フォーム */}
        <div className="lg:col-span-3">
          <h2 className="font-bold text-lg text-primary-dark mb-4">お問い合わせフォーム</h2>
          {googleFormUrl ? (
            <>
              <div className="card !p-0 overflow-hidden">
                <iframe
                  src={googleFormUrl}
                  title="お問い合わせフォーム"
                  className="w-full border-0"
                  style={{ minHeight: "720px" }}
                >
                  読み込み中…
                </iframe>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                フォームが表示されない場合は{" "}
                <a href={`mailto:${toEmail}`} className="text-primary hover:underline">
                  {toEmail}
                </a>{" "}
                へ直接ご連絡ください。
              </p>
            </>
          ) : (
            <>
              <ContactForm toEmail={toEmail} />
              <p className="text-xs text-gray-400 mt-3">
                メールアプリが起動しない場合は、左の連絡先メールアドレスへ直接ご連絡ください。
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
