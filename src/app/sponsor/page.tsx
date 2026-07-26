import Link from "next/link";
import { getContactEmail, getSiteConfig } from "@/lib/site";

export const metadata = { title: "スポンサー募集" };

function Segment({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-10 sm:py-12 border-b border-gray-200 last:border-b-0">
      {children}
    </section>
  );
}

export default async function SponsorPage() {
  const { contact } = await getSiteConfig();
  const email = getContactEmail(contact);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <header className="text-center pb-10 sm:pb-12 border-b border-gray-200">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary mb-3">SPONSOR</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-dark leading-snug">
          スポンサー募集
        </h1>
        <p className="mt-4 text-gray-600 leading-relaxed">
          ボッチャリーグひめじを一緒に盛り上げてくださる企業・個人の方を募集しています。
        </p>
      </header>

      <Segment>
        <h2 className="text-sm font-bold text-primary tracking-wider mb-4">募集内容</h2>
        <p className="text-gray-700 leading-[1.9]">
          ボッチャリーグひめじを応援してくださる企業や個人の方を募集しています。
          地域のパラスポーツを支えるパートナーとして、ご協力をお願いいたします。
        </p>
      </Segment>

      <Segment>
        <h2 className="text-sm font-bold text-primary tracking-wider mb-4">協賛のメリット</h2>
        <ul className="space-y-4 text-gray-700 leading-[1.9]">
          <li>大会チラシ、公式ホームページ、会場などに広告やロゴを掲載できます。</li>
          <li>地域貢献・社会貢献（CSR）活動としてご活用いただけます。</li>
          <li>パラスポーツを通じた地域コミュニティづくりに参画できます。</li>
        </ul>
      </Segment>

      <Segment>
        <h2 className="text-sm font-bold text-primary tracking-wider mb-4">お問い合わせ</h2>
        <p className="text-gray-700 leading-[1.9] mb-4">
          協賛プランの詳細・金額・掲載内容など、詳しくはお問い合わせ先までご連絡ください。
        </p>
        <dl className="space-y-3 text-sm text-gray-700">
          <div>
            <dt className="text-xs font-semibold text-gray-400 mb-0.5">問い合わせ先</dt>
            <dd className="font-medium">{contact.organization}</dd>
          </div>
          {contact.phone && (
            <div>
              <dt className="text-xs font-semibold text-gray-400 mb-0.5">電話</dt>
              <dd>
                <a href={`tel:${contact.phone.replace(/[^\d+-]/g, "")}`} className="hover:text-primary">
                  {contact.phone}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold text-gray-400 mb-0.5">メール</dt>
            <dd>
              <a href={`mailto:${email}`} className="text-primary hover:underline break-all">
                {email}
              </a>
            </dd>
          </div>
        </dl>
        <p className="mt-6">
          <Link href="/contact" className="btn-primary text-sm inline-block">
            お問い合わせページへ
          </Link>
        </p>
      </Segment>
    </div>
  );
}
