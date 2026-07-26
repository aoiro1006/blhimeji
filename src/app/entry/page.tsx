import Link from "next/link";
import { getLeagueData } from "@/lib/data";
import { HIMEJI_CITY_ENTRY_URL } from "@/lib/entryInfo";
import SectionTitle from "@/components/SectionTitle";

export const dynamic = "force-dynamic";

export const metadata = { title: "エントリー" };

export default async function EntryPage() {
  const data = await getLeagueData();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <SectionTitle title="エントリー" subtitle={`${data.season}シーズン`} />

      <div className="card mb-6 bg-gradient-to-br from-primary-pale/80 to-white border-primary/15">
        <p className="text-gray-700 leading-relaxed">
          姫路市で年間通してボッチャを競技できる場として、ボッチャリーグを開催しています。
          ボッチャを日常的に楽しみたい方、競技力を向上させたい方、体験してみたい方など、どなたでもご参加いただけます。
          単発・不定期での参加も大歓迎です。
        </p>
        <p className="mt-4 text-sm text-gray-600">
          詳しい募集要項・申込方法は
          <a
            href={HIMEJI_CITY_ENTRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline mx-1"
          >
            姫路市の公式ページ
          </a>
          をご確認ください。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <section className="card">
          <h2 className="font-bold text-lg text-primary-dark mb-4">参加条件</h2>
          <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
            <li className="flex gap-2">
              <span className="text-primary shrink-0">●</span>
              <span>
                <strong className="text-gray-800">対象：</strong>
                障害のある方が所属している姫路市内の事業者・団体等
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">●</span>
              <span>
                <strong className="text-gray-800">チーム編成：</strong>
                1チーム3人から6人で競技します
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">●</span>
              <span>
                <strong className="text-gray-800">個人参加：</strong>
                個人での参加も受け付けています。チームの人数が揃わない場合もお気軽にご相談ください
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary shrink-0">●</span>
              <span>
                興味はあるが上記の要件に該当しない方も、まずはお問い合わせください
              </span>
            </li>
          </ul>
        </section>

        <section className="card">
          <h2 className="font-bold text-lg text-primary-dark mb-4">参加費用</h2>
          <p className="text-2xl font-bold text-primary mb-2">無料</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            会場までの交通費等は自費となります。
          </p>
        </section>
      </div>

      <section className="card">
        <h2 className="font-bold text-lg text-primary-dark mb-4">申込・お問い合わせ</h2>
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          参加の申込・個人参加のご相談などは、お問い合わせページよりご連絡ください。
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/contact" className="btn-primary text-sm">
            お問い合わせページへ
          </Link>
          <a
            href={HIMEJI_CITY_ENTRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >
            姫路市の公式ページを見る
          </a>
        </div>
      </section>
    </div>
  );
}
