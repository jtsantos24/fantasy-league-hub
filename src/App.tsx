import React, { useEffect, useMemo, useState, useCallback } from "react";

/**
 * Fantasy League – Minimal Single-File React (TypeScript)
 * -------------------------------------------------------
 * Copy into: src/App.tsx
 * Needs: Tailwind in your Vite/Next/Vercel setup (no extra imports here).
 *
 * Quick Setup:
 * 1) Update LEAGUE_ID and optional PRIOR_LEAGUE_IDS.
 * 2) Adjust important dates (local time).
 * 3) Deploy to Vercel. If Sleeper API is blocked by CORS locally, the UI falls back to demo data.
 */

// === Configuration ===
const LEAGUE_ID = "1180316624798797824";
const PRIOR_LEAGUE_IDS: string[] = ["996112028718841856", "1053587508728012800"]; // used lightly in Records

// Key dates (month is 0-based: 7 = August)
const DRAFT_DAY = new Date(2025, 7, 25, 18, 0, 0);
const TRADE_DEADLINE = new Date(2025, 10, 30, 23, 59, 0);
const PLAYOFFS_START = new Date(2025, 11, 13, 0, 0, 0);

// Optional manual division mapping (by Sleeper display_name)
const MANUAL_DIVISIONS: Record<string, "NFC" | "AFC"> = {
  Smittytribe27: "AFC",
  Savro24: "AFC",
  twillie391: "NFC",
  AlanCarignan: "NFC",
  cincy_kid: "NFC",
  PAHTNAH: "NFC",
  KShrewsberry: "NFC",
  BillsMafia1480: "NFC",
  JeffPeterson20: "AFC",
  BReyes: "AFC",
  CamWells16: "AFC",
  brandishrewsberry: "AFC",
};

// === Types ===
type SleeperUser = { user_id: string; display_name: string; avatar?: string };
type SleeperRoster = {
  roster_id: number;
  owner_id?: string;
  settings?: { wins?: number; losses?: number; fpts?: number; fpts_against?: number };
};
type SleeperMatchup = { roster_id: number; matchup_id?: number; points?: number };
type FetchState<T> = { data: T | null; loading: boolean; error: string | null };
type PowerScore = {
  team: string;
  score: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  avgPerWeek: number;
  division: "NFC" | "AFC";
};

// === Utilities ===
const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const shortDate = (d: Date) => d.toLocaleString(undefined, { month: "short", day: "numeric" });
const timeLeft = (target: Date) => {
  const now = new Date().getTime();
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, mins };
};
async function safeJson<T = any>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status}`);
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

// === Demo fallback (used if CORS blocks API) ===
const demoUsers: SleeperUser[] = Array.from({ length: 12 }, (_, i) => ({
  user_id: `u${i + 1}`,
  display_name: [
    "Obi",
    "Ram",
    "Prestige",
    "Be",
    "Papa",
    "Lickety",
    "Sneak",
    "Boom",
    "Huck",
    "White",
    "You",
    "Many",
  ][i],
}));
const demoRosters: SleeperRoster[] = Array.from({ length: 12 }, (_, i) => ({
  roster_id: i + 1,
  owner_id: demoUsers[i].user_id,
  settings: {
    wins: Math.floor(Math.random() * 8),
    losses: Math.floor(Math.random() * 8),
    fpts: 900 + Math.random() * 300,
    fpts_against: 900 + Math.random() * 300,
  },
}));
const demoDivisionMap: Record<string, "NFC" | "AFC"> = {
  Obi: "NFC",
  Ram: "NFC",
  Prestige: "NFC",
  Be: "NFC",
  Papa: "NFC",
  Lickety: "NFC",
  Sneak: "AFC",
  Boom: "AFC",
  Huck: "AFC",
  White: "AFC",
  You: "AFC",
  Many: "AFC",
};

// === Hooks ===
function useSleeperLeague(leagueId: string) {
  const [users, setUsers] = useState<FetchState<SleeperUser[]>>({
    data: null,
    loading: true,
    error: null,
  });
  const [rosters, setRosters] = useState<FetchState<SleeperRoster[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!users.data) setUsers((p) => ({ ...p, loading: true, error: null }));
    if (!rosters.data) setRosters((p) => ({ ...p, loading: true, error: null }));

    const u = await safeJson<SleeperUser[]>(`https://api.sleeper.app/v1/league/${leagueId}/users`);
    const r = await safeJson<SleeperRoster[]>(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);

    if (u && Array.isArray(u)) setUsers({ data: u, loading: false, error: null });
    else
      setUsers((p) => ({
        ...p,
        data: p.data || demoUsers,
        loading: false,
        error: "Using demo users (network blocked or API failed)",
      }));

    if (r && Array.isArray(r)) setRosters({ data: r, loading: false, error: null });
    else
      setRosters((p) => ({
        ...p,
        data: p.data || demoRosters,
        loading: false,
        error: "Using demo rosters (network blocked or API failed)",
      }));
  }, [leagueId, users.data, rosters.data]);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 300000); // 5 min
    return () => clearInterval(t);
  }, [fetchData]);

  return { users, rosters };
}

