import { HIMEJI_CITY_ENTRY_URL } from "@/lib/entryInfo";

export const metadata = { title: "ボッチャリーグひめじとは" };

function Segment({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-10 sm:py-12 border-b border-gray-200 last:border-b-0">
      {children}
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <header className="text-center pb-10 sm:pb-12 border-b border-gray-200">
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-dark leading-snug tracking-tight">
          誰でも参加できる
          <br />
          パラスポーツの祭典
        </p>
      </header>

      <Segment>
        <p className="text-gray-700 leading-[1.9] text-base sm:text-lg">
          ボッチャリーグひめじは、「誰でも」パラスポーツを「日常的」に楽しめるように開かれた大会です。
          初めての方も、経験者の方も、チームでも個人でも、気軽に参加できます。
        </p>
      </Segment>

      <Segment>
        <h2 className="text-sm font-bold text-primary tracking-wider mb-5">私たちの目的</h2>
        <div className="space-y-5 text-gray-700 leading-[1.9]">
          <p>
            スポーツで得られる表現、実現、成長を通じて、より豊かな生活を目指すこと。
          </p>
          <p>
            ボッチャの認知向上と選手の意欲向上で、競技の発展につなげること。
          </p>
          <p>
            スポーツを通したコミュニティづくりで、横のつながりを広げていくこと。
          </p>
        </div>
      </Segment>

      <Segment>
        <h2 className="text-sm font-bold text-primary tracking-wider mb-5">ボッチャとは？</h2>
        <div className="space-y-5 text-gray-700 leading-[1.9]">
          <p>
            ヨーロッパで生まれた競技で、もともとは重度脳性まひのある方のためのスポーツとして広まりました。
            いまは障害の有無や年齢を問わず、一緒に楽しめるユニバーサルスポーツです。
          </p>
          <p>
            パラリンピックの正式種目として世界中で行われ、1球で試合の流れが変わる戦術性の高さから、
            観る人も引き込まれるスポーツとして注目されています。
          </p>
          <p>
            学校や地域、福祉の現場でも広がりを見せており、「同じルールで誰もが真剣に競える」ことが、
            いまの時代に合ったスポーツとして支持されています。
          </p>
        </div>
      </Segment>

      <Segment>
        <p className="text-gray-600 leading-[1.9] text-sm sm:text-base">
          参加条件や募集の詳細は、
          <a
            href={HIMEJI_CITY_ENTRY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            姫路市の公式ページ
          </a>
          をご覧ください。
        </p>
      </Segment>
    </div>
  );
}
