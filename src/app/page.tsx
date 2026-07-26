import Link from "next/link";
import { getLeagueData } from "@/lib/data";
import { calculateStandings } from "@/lib/standings";
import NewsList from "@/components/NewsList";
import NextMatchNotice from "@/components/NextMatchNotice";
import StandingsTable from "@/components/StandingsTable";
import SectionTitle from "@/components/SectionTitle";
import TopMainVisualSlideshow from "@/components/TopMainVisualSlideshow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getLeagueData();
  const standingsA = calculateStandings(data, { displayLeague: "A", leagueOnly: true });
  const standingsB = calculateStandings(data, { displayLeague: "B", leagueOnly: true });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden text-white -mb-px">
        <div className="absolute inset-0 bg-primary-dark" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/30 via-primary-dark to-[#0f2f72]" />
        <div className="absolute inset-0 opacity-70 hidden sm:block">
          <span className="absolute -left-20 top-10 w-64 h-64 rounded-full bg-white/8 blur-[2px]" />
          <span className="absolute left-44 top-24 w-40 h-40 rounded-full bg-primary-light/20" />
          <span className="absolute left-[22%] bottom-8 w-56 h-56 rounded-full bg-primary-light/15" />
          <span className="absolute left-[30%] top-0 w-24 h-24 rounded-full bg-accent/18" />
        </div>
        <div className="absolute inset-y-0 right-0 hidden sm:flex w-[40%] items-center justify-end pr-4 md:pr-10 z-10">
          <div className="relative w-[320px] h-[320px] md:w-[430px] md:h-[430px] rounded-full overflow-hidden border-4 border-white/45 shadow-2xl">
            <TopMainVisualSlideshow />
          </div>
        </div>

        {/* 大胆な赤白ボール装飾（はみ出し気味） */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <span className="boccia-ball absolute -left-24 -top-24 w-56 h-56 bg-white/90" />
          <span className="boccia-ball absolute left-[34%] -top-14 w-28 h-28 bg-accent/85 hidden sm:block" />
          <span className="boccia-ball absolute -right-16 bottom-12 w-44 h-44 bg-white/85 hidden sm:block" />
          <span className="boccia-ball absolute right-[43%] -bottom-12 w-24 h-24 bg-accent/80 hidden sm:block" />
        </div>

        <div className="relative z-20 max-w-6xl mx-auto px-4 py-20 md:py-28 sm:pl-8 md:pl-14">
          <div className="max-w-2xl sm:max-w-[56%]">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent-light" />
              <p className="text-sm tracking-wider font-medium">
                BOCCIA LEAGUE HIMEJI {data.season}
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight drop-shadow-sm">
              ボッチャリーグひめじ2026
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
              姫路で開催されるボッチャのリーグ大会、誰でもいつでも選手になれるパラスポーツ大会を運営しています。
            </p>
          </div>
        </div>

        {/* 下端の有機的な波形 */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path
              d="M0 80V44C88 30 176 18 264 16C384 14 498 32 612 36C746 41 865 26 994 20C1128 14 1259 21 1384 26L1440 28V80H0Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </section>

      {/* News - Compact */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <SectionTitle
          title="お知らせ"
          action={
            <Link
              href="/news"
              className="text-sm font-medium text-accent hover:text-accent-dark transition-colors"
            >
              一覧へ →
            </Link>
          }
        />
        <NextMatchNotice data={data} />
        <div className="card border-l-4 border-l-primary">
          <NewsList items={data.news} compact limit={5} />
        </div>
      </section>

      {/* Standings */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-pale/60 via-white to-accent-pale/60" />
        <div className="relative max-w-6xl mx-auto px-4 py-10">
          <SectionTitle
            title="現在の順位"
            subtitle={`${data.season}シーズン`}
            action={
              <Link
                href="/standings"
                className="text-sm font-medium text-primary hover:text-primary-light transition-colors"
              >
                順位表へ →
              </Link>
            }
          />
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-primary mb-2">Aリーグ</h3>
              <div className="card !p-0 overflow-hidden ring-1 ring-primary/10">
                <StandingsTable standings={standingsA} compact />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-accent mb-2">Bリーグ</h3>
              <div className="card !p-0 overflow-hidden ring-1 ring-accent/10">
                <StandingsTable standings={standingsB} compact />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 募集バナー */}
      <section className="max-w-6xl mx-auto px-4 py-10 pb-14">
        <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-primary-pale via-white to-accent-pale border border-primary/10 shadow-card">
          <div className="h-1.5 rounded-full bg-stripe mb-4" />
          <div className="space-y-4">
        <Link
          href="/entry"
          className="group relative block overflow-hidden rounded-2xl bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg hover:shadow-card-hover transition-all hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="boccia-ball absolute -right-6 top-1/2 -translate-y-1/2 w-28 h-28 bg-white/15" />
            <span className="boccia-ball absolute right-16 bottom-0 w-14 h-14 bg-white/10" />
          </div>
          <div className="relative flex items-center justify-between gap-4 px-6 py-8 sm:px-10 sm:py-10">
            <div>
              <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] bg-white/20 rounded-full px-3 py-1 mb-3">
                NOW RECRUITING
              </span>
              <p className="text-2xl sm:text-3xl font-bold leading-tight">エントリー募集中</p>
              <p className="mt-2 text-sm sm:text-base text-white/85">
                チーム・個人参加のご相談も歓迎しています
              </p>
            </div>
            <span className="shrink-0 text-2xl sm:text-3xl font-bold opacity-80 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
        </Link>

        <Link
          href="/sponsor"
          className="group relative block overflow-hidden rounded-2xl bg-gradient-to-r from-primary-dark to-primary text-white shadow-lg hover:shadow-card transition-all hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <span className="boccia-ball absolute -left-4 top-1/2 -translate-y-1/2 w-24 h-24 bg-white/10" />
            <span className="boccia-ball absolute left-20 top-2 w-10 h-10 bg-accent/30" />
          </div>
          <div className="relative flex items-center justify-between gap-4 px-6 py-8 sm:px-10 sm:py-10">
            <div>
              <span className="inline-block text-[10px] sm:text-xs font-bold tracking-[0.2em] bg-white/20 rounded-full px-3 py-1 mb-3">
                SPONSOR WANTED
              </span>
              <p className="text-2xl sm:text-3xl font-bold leading-tight">スポンサー募集中</p>
              <p className="mt-2 text-sm sm:text-base text-white/85">
                地域のパラスポーツを一緒に支えてくださる方を募集しています
              </p>
            </div>
            <span className="shrink-0 text-2xl sm:text-3xl font-bold opacity-80 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
        </Link>
          </div>
        </div>
      </section>
    </>
  );
}