function useNFLState() {
  const [week, setWeek] = useState<number | null>(null);

  const pull = useCallback(async () => {
    const state = await safeJson<{ week?: number; display_week?: number }>(
      `https://api.sleeper.app/v1/state/nfl`
    );
    const w = Number(state?.week || state?.display_week || 0);
    setWeek(w > 0 ? w : null);
  }, []);

  useEffect(() => {
    pull();
    const t = setInterval(pull, 300000);
    return () => clearInterval(t);
  }, [pull]);

  return week;
}

function useThisSeasonMatchups(leagueId: string, weekCap: number | null) {
  // Keep it lean: only current league, weeks up to (weekCap - 1)
  const [rows, setRows] = useState<SleeperMatchup[][]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const maxW = Math.max(1, Math.min(18, (weekCap ?? 1) - 1));
        const weeks = Array.from({ length: maxW }, (_, i) => i + 1);
        const all: SleeperMatchup[][] = [];
        for (const w of weeks) {
          const m = await safeJson<SleeperMatchup[]>(
            `https://api.sleeper.app/v1/league/${leagueId}/matchups/${w}`
          );
          all.push(Array.isArray(m) ? m : []);
        }
        if (mounted) setRows(all);
      } catch {
        if (mounted) {
          setErr("Could not load weekly matchups (network/CORS).");
          setRows([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [leagueId, weekCap]);

  return { weeks: rows, loading, error: err };
}

// === Derived data ===
function usePowerScores(users: SleeperUser[] | null, rosters: SleeperRoster[] | null) {
  return useMemo<PowerScore[]>(() => {
    if (!users || !rosters) return [];
    const byOwner: Record<string, SleeperRoster> = {};
    rosters.forEach((r) => {
      if (r.owner_id) byOwner[r.owner_id] = r;
    });

    const maxPF = Math.max(
      1,
      ...rosters.map((r) => (r.settings?.fpts ?? 0))
    );

    return users
      .map((u) => {
        const r = byOwner[u.user_id];
        const wins = r?.settings?.wins ?? 0;
        const losses = r?.settings?.losses ?? 0;
        const games = Math.max(1, wins + losses);
        const pointsFor = r?.settings?.fpts ?? 0;
        const pointsAgainst = r?.settings?.fpts_against ?? 0;

        const pfPct = (pointsFor / maxPF) * 100; // 0..100
        const winPct = games > 0 ? (wins / games) * 100 : 50;
        const score = 0.7 * pfPct + 0.3 * winPct;
        const avgPerWeek = pointsFor / games;

        const manual = MANUAL_DIVISIONS[u.display_name];
        const fallback = demoDivisionMap[u.display_name] as "NFC" | "AFC" | undefined;
        const division: "NFC" | "AFC" = manual ?? fallback ?? (Math.random() > 0.5 ? "NFC" : "AFC");

        return { team: u.display_name, score, wins, losses, pointsFor, pointsAgainst, avgPerWeek, division };
      })
      .sort((a, b) => b.score - a.score);
  }, [users, rosters]);
}

// === UI atoms ===
const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <div className={`rounded-2xl border border-slate-200 bg-white/90 shadow-sm ${className ?? ""}`}>{children}</div>
);
const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-3">
    <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

// === Views (simple & modern) ===
const HomeView: React.FC<{ scores: PowerScore[] }> = ({ scores }) => {
  const top5 = scores.slice(0, 5);
  const draftLeft = timeLeft(DRAFT_DAY);
  const tradeLeft = timeLeft(TRADE_DEADLINE);
  const playoffsLeft = timeLeft(PLAYOFFS_START);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">League Hub</h1>
            <p className="text-slate-600 text-sm">
              Sleeper League ID: <span className="font-semibold">{LEAGUE_ID}</span>
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <CountdownPill label="Draft Day" date={DRAFT_DAY} left={draftLeft} />
            <CountdownPill label="Trade Deadline" date={TRADE_DEADLINE} left={tradeLeft} />
            <CountdownPill label="Playoffs" date={PLAYOFFS_START} left={playoffsLeft} />
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2">
          <SectionTitle title="Power Rankings" subtitle="Weighted mix of PF percentile and win%" />
          <ol className="divide-y">
            {top5.map((t, i) => (
              <li key={t.team} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold grid place-items-center">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{t.team}</div>
                    <div className="text-xs text-slate-500">
                      {t.division} • {t.wins}-{t.losses} • PF {fmt.format(t.pointsFor)}
                    </div>
                  </div>
                </div>
                <div className="text-lg font-extrabold text-slate-900">{fmt.format(t.score)}</div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-6">
          <SectionTitle title="Latest NFL News" subtitle="Open in a new tab" />
          <ul className="space-y-3">
            <NewsLink href="https://www.espn.com/nfl/" label="ESPN NFL Headlines" />
            <NewsLink href="https://www.rotowire.com/football/news.php" label="RotoWire NFL News" />
            <li className="text-xs text-slate-500">
              For auto-feeds, add a tiny serverless function to fetch RSS/HTML → JSON (avoid CORS issues).
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

const StandingsView: React.FC<{ scores: PowerScore[] }> = ({ scores }) => {
  const [sortKey, setSortKey] = useState<"team" | "record" | "pf" | "pa" | "avg">("record");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const rec = (x: PowerScore) => x.wins - x.losses;
  const compare = (a: PowerScore, b: PowerScore) => {
    if (sortKey === "team") return a.team.localeCompare(b.team);
    if (sortKey === "record") return rec(a) - rec(b);
    if (sortKey === "pf") return (a.pointsFor ?? 0) - (b.pointsFor ?? 0);
    if (sortKey === "pa") return (a.pointsAgainst ?? 0) - (b.pointsAgainst ?? 0);
    if (sortKey === "avg") return (a.avgPerWeek ?? 0) - (b.avgPerWeek ?? 0);
    return 0;
  };

  const sorted = [...scores].sort(compare);
  if (dir === "desc") sorted.reverse();

  const byDiv = {
    NFC: sorted.filter((s) => s.division === "NFC"),
    AFC: sorted.filter((s) => s.division === "AFC"),
  } as const;

  const clickSort = (k: typeof sortKey) => {
    if (k === sortKey) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setDir(k === "team" ? "asc" : "desc");
    }
  };

  const renderRows = (arr: PowerScore[]) =>
    arr.map((t, i) => (
      <tr key={t.team} className="border-b last:border-0">
        <td className="py-2 pr-2 font-semibold">{i + 1}</td>
        <td className="py-2 pr-2">{t.team}</td>
        <td className="py-2 pr-2">{t.division}</td>
        <td className="py-2 pr-2">
          {t.wins}-{t.losses}
        </td>
        <td className="py-2 pr-2">{fmt.format(t.pointsFor)}</td>
        <td className="py-2 pr-2">{fmt.format(t.pointsAgainst)}</td>
        <td className="py-2 pr-2">{fmt.format(t.avgPerWeek)}</td>
      </tr>
    ));

  const HeaderBtn: React.FC<{ k: typeof sortKey; label: string }> = ({ k, label }) => (
    <th
      className="py-2 pr-2 cursor-pointer select-none"
      onClick={() => clickSort(k)}
      title="Sort"
    >
      {label}
      {sortKey === k ? (dir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionTitle title="Standings" subtitle="Grouped by division • Click headers to sort" />
      </Card>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-2">#</th>
                <HeaderBtn k="team" label="Team" />
                <th className="py-2 pr-2">Div</th>
                <HeaderBtn k="record" label="W–L" />
                <HeaderBtn k="pf" label="PF" />
                <HeaderBtn k="pa" label="PA" />
                <HeaderBtn k="avg" label="Avg/Wk" />
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-50">
                <td colSpan={7} className="py-2 px-2 text-xs font-bold text-slate-700">
                  NFC
                </td>
              </tr>
              {renderRows(byDiv.NFC)}
              <tr className="bg-slate-50">
                <td colSpan={7} className="py-2 px-2 text-xs font-bold text-slate-700">
                  AFC
                </td>
              </tr>
              {renderRows(byDiv.AFC)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const RecordsView: React.FC<{
  users: SleeperUser[] | null;
  rosters: SleeperRoster[] | null;
  matchups: SleeperMatchup[][];
}> = ({ users, rosters, matchups }) => {
  // Simple, this-season records pulled from available matchups:
  const highestGames = useMemo(() => {
    type GameRow = { total: number; a: string; b: string; wk: number };
    if (!users || !rosters || matchups.length === 0) return [] as GameRow[];

    const rosterById = new Map(rosters.map((r) => [r.roster_id, r]));
    const userById = new Map(users.map((u) => [u.user_id, u.display_name]));

    const rows: GameRow[] = [];
    matchups.forEach((weekArr, wIndex) => {
      const byMid = new Map<number, SleeperMatchup[]>();
      weekArr.forEach((m) => {
        const mid = m.matchup_id ?? 0;
        byMid.set(mid, [...(byMid.get(mid) || []), m]);
      });
      byMid.forEach((arr) => {
        if (arr.length >= 2) {
          const [A, B] = arr.slice(0, 2);
          const rA = rosterById.get(A.roster_id);
          const rB = rosterById.get(B.roster_id);
          const aName = rA?.owner_id ? userById.get(rA.owner_id) || `Roster ${A.roster_id}` : `Roster ${A.roster_id}`;
          const bName = rB?.owner_id ? userById.get(rB.owner_id) || `Roster ${B.roster_id}` : `Roster ${B.roster_id}`;
          rows.push({ total: Number(A.points ?? 0) + Number(B.points ?? 0), a: aName, b: bName, wk: wIndex + 1 });
        }
      });
    });

    return rows.sort((x, y) => y.total - x.total).slice(0, 5);
  }, [users, rosters, matchups]);

  const seasonPFLeaders = useMemo(() => {
    if (!users || !rosters) return [] as { team: string; pf: number }[];
    const byOwner: Record<string, number> = {};
    rosters.forEach((r) => {
      if (r.owner_id) byOwner[r.owner_id] = r.settings?.fpts ?? 0;
    });
    return users
      .map((u) => ({ team: u.display_name, pf: byOwner[u.user_id] ?? 0 }))
      .sort((a, b) => b.pf - a.pf)
      .slice(0, 5);
  }, [users, rosters]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionTitle title="Records (This Season)" subtitle="Lightweight view from current matchups & standings" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MiniList
            title="Highest Combined Games"
            items={highestGames}
            render={(g, i) => (
              <RowItem
                key={i}
                rank={i + 1}
                left={`${g.a} vs ${g.b}`}
                right={fmt.format(g.total)}
                sub={`Week ${g.wk}`}
              />
            )}
          />
          <MiniList
            title="Season PF Leaders"
            items={seasonPFLeaders}
            render={(x, i) => (
              <RowItem key={i} rank={i + 1} left={x.team} right={fmt.format(x.pf)} sub="Total PF" />
            )}
          />
          <MiniList
            title="Most Points Allowed"
            items={(rosters || [])
              .map((r) => {
                const owner = users?.find((u) => u.user_id === r.owner_id)?.display_name || `Roster ${r.roster_id}`;
                return { team: owner, pa: r.settings?.fpts_against ?? 0 };
              })
              .sort((a, b) => b.pa - a.pa)
              .slice(0, 5)}
            render={(x, i) => (
              <RowItem key={i} rank={i + 1} left={x.team} right={fmt.format(x.pa)} sub="Total PA" />
            )}
          />
        </div>
      </Card>
    </div>
  );
};

const PlayoffsView: React.FC<{ scores: PowerScore[] }> = ({ scores }) => {
  const cmp = (a: PowerScore, b: PowerScore) => {
    const rec = (x: PowerScore) => x.wins - x.losses;
    const d = rec(b) - rec(a);
    return d !== 0 ? d : b.pointsFor - a.pointsFor;
  };
  const seed = (div: "NFC" | "AFC") => scores.filter((s) => s.division === div).sort(cmp).slice(0, 3);

  const n = seed("NFC");
  const a = seed("AFC");

  const Slot: React.FC<{ title: string; team?: PowerScore }> = ({ title, team }) => (
    <div className="p-3 rounded-xl border bg-white/90 min-h-[64px]">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="font-semibold">{team ? `${team.team} (${team.wins}-${team.losses})` : "TBD"}</div>
      {team && <div className="text-xs text-slate-500">PF {fmt.format(team.pointsFor)}</div>}
    </div>
  );

  const Column: React.FC<{ title: string; list: PowerScore[] }> = ({ title, list }) => (
    <Card className="p-4">
      <SectionTitle title={title} subtitle="Top 3: #1 bye, #2 vs #3" />
      <div className="grid gap-3">
        <div>
          <div className="text-sm font-semibold mb-2">Wildcard</div>
          <div className="grid md:grid-cols-2 gap-3">
            <Slot title="#2 Seed" team={list[1]} />
            <Slot title="#3 Seed" team={list[2]} />
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Conference Final</div>
          <div className="grid md:grid-cols-2 gap-3">
            <Slot title="#1 Seed (Bye)" team={list[0]} />
            <Slot title="Wildcard Winner" />
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Column title="NFC Bracket" list={n} />
        <Column title="AFC Bracket" list={a} />
      </div>
      <Card className="p-4">
        <SectionTitle title="League Championship" subtitle="NFC Champion vs AFC Champion" />
        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border bg-white/90 min-h-[64px]">
            <div className="text-xs text-slate-500">NFC Champion</div>
            <div className="font-semibold">TBD</div>
          </div>
          <div className="p-3 rounded-xl border bg-white/90 min-h-[64px]">
            <div className="text-xs text-slate-500">AFC Champion</div>
            <div className="font-semibold">TBD</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

const LeagueInfoView: React.FC = () => {
  const draftLeft = timeLeft(DRAFT_DAY);
  const tradeLeft = timeLeft(TRADE_DEADLINE);
  const playoffsLeft = timeLeft(PLAYOFFS_START);
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="p-6">
        <SectionTitle title="Draft Day" />
        <CountdownBlock date={DRAFT_DAY} left={draftLeft} />
      </Card>
      <Card className="p-6">
        <SectionTitle title="Trade Deadline" />
        <CountdownBlock date={TRADE_DEADLINE} left={tradeLeft} />
      </Card>
      <Card className="p-6">
        <SectionTitle title="Playoffs Begin" />
        <CountdownBlock date={PLAYOFFS_START} left={playoffsLeft} />
      </Card>

      <Card className="p-6 md:col-span-3">
        <SectionTitle title="League Notes" subtitle="Short, practical, zero-clutter." />
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
          <li>Customize divisions via <code>MANUAL_DIVISIONS</code> at the top.</li>
          <li>Want auto news? Add a serverless function to fetch & cache feeds (avoids CORS, faster).</li>
          <li>Add more tabs or widgets later; this scaffold stays fast and readable.</li>
        </ul>
      </Card>
    </div>
  );
};

// === Small pieces ===
const NewsLink: React.FC<{ href: string; label: string }> = ({ href, label }) => (
  <li>
    <a
      className="block px-3 py-2 rounded-lg border hover:border-slate-400 hover:bg-slate-50 transition"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      <div className="font-semibold text-slate-800">{label}</div>
      <div className="text-xs text-slate-500">Opens in new tab</div>
    </a>
  </li>
);
const CountdownPill: React.FC<{ label: string; date: Date; left: { days: number; hours: number } }> = ({
  label,
  date,
  left,
}) => (
  <div className="px-4 py-2 rounded-xl bg-slate-50 border text-left">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="font-bold">{shortDate(date)}</div>
    <div className="text-xs">{left.days}d {left.hours}h</div>
  </div>
);
const CountdownBlock: React.FC<{ date: Date; left: { days: number; hours: number; mins: number } }> = ({
  date,
  left,
}) => (
  <div>
    <div className="text-slate-700">{date.toLocaleString()}</div>
    <div className="mt-2 text-3xl font-black tracking-tight">
      {left.days}d {left.hours}h {left.mins}m
    </div>
    <div className="text-xs text-slate-500 mt-1">(updates on refresh)</div>
  </div>
);
const MiniList: React.FC<{
  title: string;
  items: any[];
  render: (x: any, i: number) => React.ReactNode;
}> = ({ title, items, render }) => (
  <div className="p-4 rounded-xl bg-slate-50 border h-full flex flex-col">
    <h3 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2 border-slate-200">{title}</h3>
    <ol className="text-sm space-y-3 flex-grow">{items.length ? items.map(render) : <li className="text-slate-500">No data yet.</li>}</ol>
  </div>
);
const RowItem: React.FC<{ rank: number; left: string; right: string; sub?: string }> = ({
  rank,
  left,
  right,
  sub,
}) => (
  <li className="flex items-start justify-between">
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold grid place-items-center text-xs">
        {rank}
      </div>
      <div className="leading-snug">
        <div className="font-semibold text-slate-800">{left}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
    <div className="font-extrabold text-lg ml-2">{right}</div>
  </li>
);

// === Shell ===
const TABS = [
  { key: "home", label: "Home" },
  { key: "standings", label: "Standings" },
  { key: "records", label: "Records" },
  { key: "playoffs", label: "Playoffs" },
  { key: "info", label: "League Info" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function App() {
  const [tab, setTab] = useState<TabKey>("home");

  const { users, rosters } = useSleeperLeague(LEAGUE_ID);
  const nflWeek = useNFLState();
  const scores = usePowerScores(users.data, rosters.data);
  const { weeks: matchups, error: matchErr } = useThisSeasonMatchups(LEAGUE_ID, nflWeek);

  const anyWarn = users.error || rosters.error || matchErr;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center font-black">FF</div>
            <div>
              <div className="text-lg font-extrabold tracking-tight">NUT & Friends League</div>
              <div className="text-xs text-slate-500">Powered by Sleeper</div>
            </div>
          </div>

          <nav className="hidden md:flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  tab === t.key ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          <div className="md:hidden">
            <select
              value={tab}
              onChange={(e) => setTab(e.target.value as TabKey)}
              className="px-3 py-2 rounded-xl border bg-white"
            >
              {TABS.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {anyWarn && (
          <Card className="p-4 border-amber-300 bg-amber-50">
            <div className="text-sm text-amber-800">
              <strong>Heads up:</strong> {users.error || rosters.error || matchErr}. When deployed, live data should
              load automatically.
            </div>
          </Card>
        )}

        {tab === "home" && <HomeView scores={scores} />}
        {tab === "standings" && <StandingsView scores={scores} />}
        {tab === "records" && (
          <RecordsView users={users.data} rosters={rosters.data} matchups={matchups} />
        )}
        {tab === "playoffs" && <PlayoffsView scores={scores} />}
        {tab === "info" && <LeagueInfoView />}
      </main>

      <footer className="max-w-6xl mx-auto p-6 text-xs text-slate-500">
        Built with ❤️ • Customize divisions in <code>MANUAL_DIVISIONS</code>.
      </footer>
    </div>
  );
}

