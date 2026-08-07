"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { LeagueData, Match, SeasonArchive } from "@/types";
import { ADDITIONAL_MATCH_GROUPS, PRIMARY_MATCH_GROUPS } from "@/lib/matchGroups";
import type { AdminEditorState } from "@/app/admin/types";
import { useUnsavedChangesGuard } from "@/app/admin/hooks/useUnsavedChangesGuard";
import NewsEditor from "./components/NewsEditor";
import TeamsEditor from "./components/TeamsEditor";
import ScheduleEditor from "./components/ScheduleEditor";
import ResultsEditor from "./components/ResultsEditor";
import PlayerAwardsEditor from "./components/PlayerAwardsEditor";
import ArchivesEditor from "./components/ArchivesEditor";
import AdminToast from "./components/AdminToast";

type Tab = "news" | "teams" | "schedule" | "results" | "awards" | "archives";

type ApiPutOptions = {
  /** false のとき loadData を省略（連続保存用）。省略時は true */
  reload?: boolean;
};

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [authMode, setAuthMode] = useState<"local" | "supabase">("local");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [data, setData] = useState<LeagueData | null>(null);
  const [documentVersion, setDocumentVersion] = useState(0);
  const documentVersionRef = useRef(0);
  const [archives, setArchives] = useState<SeasonArchive[]>([]);
  const [archiveVersions, setArchiveVersions] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<Tab>("teams");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editorState, setEditorState] = useState<AdminEditorState | null>(null);

  const { requestAction, dialog, isDirty } = useUnsavedChangesGuard(editorState);

  const checkAuth = useCallback(async () => {
    const res = await fetch("/api/auth");
    const json = await res.json();
    setAuthenticated(json.authenticated);
    setAuthMode(json.mode === "supabase" ? "supabase" : "local");
  }, []);

  const loadData = useCallback(async () => {
    const res = await fetch("/api/admin");
    if (!res.ok) return;
    const json = await res.json();
    const { documentVersion: version, ...league } = json as LeagueData & {
      documentVersion: number;
    };
    documentVersionRef.current = version;
    setDocumentVersion(version);
    setData(league);
  }, []);

  const loadArchives = useCallback(async () => {
    const res = await fetch("/api/admin/archives");
    if (!res.ok) return;
    const json = await res.json();
    setArchives(json.archives as SeasonArchive[]);
    setArchiveVersions((json.versions as Record<string, number>) ?? {});
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authenticated) {
      loadData();
      loadArchives();
    }
  }, [authenticated, loadData, loadArchives]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      if (href === "/admin" || href.startsWith("/admin?")) return;
      event.preventDefault();
      event.stopPropagation();
      requestAction(() => {
        window.location.href = href;
      });
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [isDirty, requestAction]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const body = authMode === "supabase" ? { email, password } : { password };
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setAuthenticated(true);
      setEmail("");
      setPassword("");
    } else {
      const json = await res.json();
      setLoginError(json.error || "ログインに失敗しました");
    }
  }

  async function performLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    setAuthenticated(false);
    setData(null);
    setEditorState(null);
  }

  async function apiPutArchive(type: string, payload?: unknown): Promise<boolean> {
    setSaving(true);
    setMessage("");
    let expectedVersion: number | undefined;
    if (type === "archive") {
      const season = (payload as SeasonArchive).season;
      expectedVersion = archiveVersions[season] ?? 0;
    } else if (type === "archiveSnapshot") {
      const season = (payload as { season: string }).season;
      expectedVersion = archiveVersions[season] ?? 0;
    }
    const res = await fetch("/api/admin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload, expectedVersion }),
    });
    const json = await res.json();
    if (res.ok) {
      setMessage("保存しました");
      await loadArchives();
    } else {
      setMessage(json.error || "保存に失敗しました");
      if (res.status === 409) {
        await loadArchives();
      }
    }
    setSaving(false);
    return res.ok;
  }

  async function apiPut(
    type: string,
    payload?: unknown,
    roundId?: string,
    options?: ApiPutOptions
  ): Promise<boolean> {
    const reload = options?.reload !== false;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        payload,
        roundId,
        // React state は連続 await のあいだ更新されないため ref を使う
        expectedVersion: documentVersionRef.current,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      if (typeof json.documentVersion === "number") {
        documentVersionRef.current = json.documentVersion;
        setDocumentVersion(json.documentVersion);
      }
      if (reload) {
        setMessage("保存しました");
        await loadData();
      }
    } else {
      setMessage(json.error || "保存に失敗しました");
      if (res.status === 409) {
        // 他者更新: 最新を読み込み、ローカル編集は破棄（エディタが props で同期）
        await loadData();
      }
    }
    setSaving(false);
    return res.ok;
  }

  function handleTabChange(nextTab: Tab) {
    if (nextTab === tab) return;
    requestAction(() => setTab(nextTab));
  }

  if (authenticated === null) {
    return <div className="max-w-md mx-auto px-4 py-20 text-center text-gray-500">読み込み中...</div>;
  }

  if (!authenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="card">
          <h1 className="text-xl font-bold text-primary-dark mb-2">管理画面ログイン</h1>
          <p className="text-sm text-gray-500 mb-6">
            {authMode === "local" ? "パスワードを入力してください" : "管理者アカウントでログイン"}
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            {authMode === "supabase" && (
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="メールアドレス" className="input-field" required />
            )}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="パスワード" className="input-field" required />
            {loginError && <p className="text-sm text-red-500">{loginError}</p>}
            <button type="submit" className="btn-primary w-full">ログイン</button>
          </form>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-gray-500">データを読み込み中...</div>;
  }

  const tabs: [Tab, string][] = [
    ["teams", "チーム"],
    ["schedule", "組み合わせ"],
    ["awards", "エントリー"],
    ["results", "試合結果"],
    ["news", "ニュース"],
    ["archives", "アーカイブ"],
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col max-h-[calc(100dvh-5.5rem)]">
      {dialog}
      {message && <AdminToast message={message} onDismiss={() => setMessage("")} />}
      <div className="shrink-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-primary-dark">管理画面</h1>
              {isDirty && (
                <span className="text-xs font-medium text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                  未保存
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{data.season}シーズン · ローカル編集モード</p>
          </div>
          <button
            onClick={() => requestAction(performLogout)}
            className="btn-secondary text-sm shrink-0 self-start sm:self-auto"
          >
            ログアウト
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? "bg-primary text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
              {tab === key && isDirty && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-amber-300" title="未保存" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain">
      {tab === "news" && (
        <NewsEditor
          news={data.news}
          onSave={(n) => apiPut("news", n)}
          saving={saving}
          onEditorStateChange={setEditorState}
        />
      )}
      {tab === "teams" && (
        <TeamsEditor
          teams={data.teams}
          onSave={(t) => apiPut("teams", t)}
          saving={saving}
          onEditorStateChange={setEditorState}
        />
      )}
      {tab === "schedule" && (
        <ScheduleEditor
          data={data}
          onSaveRounds={(r) => apiPut("rounds", r, undefined, { reload: false })}
          onSaveAssignments={(a) =>
            apiPut("roundAssignments", a, undefined, { reload: false })
          }
          onGenerate={(roundId, scope = "primary") =>
            apiPut("generateSchedule", { scope }, roundId)
          }
          onSaveMatchOrder={async ({ primary, additional }) => {
            const primaryRoundIds = new Set(primary.map((m) => m.roundId));
            const additionalRoundIds = new Set(additional.map((m) => m.roundId));
            const keep = data.matches.filter((m) => {
              if (PRIMARY_MATCH_GROUPS.includes(m.group) && primaryRoundIds.has(m.roundId)) {
                return false;
              }
              if (ADDITIONAL_MATCH_GROUPS.includes(m.group) && additionalRoundIds.has(m.roundId)) {
                return false;
              }
              return true;
            });
            return apiPut("matches", [...keep, ...primary, ...additional], undefined, {
              reload: false,
            });
          }}
          onDeleteRound={(roundId) => apiPut("deleteRound", undefined, roundId)}
          onPersistComplete={async () => {
            setMessage("保存しました");
            await loadData();
          }}
          saving={saving}
          onEditorStateChange={setEditorState}
        />
      )}
      {tab === "results" && (
        <ResultsEditor
          key="results-editor"
          data={data}
          onSave={(m) => apiPut("matches", m, undefined, { reload: false })}
          onSaveRounds={(r) => apiPut("rounds", r, undefined, { reload: false })}
          onFinishRound={(roundId) => apiPut("finishRound", undefined, roundId)}
          onPersistComplete={async () => {
            setMessage("保存しました");
            await loadData();
          }}
          saving={saving}
          onEditorStateChange={setEditorState}
        />
      )}
      {tab === "awards" && (
        <PlayerAwardsEditor
          key="awards-editor"
          data={data}
          onSave={(a) => apiPut("playerAwards", a)}
          saving={saving}
          onEditorStateChange={setEditorState}
        />
      )}
      {tab === "archives" && (
        <ArchivesEditor
          archives={archives}
          currentSeason={data.season}
          onSave={(archive) => apiPutArchive("archive", archive)}
          onDelete={(season) => apiPutArchive("deleteArchive", { season })}
          onSnapshot={(opts) => apiPutArchive("archiveSnapshot", opts)}
          saving={saving}
          onEditorStateChange={setEditorState}
        />
      )}
      </div>
    </div>
  );
}
