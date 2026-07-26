import type { LeagueData, Round } from "@/types";
import { formatDate, sortTeamsByMainRank } from "@/lib/standings";
import { isLeagueRound } from "@/lib/rounds";

export default function RoundScheduleInfo({
  round,
  data,
}: {
  round: Round;
  data: LeagueData;
}) {
  const participatingTeams = sortTeamsByMainRank(data, round.participatingTeamIds);

  return (
    <div className="card max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs px-3 py-1 rounded-full bg-accent/10 text-accent-dark font-medium">
          開催予定
        </span>
        {!isLeagueRound(round) && (
          <span className="text-xs tag-red">リーグ外</span>
        )}
      </div>

      <dl className="space-y-5">
        {round.date && (
          <div>
            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">日程</dt>
            <dd className="text-lg font-bold text-primary-dark">{formatDate(round.date)}</dd>
          </div>
        )}
        {round.time && (
          <div>
            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">時間</dt>
            <dd className="text-base text-gray-800">{round.time}</dd>
          </div>
        )}
        {round.venue && (
          <div>
            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">会場</dt>
            <dd className="text-base text-gray-800">📍 {round.venue}</dd>
          </div>
        )}
        {round.contact && (
          <div>
            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">問い合わせ</dt>
            <dd className="text-base text-gray-800 whitespace-pre-wrap">{round.contact}</dd>
          </div>
        )}
        {round.notes && (
          <div>
            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">備考</dt>
            <dd className="text-base text-gray-600 whitespace-pre-wrap">{round.notes}</dd>
          </div>
        )}
      </dl>

      {!round.date && !round.time && !round.venue && !round.contact && (
        <p className="text-gray-500 text-sm mt-4">
          日程・会場などの詳細は準備中です。しばらくお待ちください。
        </p>
      )}

      {participatingTeams.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h3 className="text-sm font-bold text-gray-600 mb-3">
            参加予定チーム（{participatingTeams.length}）
          </h3>
          <div className="flex flex-wrap gap-2">
            {participatingTeams.map((team) => (
              <span
                key={team.id}
                className="text-xs px-2.5 py-1 rounded-full font-medium text-white"
                style={{ backgroundColor: team.color }}
              >
                {team.shortName || team.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
