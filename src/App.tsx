import React, { useEffect, useMemo, useState, useCallback } from "react";

// --- Fantasy Football League Site (Single-file React) ---
// Tailwind is available by default in this canvas. No extra imports required.

/*******************************************
 * QUICK START
 * 1) Set your Sleeper LEAGUE_ID below.
 * 2) Optional: set DRAFT_DAY, TRADE_DEADLINE, PLAYOFFS_START.
 * 3) Press "Run". If network/CORS is blocked, the app falls back to demo data automatically.
 *******************************************/
const LEAGUE_ID = "1180316624798797824"; // <- replace if needed
// Prior seasons to include in Records (oldest → newest)
const PRIOR_LEAGUE_IDS = ["996112028718841856", "1053587508728012800"];

// Key league dates (local time)
const DRAFT_DAY = new Date(2025, 7, 25, 18, 0, 0); // Aug 25, 2025 6:00 PM (example)
const TRADE_DEADLINE = new Date(2025, 10, 30, 23, 59, 0); // Nov 30, 2025 11:59 PM
const PLAYOFFS_START = new Date(2025, 11, 13, 0, 0, 0); // Dec 13, 2025 (example)

// Simple password for front-end news posting gate (NOT SECURE!)
const ADMIN_PASSWORD = "commissioner-nut";

// Optional manual overrides (use team display_name -> 'NFC' | 'AFC')
const MANUAL_DIVISIONS: Record<string, 'NFC' | 'AFC'> = {
  'Smittytribe27': 'AFC',
  'Savro24': 'AFC',
  'twillie391': 'NFC',
  'AlanCarignan': 'NFC',
  'cincy_kid': 'NFC',
  'PAHTNAH': 'NFC',
  'KShrewsberry': 'NFC',
  'BillsMafia1480': 'NFC',
  'JeffPeterson20': 'AFC',
  'BReyes': 'AFC',
  'CamWells16': 'AFC',
  'brandishrewsberry': 'AFC',
};

// --- League Rivalries (Team Display Names) ---
// Structure: [TeamA, TeamB, Custom_Title (Optional)]
const RIVALRIES: [string, string, string?][] = [
    ['PAHTNAH', 'JeffPeterson20', 'The Twin Classic'],
    ['KShrewsberry', 'brandishrewsberry', 'The Honey-Do List Classic 📝'],
    ['BillsMafia1480', 'Smittytribe27', 'The Let’s Make a Trade Classic'],
    ['AlanCarignan', 'CamWells16', 'The Clash of Squads'],
    ['cincy_kid', 'Savro24', 'The Prestige–Rats Classic'],
    ['twillie391', 'BReyes', 'The Split Second Bowl'],
];

// --- Manual Champion Overrides (Year -> Team Display Name) ---
const MANUAL_CHAMPIONS: Record<string, string> = {
    "2023": "JeffPeterson20",
    "2024": "twillie391",
};

// --- Manual Champion Scores (Year -> Champion's Score String) ---
const MANUAL_CHAMPION_SCORES: Record<string, string> = {
    "2023": "205.38",
    "2024": "214.03",
};

// --- Utility helpers ---
const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const shortDate = (d: Date) => d.toLocaleString(undefined, { month: "short", day: "numeric" });
const timeLeft = (target: Date) => {
  const now = new Date();
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return { days, hours, mins };
};

// --- Minimal data types ---
type SleeperUser = { user_id: string; display_name: string; avatar?: string };
type SleeperRoster = { roster_id: number; owner_id?: string; settings?: { wins?: number; losses?: number; fpts?: number; fpts_against?: number }; metadata?: any };
type SleeperMatchup = { roster_id: number; matchup_id?: number; points?: number; starters_points?: number[] };
type SleeperTransaction = {
  type?: string; // 'waiver' | 'trade' | 'free_agent' | ...
  status?: string; // 'complete' etc
  status_updated?: number; // epoch ms
  adds?: Record<string, number>; // player_id -> roster_id
  drops?: Record<string, number>;
  roster_ids?: number[]; // trade participants
};
type NewsItem = { id: number; content: string; date: number; isArchived: boolean };

type PowerScore = { team: string; score: number; wins: number; losses: number; pointsFor: number; pointsAgainst: number; avgPerWeek: number; division: 'NFC' | 'AFC' };
type FetchState<T> = { data: T | null; loading: boolean; error: string | null };
type LeagueContext = {
  leagueId: string;
  season: string | number | null;
  users: SleeperUser[];
  rosters: SleeperRoster[];
};
type WeekEntry = { team: string; roster_id: number; week: number; pts: number; season: string | number | null };
type GameEntry = { week: number; teamA: string; teamB: string; ptsA: number; ptsB: number; margin: number; total: number; season: string | number | null };

type PastRecord = {
    season: string | number;
    team: string;
    record: string; // Score or W-L format
};

// --- Demo fallback ---
const demoUsers: SleeperUser[] = [
  { user_id: "u1", display_name: "Obi" },
  { user_id: "u2", display_name: "Ram" },
  { user_id: "u3", display_name: "Prestige" },
  { user_id: "u4", display_name: "Be" },
  { user_id: "u5", display_name: "Papa" },
  { user_id: "u6", display_name: "Lickety" },
  { user_id: "u7", display_name: "Sneak" },
  { user_id: "u8", display_name: "Boom" },
  { user_id: "u9", display_name: "Huck" },
  { user_id: "u10", display_name: "White" },
  { user_id: "u11", display_name: "You" },
  { user_id: "u12", display_name: "Many" },
];
const demoRosters: SleeperRoster[] = Array.from({ length: 12 }, (_, i) => ({
  roster_id: i + 1,
  owner_id: demoUsers[i].user_id,
  settings: { wins: Math.floor(Math.random() * 8), losses: Math.floor(Math.random() * 8), fpts: 900 + Math.random() * 300, fpts_against: 900 + Math.random() * 300 },
}));
const demoDivisionMap: Record<string, 'NFC' | 'AFC'> = {
  Obi: 'NFC', Ram: 'NFC', Prestige: 'NFC', Be: 'NFC', Papa: 'NFC', Lickety: 'NFC',
  Sneak: 'AFC', Boom: 'AFC', Huck: 'AFC', White: 'AFC', You: 'AFC', Many: 'AFC',
};

// --- Fetcher ---
async function safeJson(url: string) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status}`);
    return await r.json();
  } catch (e) {
    console.error("Fetch error for:", url, e);
    return null;
  }
}

/**
 * Fetches current users and rosters and sets up a 5-minute interval for auto-sync.
 */
function useSleeperLeague(leagueId: string) {
  const [users, setUsers] = useState<FetchState<SleeperUser[]>>({ data: null, loading: true, error: null });
  const [rosters, setRosters] = useState<FetchState<SleeperRoster[]>>({ data: null, loading: true, error: null });

  // Function to perform the actual fetch
  const fetchData = useCallback(async () => {
    // Only set loading state if data is NOT yet present to prevent UI flash on refresh
    if (!users.data) setUsers(p => ({ ...p, loading: true, error: null }));
    if (!rosters.data) setRosters(p => ({ ...p, loading: true, error: null }));

    const u = await safeJson(`https://api.sleeper.app/v1/league/${leagueId}/users`);
    const r = await safeJson(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);

    if (u && Array.isArray(u)) setUsers({ data: u, loading: false, error: null });
    else setUsers(p => ({ ...p, data: p.data || demoUsers, loading: false, error: "Using demo users (network blocked or API failed)" }));

    if (r && Array.isArray(r)) setRosters({ data: r, loading: false, error: null });
    else setRosters(p => ({ ...p, data: p.data || demoRosters, loading: false, error: "Using demo rosters (network blocked or API failed)" }));
  }, [leagueId, users.data, rosters.data]);

  useEffect(() => {
    fetchData(); // Initial fetch on component mount

    // Setup interval for auto-sync (every 5 minutes = 300000 ms)
    const interval = setInterval(fetchData, 300000); 

    return () => clearInterval(interval); // Cleanup on unmount
  }, [fetchData]);

  return { users, rosters };
}

/**
 * Fetches the current NFL Week from the Sleeper state endpoint and auto-syncs every 5 minutes.
 */
function useNFLState() {
  const [nflWeek, setNflWeek] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const state = await safeJson(`https://api.sleeper.app/v1/state/nfl`);
    const week = Number(state?.week || state?.display_week || 0);
    setNflWeek(week > 0 ? week : null);
  }, []);

  useEffect(() => {
    fetchData(); // Initial fetch

    // Setup interval for auto-sync (every 5 minutes = 300000 ms)
    const interval = setInterval(fetchData, 300000);

    return () => clearInterval(interval); // Cleanup on unmount
  }, [fetchData]);

  return nflWeek;
}

/**
 * Fetches all historical data (contexts, weeksData) and calculates derived records.
 * This runs only once on mount as historical data does not change frequently.
 */
function useHistoricalLeagueData() {
    const [status, setStatus] = useState<'idle' | 'fetching_contexts' | 'fetching_matchups' | 'done'>('fetching_contexts');
    const [error, setError] = useState<string | null>(null);
    const [contexts, setContexts] = useState<LeagueContext[]>([]);
    const [weeksData, setWeeksData] = useState<{ leagueId: string; season: string | number | null; week: number; matchups: SleeperMatchup[] }[]>([]);

    useEffect(() => {
        let canceled = false;
        (async () => {
          try {
            setStatus('fetching_contexts'); // Step 1: Fetch league details
            setError(null);

            const leagueIds = [LEAGUE_ID, ...PRIOR_LEAGUE_IDS];
            const fetchedContexts: LeagueContext[] = [];
            for (const lid of leagueIds) {
              const [league, u, r] = await Promise.all([
                safeJson(`https://api.sleeper.app/v1/league/${lid}`),
                safeJson(`https://api.sleeper.app/v1/league/${lid}/users`),
                safeJson(`https://api.sleeper.app/v1/league/${lid}/rosters`),
              ]);
              fetchedContexts.push({
                leagueId: lid,
                season: league?.season ?? league?.metadata?.season ?? null,
                users: Array.isArray(u) ? u as SleeperUser[] : [],
                rosters: Array.isArray(r) ? r as SleeperRoster[] : [],
              });
            }
            setContexts(fetchedContexts);

            setStatus('fetching_matchups'); // Step 2: Fetching large set of weekly data
            const state = await safeJson(`https://api.sleeper.app/v1/state/nfl`);
            const nflWeek = Number(state?.week || state?.display_week || 1);
            const currentEndWeek = Math.max(1, Math.min(18, nflWeek - 1));

            const allWeeks: { leagueId: string; season: string | number | null; week: number; matchups: SleeperMatchup[] }[] = [];
            for (const ctx of fetchedContexts) {
              const endWeek = ctx.leagueId === LEAGUE_ID ? currentEndWeek : 18;
            const weeks = Array.from({ length: endWeek }, (_, i) => i + 1);
              for (const w of weeks) {
                const m = await safeJson(`https://api.sleeper.app/v1/league/${ctx.leagueId}/matchups/${w}`);
                allWeeks.push({ leagueId: ctx.leagueId, season: ctx.season, week: w, matchups: Array.isArray(m) ? (m as SleeperMatchup[]) : [] });
              }
            }

            if (canceled) return;
            setWeeksData(allWeeks);
          } catch (e) {
            if (canceled) return;
            setError('Historical data unavailable (preview CORS?)');
          } finally {
            if (!canceled) setStatus('done');
          }
        })();
        return () => { canceled = true; };
    }, []); 

    // Memoize the rivalry and overall records calculation
    const derivedRecords = useMemo(() => {
        const weeklyRows: WeekEntry[] = [];
        const gameRows: GameEntry[] = [];
        const nameResolvers = new Map<string, (rid: number) => string>();

        for (const row of weeksData) {
            if (!nameResolvers.has(row.leagueId)) {
                const ctx = contexts.find(c => c.leagueId === row.leagueId);
                if (ctx) {
                    const byRoster = new Map(ctx.rosters.map(r => [r.roster_id, r]));
                    const byUser = new Map(ctx.users.map(u => [u.user_id, u]));
                    nameResolvers.set(row.leagueId, (rid: number) => {
                        const r = byRoster.get(rid);
                        const u = r?.owner_id ? byUser.get(r.owner_id) : undefined;
                        const owner = u?.display_name || `Roster ${rid}`; 
                        return `${owner}${row.season ? ` (${row.season})` : ''}`;
                    });
                } else {
                    nameResolvers.set(row.leagueId, (rid: number) => `Roster ${rid}${row.season ? ` (${row.season})` : ''}`);
                }
            }
            const nameOf = nameResolvers.get(row.leagueId)!;

            const byMid = new Map<number, SleeperMatchup[]>();
            for (const m of row.matchups) {
                weeklyRows.push({ team: nameOf(m.roster_id), roster_id: m.roster_id, week: row.week, pts: Number(m.points ?? 0), season: row.season });
                const mid = (m.matchup_id ?? -row.week * 1000 + m.roster_id) + (parseInt(row.leagueId.slice(-4)) || 0); 
                const arr = byMid.get(mid) || [];
                arr.push(m);
                byMid.set(mid, arr);
            }
            for (const [, arr] of byMid) {
                if (arr.length >= 2) {
                    const [A, B] = arr.sort((a, b) => Number(b.points ?? 0) - Number(a.points ?? 0));
                    const ptsA = Number(A.points ?? 0), ptsB = Number(B.points ?? 0);
                    gameRows.push({
                        week: row.week,
                        teamA: nameOf(A.roster_id), teamB: nameOf(B.roster_id),
                        ptsA, ptsB,
                        margin: Math.abs(ptsA - ptsB),
                        total: ptsA + ptsB,
                        season: row.season,
                    });
                }
            }
        }
        
        // --- Calculate Best Regular Season Records & League Champions ---
        const bestRegularSeasonRecords: PastRecord[] = [];
        let championMap = new Map<string | number, PastRecord>();

        // 1. Inject Manual Champions (highest priority)
        Object.entries(MANUAL_CHAMPIONS).forEach(([season, team]) => {
            const score = MANUAL_CHAMPION_SCORES[season] || "N/A"; // Use manual score
            championMap.set(season, {
                season: season,
                team: team,
                record: score, 
            });
        });

        contexts.forEach(ctx => {
            // Only process prior seasons
            if (!ctx.season || ctx.leagueId === LEAGUE_ID) return; 

            // 1a. Calculate Best Regular Season Record 
            const sortedRosters = ctx.rosters.sort((a, b) => {
                const winsA = a.settings?.wins ?? 0;
                const winsB = b.settings?.wins ?? 0;
                
                if (winsB !== winsA) return winsB - winsA;
                return (b.settings?.fpts ?? 0) - (a.settings?.fpts ?? 0);
            });

            const bestRoster = sortedRosters[0];

            if (bestRoster && bestRoster.owner_id) {
                const bestUser = ctx.users.find(u => u.user_id === bestRoster.owner_id);
                if (bestUser) {
                    bestRegularSeasonRecords.push({
                        season: ctx.season,
                        team: bestUser.display_name,
                        record: `${bestRoster.settings?.wins ?? 0}-${bestRoster.settings?.losses ?? 0}`,
                    });
                }
            }
            
            // 1b. Calculate League Champion via API (Only if not already set manually)
            if (!championMap.has(ctx.season)) {
                // Find the winner of the championship match in Week 17 (matchup_id 1 is convention)
                const championshipMatch = weeksData.find(w => w.leagueId === ctx.leagueId && w.week === 17)
                    ?.matchups.filter(m => m.matchup_id === 1)
                    .sort((a, b) => Number(b.points ?? 0) - Number(a.points ?? 0))[0];

                // Look up the owner_id via the roster using roster_id
                if (championshipMatch) {
                    const winningRoster = ctx.rosters.find(r => r.roster_id === championshipMatch.roster_id);
                    // The error TS2339 on owner_id is specifically in this block in previous versions.
                    // Accessing owner_id via winningRoster (SleeperRoster) is correct, while accessing it via championshipMatch (SleeperMatchup) is incorrect.
                    const championUser = winningRoster?.owner_id ? ctx.users.find(u => u.user_id === winningRoster.owner_id) : undefined;
                    
                    if (championUser) {
                        const score = championshipMatch.points ? fmt.format(championshipMatch.points) : "N/A";
                        championMap.set(ctx.season, {
                            season: ctx.season,
                            team: championUser.display_name,
                            record: score, // Display the winning score
                        });
                    }
                }
            }
        });
        
        // Finalize lists
        const leagueChampions = Array.from(championMap.values());

        bestRegularSeasonRecords.sort((a, b) => Number(b.season) - Number(a.season));
        leagueChampions.sort((a, b) => Number(b.season) - Number(a.season));

        // FIX: Remove 'contexts' from return if unused outside of this hook
        return { weeklyRows, gameRows, contexts, status, error, bestRegularSeasonRecords, leagueChampions }; 
    }, [weeksData, contexts, status, error]);

    return derivedRecords;
}

// --- Derived data: standings & power score (simple) ---
function usePowerScores(users: SleeperUser[] | null, rosters: SleeperRoster[] | null) {
  return useMemo<PowerScore[]>(() => {
    if (!users || !rosters) return [];
    const byOwner: Record<string, SleeperRoster> = {};
    rosters.forEach(r => { if (r.owner_id) byOwner[r.owner_id] = r; });

    return users.map(u => {
      const r = byOwner[u.user_id];
      const wins = r?.settings?.wins ?? 0;
      const losses = r?.settings?.losses ?? 0;
      const games = Math.max(1, wins + losses);
      const pointsFor = r?.settings?.fpts ?? 0;
      const pointsAgainst = r?.settings?.fpts_against ?? 0;

      // Simple power score: 70% PF percentile + 30% win% (bounded)
      const maxPF = Math.max(1, ...rosters.map(x => x.settings?.fpts ?? 1));
      const pfPct = (pointsFor / maxPF) * 100; // 0..100
      const winPct = (wins + losses) > 0 ? (wins / (wins + losses)) * 100 : 50;
      const score = 0.7 * pfPct + 0.3 * winPct;
      const avgPerWeek = pointsFor / games;

      // Division detection
      const manual = MANUAL_DIVISIONS[u.display_name];
      const fallback = demoDivisionMap[u.display_name] as 'NFC' | 'AFC' | undefined;
      const division: 'NFC' | 'AFC' = manual ?? fallback ?? (Math.random() > 0.5 ? 'NFC' : 'AFC');

      return { team: u.display_name, score, wins, losses, pointsFor, pointsAgainst, avgPerWeek, division };
    }).sort((a, b) => b.score - a.score);
  }, [users, rosters]);
}

// --- UI primitives ---
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white/90 shadow-sm hover:shadow-lg transition-shadow ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-extrabold text-slate-800">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// --- Rivalry Tracker Component ---

type RivalryRecord = { teamA: string; teamB: string; winsA: number; winsB: number; ties: number; totalGames: number; avgPtsA: number; avgPtsB: number; alias?: string };

function RivalryTracker({ gameRows, status, error }: { gameRows: GameEntry[], status: string, error: string | null }) {
    
    // Calculate rivalry records based on historical game data
    const rivalryRecords = useMemo<RivalryRecord[]>(() => {
        if (!gameRows.length) return [];

        const records = RIVALRIES.map(([teamAName, teamBName, alias]) => {
            let winsA = 0;
            let winsB = 0;
            let ties = 0;
            let totalGames = 0;
            let totalPtsA = 0;
            let totalPtsB = 0;

            for (const game of gameRows) {
                // Check if the game involves the exact rivalry pair (ignoring season suffixes)
                const teamA = game.teamA.split(' (')[0];
                const teamB = game.teamB.split(' (')[0];

                // Check for match (TeamAName vs TeamBName OR TeamBName vs TeamAName)
                const isMatch = 
                    (teamA === teamAName && teamB === teamBName) ||
                    (teamA === teamBName && teamB === teamAName);
                
                if (isMatch) {
                    totalGames++;
                    
                    let ptsA, ptsB;

                    // Standardize: ptsA gets the score of the first listed rival (teamAName)
                    if (teamA === teamAName) {
                        ptsA = game.ptsA;
                    } else { 
                        ptsA = game.ptsB;
                    }
                    // Standardize: ptsB gets the score of the second listed rival (teamBName)
                    if (teamB === teamBName) {
                        ptsB = game.ptsB;
                    } else {
                        ptsB = game.ptsA;
                    }

                    totalPtsA += ptsA;
                    totalPtsB += ptsB;

                    if (ptsA > ptsB) {
                        winsA++;
                    } else if (ptsB > ptsA) {
                        winsB++;
                    } else {
                        ties++;
                    }
                }
            }

            const avgPtsA = totalGames > 0 ? totalPtsA / totalGames : 0;
            const avgPtsB = totalGames > 0 ? totalPtsB / totalGames : 0;

            return { teamA: teamAName, teamB: teamBName, winsA, winsB, ties, totalGames, avgPtsA, avgPtsB, alias };
        });

        return records.filter(r => r.totalGames > 0);
    }, [gameRows]);

    const isDone = status === 'done';
    const isLoading = status !== 'done' && status !== 'idle';
    
    // Fallback message if no data or loading
    let content;
    if (isLoading) {
        content = <div className="text-sm text-slate-500 py-4">Loading historical rivalry data...</div>;
    } else if (error) {
        content = <div className="text-sm text-amber-700 py-4">Could not load historical records. Check the warning above.</div>;
    } else if (rivalryRecords.length === 0 && isDone) {
        content = <div className="text-sm text-slate-500 py-4">No completed rivalry matchups found across all included seasons.</div>;
    } else {
        // Display the rivalry records
        content = (
            <div className="space-y-4 pt-2">
                {rivalryRecords.map((r, i) => (
                    <div key={i} className="p-4 bg-white border border-slate-200 rounded-lg">
                        {/* Title: Custom Name or Team A vs Team B */}
                        <div className={`text-sm font-semibold text-slate-600 mb-2 ${r.alias ? 'text-center text-lg text-slate-800' : ''}`}>
                            {r.alias || `Rivalry ${i + 1}: ${r.teamA} vs ${r.teamB}`}
                        </div>
                        
                        {/* Records Grid */}
                        <div className="grid grid-cols-2 gap-3 text-center">
                            {/* Team A Record */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-300">
                                <div className="font-bold text-lg text-slate-900 flex items-center justify-center">
                                    {r.teamA}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-extrabold ${r.winsA > r.winsB ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {r.winsA} Wins
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Avg Pts: <span className="font-semibold text-slate-800">{fmt.format(r.avgPtsA)}</span>
                                </div>
                            </div>
                            
                            {/* Team B Record */}
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-300">
                                <div className="font-bold text-lg text-slate-900 flex items-center justify-center">
                                    {r.teamB}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-extrabold ${r.winsB > r.winsA ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                        {r.winsB} Wins
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    Avg Pts: <span className="font-semibold text-slate-800">{fmt.format(r.avgPtsB)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Bar */}
                        <div className="mt-3 text-center text-xs text-slate-600">
                            {r.totalGames} total games played 
                            {r.ties > 0 && <span className="ml-1">({r.ties} tie{r.ties !== 1 ? 's' : ''})</span>}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <Card className="p-6 mt-6">
            <SectionTitle 
                title="Rivalry Tracker" 
                subtitle="All-time head-to-head record for core league matchups (across all seasons)." 
            />
            {content}
        </Card>
    );
}

// --- Views ---
function HomeView({ scores }: { scores: PowerScore[] }) {
  const top5 = scores.slice(0, 5);
  const draftLeft = timeLeft(DRAFT_DAY);
  const tradeLeft = timeLeft(TRADE_DEADLINE);
  const playoffsLeft = timeLeft(PLAYOFFS_START);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Fantasy Football League Hub</h1>
            <p className="text-slate-600">Sleeper League ID: <span className="font-semibold">{LEAGUE_ID}</span></p>
          </div>
          <div className="flex gap-3 text-center">
            <div className="px-4 py-2 rounded-xl bg-slate-50 border">
              <div className="text-xs text-slate-500">Draft Day</div>
              <div className="font-bold">{shortDate(DRAFT_DAY)}</div>
              <div className="text-xs">{draftLeft.days}d {draftLeft.hours}h</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-50 border">
              <div className="text-xs text-slate-500">Trade Deadline</div>
              <div className="font-bold">{shortDate(TRADE_DEADLINE)}</div>
              <div className="text-xs">{tradeLeft.days}d {tradeLeft.hours}h</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-50 border">
              <div className="text-xs text-slate-500">Playoffs Begin</div>
              <div className="font-bold">{shortDate(PLAYOFFS_START)}</div>
              <div className="text-xs">{playoffsLeft.days}d {playoffsLeft.hours}h</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6 md:col-span-2">
          <SectionTitle title="Power Rankings" subtitle="Auto-computed from points for and win%" />
          <ol className="divide-y">
            {top5.map((t, i) => (
              <li key={t.team} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold grid place-items-center">{i + 1}</div>
                  <div>
                    <div className="font-semibold text-slate-800">{t.team}</div>
                    <div className="text-xs text-slate-500">{t.division} • {t.wins}-{t.losses} • PF {fmt.format(t.pointsFor)}</div>
                  </div>
                </div>
                <div className="text-lg font-extrabold text-slate-900">{fmt.format(t.score)}</div>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="p-6">
          <SectionTitle title="Latest NFL News" subtitle="Curated from ESPN & RotoWire (links)" />
          <ul className="space-y-3">
            <NewsLink href="https://www.espn.com/nfl/" label="ESPN NFL Headlines" />
            <NewsLink href="https://www.rotowire.com/football/news.php" label="RotoWire NFL News" />
            <p className="text-xs text-slate-500">Tip: For auto-updating feeds, add a small backend proxy to fetch RSS/HTML and expose as JSON to avoid CORS.</p>
          </ul>
        </Card>
      </div>
    </div>
  );
}

function NewsLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <a className="block px-3 py-2 rounded-lg border hover:border-slate-400 hover:bg-slate-50 transition" href={href} target="_blank" rel="noreferrer">
        <div className="font-semibold text-slate-800">{label}</div>
        <div className="text-xs text-slate-500">Opens in new tab</div>
      </a>
    </li>
  );
}

function StandingsView({ scores, gameRows, recordsStatus, recordsError }: { scores: PowerScore[], gameRows: GameEntry[], recordsStatus: string, recordsError: string | null }) {
  // Canvas-friendly standings grouped by division, no toggle
  const [sortKey, setSortKey] = useState<'rank' | 'team' | 'record' | 'pf' | 'pa' | 'avg'>('rank');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');

  const rec = (x: PowerScore) => (x.wins - x.losses);

  const compare = (a: PowerScore, b: PowerScore) => {
    // default rank = by record then PF (desc)
    const pfDiff = b.pointsFor - a.pointsFor;
    const recDiff = rec(b) - rec(a);
    if (sortKey === 'rank') {
      if (recDiff !== 0) return recDiff;
      return pfDiff;
    }
    if (sortKey === 'team') return String(a.team).localeCompare(String(b.team));
    if (sortKey === 'record') return rec(a) - rec(b);
    if (sortKey === 'pf') return a.pointsFor - b.pointsFor;
    if (sortKey === 'pa') return a.pointsAgainst - b.pointsAgainst;
    if (sortKey === 'avg') return a.avgPerWeek - b.avgPerWeek;
    return 0;
  };

  const clickSort = (k: typeof sortKey) => {
    if (k === sortKey) setDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setDir(k === 'team' ? 'asc' : 'desc'); }
  };

  const sortedAll = [...scores].sort(compare);
  if (dir === 'desc') sortedAll.reverse();

  const byDivision = {
    NFC: sortedAll.filter(s => s.division === 'NFC'),
    AFC: sortedAll.filter(s => s.division === 'AFC'),
  } as const;

  const renderRows = (arr: PowerScore[]) => (
    arr.map((t, i) => (
      <tr key={t.team + i} className="border-b last:border-0">
        <td className="py-2 pr-2 font-semibold">{i + 1}</td>
        <td className="py-2 pr-2">{t.team}</td>
        <td className="py-2 pr-2">{t.division}</td>
        <td className="py-2 pr-2">{t.wins}-{t.losses}</td>
        <td className="py-2 pr-2">{fmt.format(t.pointsFor)}</td>
        <td className="py-2 pr-2">{fmt.format(t.pointsAgainst)}</td>
        <td className="py-2 pr-2">{fmt.format(t.avgPerWeek)}</td>
      </tr>
    ))
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionTitle title="Current Standings" subtitle="Grouped by division • Click headers to sort" />
      </Card>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">League standings grouped by division</caption>
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2 cursor-pointer" onClick={() => clickSort('team')}>Team{sortKey==='team' ? (dir==='asc'?' ▲':' ▼') : ''}</th>
                <th className="py-2 pr-2">Div</th>
                <th className="py-2 pr-2 cursor-pointer" onClick={() => clickSort('record')}>W-L{sortKey==='record' ? (dir==='asc'?' ▲':' ▼') : ''}</th>
                <th className="py-2 pr-2 cursor-pointer" onClick={() => clickSort('pf')}>PF{sortKey==='pf' ? (dir==='asc'?' ▲':' ▼') : ''}</th>
                <th className="py-2 pr-2 cursor-pointer" onClick={() => clickSort('pa')}>PA{sortKey==='pa' ? (dir==='asc'?' ▲':' ▼') : ''}</th>
                <th className="py-2 pr-2 cursor-pointer" onClick={() => clickSort('avg')}>Avg/Wk{sortKey==='avg' ? (dir==='asc'?' ▲':' ▼') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {/* NFC Group */}
              <tr className="bg-slate-50">
                <td colSpan={7} className="py-2 px-2 text-xs font-bold text-slate-700">NFC</td>
              </tr>
              {renderRows(byDivision.NFC)}
              {/* AFC Group */}
              <tr className="bg-slate-50">
                <td colSpan={7} className="py-2 px-2 text-xs font-bold text-slate-700">AFC</td>
              </tr>
              {renderRows(byDivision.AFC)}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-slate-500 mt-2">Default rank is by W-L, then PF. Headers toggle sort.</div>
      </Card>
        
        <RivalryTracker gameRows={gameRows} status={recordsStatus} error={recordsError} />
    </div>
  );
}

// --- Playoffs ---
function PlayoffsView({ scores }: { scores: PowerScore[] }) {
  const compare = (a: PowerScore, b: PowerScore) => {
    const recordDiff = (b.wins - b.losses) - (a.wins - a.losses);
    if (recordDiff !== 0) return recordDiff;
    return b.pointsFor - a.pointsFor;
  };

  const seedDivision = (division: 'NFC' | 'AFC') => {
    const teams = scores.filter(s => s.division === division).sort(compare);
    const one = teams[0];
    const two = teams[1];
    const three = teams[2];
    return { one, two, three };
  };

  const n = seedDivision('NFC');
  const a = seedDivision('AFC');

  const Slot = ({ title, team }: { title: string; team?: PowerScore }) => (
    <div className="p-3 rounded-xl border bg-white/90 min-h-[64px]">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="font-semibold">{team ? `${team.team} (${team.wins}-${team.losses})` : 'TBD'}</div>
      {team && <div className="text-xs text-slate-500">PF {fmt.format(team.pointsFor)}</div>}
      </div>
  );

  const Column = ({ title, wc2, wc3, bye1 }: { title: string; wc2?: PowerScore; wc3?: PowerScore; bye1?: PowerScore }) => (
    <Card className="p-4">
      <SectionTitle title={title} subtitle="Top 3 make playoffs • #1 gets bye" />
      <div className="grid grid-cols-1 gap-4">
        <div>
          <div className="text-sm font-semibold mb-2">Wildcard Round</div>
          <div className="grid md:grid-cols-2 gap-3">
            <Slot title="#2 Seed" team={wc2} />
            <Slot title="#3 Seed" team={wc3} />
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Conference Championship</div>
          <div className="grid md:grid-cols-2 gap-3">
            <Slot title="#1 Seed (Bye)" team={bye1} />
            <Slot title="Wildcard Winner" />
          </div>
          <p className="text-xs text-slate-500 mt-2">(Winner advances to League Championship)</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Column title="NFC Bracket" wc2={n.two} wc3={n.three} bye1={n.one} />
        <Column title="AFC Bracket" wc2={a.two} wc3={a.three} bye1={a.one} />
        </div>
      <Card className="p-4">
        <SectionTitle title="League Championship" subtitle="NFC Champion vs AFC Champion" />
        <div className="grid md:grid-cols-2 gap-3">
          <Slot title="NFC Champion" />
          <Slot title="AFC Champion" />
        </div>
      </Card>
      </div>
  );
}

function HistoricalRecordList({ title, champions, scoreColor = 'text-green-700' }: { title: string, champions: PastRecord[], scoreColor?: string }) {
    if (!champions.length) {
        return (
            <div className="p-4 rounded-xl bg-slate-50 border h-full flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2 border-slate-200">{title}</h3>
                <p className="text-sm text-slate-500">No historical record data found.</p>
            </div>
        );
    }

    // Determine what to show in the "record" field based on the title
    const recordLabel = title.includes("Best Regular Season") ? "W-L Record" : "Final Score";
    const recordBg = title.includes("Best Regular Season") ? 'bg-green-50' : 'bg-purple-100';

    return (
        <div className="p-4 rounded-xl bg-slate-50 border h-full flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2 border-slate-200">{title}</h3>
            <ul className="space-y-3 flex-grow">
                {champions.map((c) => (
                    <li key={c.season} className="flex items-center justify-between p-2 rounded-lg bg-white shadow-sm border border-slate-200">
                        <div className="text-sm font-semibold text-slate-800 flex items-center">
                            <span className="text-xl font-extrabold mr-3 text-slate-900 shrink-0 w-12">{c.season}</span>
                            {c.team}
                        </div>
                        <div className={`text-xs text-slate-500 text-right shrink-0 ml-3`}>
                            {recordLabel}
                            <div className={`text-sm ${scoreColor} font-bold ${recordBg} px-3 py-1 rounded-full mt-0.5`}>
                                {c.record}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function RecordsView({ gameRows, recordsStatus, recordsError, bestRegularSeasonRecords, leagueChampions }: { gameRows: GameEntry[], recordsStatus: string, recordsError: string | null, bestRegularSeasonRecords: PastRecord[], leagueChampions: PastRecord[] }) {

  // --- Build records (across seasons) ---
  const { 
    seasonHigh, 
    seasonLow, 
    blowouts, 
    highestCombined, 
  } = useMemo(() => {
    // Only calculate if we have data
    if (!gameRows.length) return {
        seasonHigh: [], seasonLow: [], 
        blowouts: [], highestCombined: [],
    };
    
    const topN = <T,>(arr: T[], n = 5) => arr.slice(0, n);

    // Re-create season totals (since they were calculated in the hook based on weeklyRows)
    const seasonTotalsMap = new Map<string, { team: string; season: string | number | null; pts: number; games: number }>();
    
    // Since we don't have weeklyRows here, we must reconstruct the points-for total from gameRows.
    gameRows.forEach(g => {
        const teamAName = g.teamA.split(' (')[0];
        const teamBName = g.teamB.split(' (')[0];

        const keyA = `${g.season ?? 'unknown'}::${teamAName}`;
        const keyB = `${g.season ?? 'unknown'}::${teamBName}`;
        
        const curA = seasonTotalsMap.get(keyA) || { team: teamAName, season: g.season, pts: 0, games: 0 };
        const curB = seasonTotalsMap.get(keyB) || { team: teamBName, season: g.season, pts: 0, games: 0 };
        
        // This is an approximation of total PF by summing the scores of all games played.
        curA.pts += g.ptsA;
        curA.games += 1;
        curB.pts += g.ptsB;
        curB.games += 1;

        seasonTotalsMap.set(keyA, curA);
        seasonTotalsMap.set(keyB, curB);
    });

    const seasonTotals = Array.from(seasonTotalsMap.values());
    const seasonHigh = topN([...seasonTotals].sort((a, b) => b.pts - a.pts), 5);
    const seasonLow = topN([...seasonTotals].sort((a, b) => a.pts - b.pts), 5);
    

    const blowouts = topN([...gameRows].sort((a, b) => b.margin - a.margin), 5);
    const highestCombined = topN([...gameRows].sort((a, b) => b.total - a.total), 5);

    // FIX: Remove unused 'lowestCombined' from return
    return { seasonHigh, seasonLow, blowouts, highestCombined };
  }, [gameRows]);


  // Redesigned list component for better presentation
  const RecordList = ({ title, items, render }: { title: string; items: any[]; render: (x: any, i: number) => React.ReactNode }) => (
    <div className="p-4 rounded-xl bg-slate-50 border h-full flex flex-col">
        <h3 className="text-lg font-bold text-slate-800 mb-3 border-b pb-2 border-slate-200">{title}</h3>
      <ol className="text-sm space-y-3 flex-grow">
        {items.length ? items.map(render) : <li className="text-slate-500">No data yet.</li>}
      </ol>
      </div>
  );
 
  const RecordItem = ({ rank, score, mainLine, subLine, scoreColor = 'text-slate-900' }: { rank: number, score: number | string, mainLine: string, subLine: string, scoreColor?: string }) => (
    <li className="flex items-start justify-between">
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold grid place-items-center text-xs shrink-0">{rank}</div>
            <div className="text-left leading-snug">
                <div className="font-semibold text-slate-800">{mainLine}</div>
                <div className="text-xs text-slate-500 mt-0.5">{subLine}</div>
            </div>
        </div>
        <div className={`font-extrabold text-lg ml-2 shrink-0 ${scoreColor}`}>{typeof score === 'number' ? fmt.format(score) : score}</div>
    </li>
 );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <SectionTitle title="League Records" subtitle="Top 5 across key categories (all included seasons). Records marked 'Approximate' rely on available game log data." />
        {recordsError && (
          <div className="mb-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
            <strong>Error:</strong> {recordsError}. Using minimal data.
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
            {/* League Champion (Now showing final score) */}
            <HistoricalRecordList 
                title="League Champion (Final Score)" 
                champions={leagueChampions}
                scoreColor="text-purple-700"
            />
            
            {/* Best Regular Season Record */}
            <HistoricalRecordList 
                title="Best Regular Season Record" 
                champions={bestRegularSeasonRecords} 
                scoreColor="text-green-700"
            />

            {/* Season High Points */}
          <RecordList
                title="Season High Points (Approximate)"
            items={seasonHigh}
            render={(x: {team:string; pts:number; season:any}, _i) => (
                <RecordItem
                    key={`sh-${_i}`} rank={_i+1} score={x.pts} scoreColor="text-green-700"
                    mainLine={x.team.split(' (')[0]}
                    subLine={`Total PF ${x.season ? `(${x.season})` : ''}`}
                />
            )}
          />
            
            {/* Blowout Game (Largest Margin) */}
            <RecordList
                title="Largest Margin of Victory"
            items={blowouts}
            render={(g: GameEntry, _i) => (
              <RecordItem
                    key={`bo-${_i}`} rank={_i+1} score={g.margin}
                    mainLine={`${g.teamA.split(' (')[0]} defeats ${g.teamB.split(' (')[0]}`}
                    subLine={`Wk ${g.week} ${g.season ? `(${g.season})` : ''} • ${fmt.format(g.ptsA)} - ${fmt.format(g.ptsB)}`}
                    scoreColor="text-red-700"
                />
            )}
          />

            {/* Highest Combined Score */}
          <RecordList
                title="Highest Combined Score"
            items={highestCombined}
            render={(g: GameEntry, _i) => (
              <RecordItem
                    key={`hc-${_i}`} rank={_i+1} score={g.total}
                    mainLine={`${g.teamA.split(' (')[0]} vs ${g.teamB.split(' (')[0]}`}
                    subLine={`Wk ${g.week} ${g.season ? `(${g.season})` : ''} • Total Pts`}
                />
            )}
          />
            
            {/* Placeholder for Weekly Records (unavailable in preview) */}
            <RecordList
                title="Highest Scoring Week"
                items={[]}
                render={(_, i) => <RecordItem key={i} rank={i+1} score={'--'} mainLine={'Data Unavailable'} subLine={'Requires full weekly data via API.'} scoreColor={'text-slate-500'}/>}
            />
            <RecordList
                title="Lowest Scoring Week"
                items={[]}
                render={(_, i) => <RecordItem key={i} rank={i+1} score={'--'} mainLine={'Data Unavailable'} subLine={'Requires full weekly data via API.'} scoreColor={'text-slate-500'}/>}
            />
            <RecordList
                title="Season Low Points (Approximate)"
                items={seasonLow}
                render={(x: {team:string; pts:number; season:any}, _i) => (
                    <RecordItem
                        key={`sl-${_i}`} rank={_i+1} score={x.pts} scoreColor="text-blue-700"
                        mainLine={x.team.split(' (')[0]}
                        subLine={`Total PF ${x.season ? `(${x.season})` : ''}`}
                    />
                )}
            />

        </div>
        {/* Loading Indicator */}
        {recordsStatus !== 'done' && (
            <div className="text-xs text-slate-500 mt-6 pt-4 border-t">
                {recordsStatus === 'fetching_contexts' && 'Syncing league history and owner lists...'}
                {recordsStatus === 'fetching_matchups' && 'Fetching all weekly matchups (multiple seasons, may take a moment)...'}
            </div>
        )}
        {recordsStatus === 'done' && !gameRows.length && (
            <div className="text-xs text-slate-500 mt-6 pt-4 border-t">
                {recordsError ? (
                    <span className="font-semibold text-amber-700">Data sync failed. Check the general warning at the top.</span>
                ) : (
                    <span>No completed weeks yet in included seasons.</span>
                )}
            </div>
        )}
      </Card>
    </div>
  );
}

function LeagueNewsSection({ users, rosters, nflWeek }: { users: SleeperUser[] | null; rosters: SleeperRoster[] | null; nflWeek: number | null }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [manualNewsItems, setManualNewsItems] = useState<NewsItem[]>([]);
    const [newNewsContent, setNewNewsContent] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(false);

    // --- Local Storage Management ---
    // Load persisted news items on initial render
    useEffect(() => {
        const storedNews = localStorage.getItem('leagueNews');
        if (storedNews) {
            try {
                // Ensure correct shape is parsed, or use empty array on failure
                const parsed = JSON.parse(storedNews);
                if (Array.isArray(parsed)) {
                    setManualNewsItems(parsed as NewsItem[]);
                }
            } catch (e) {
                console.error("Failed to parse stored news", e);
            }
        }
    }, []);

    // Save news items whenever they change
    useEffect(() => {
        localStorage.setItem('leagueNews', JSON.stringify(manualNewsItems));
    }, [manualNewsItems]);

    // --- Automated Summary Logic ---
    const autoSummary = useMemo(() => {
        if (!users || !rosters || users.length === 0 || rosters.length === 0) {
            return "Demo mode: Cannot generate weekly recap without live league data. **Check the warning at the top to confirm data is loading.**";
        }

        // Use the official NFL Week number, or default to a generic count if it's null (e.g., in offseason or fetch failed)
        const currentWeekDisplay = nflWeek ? `Week ${nflWeek}` : 'a few early weeks';

        // Find top point scorer from current rosters/scores (best proxy for power)
        const topTeam = rosters
            .map(r => ({ owner: users.find(u => u.user_id === r.owner_id)?.display_name, points: r.settings?.fpts ?? 0 }))
            .sort((a, b) => b.points - a.points)[0];
        
        return `
The league is heating up after **${currentWeekDisplay}** of action!

The current overall points leader is **${topTeam.owner}** with a dominant ${fmt.format(topTeam.points)} total points, setting the pace for the competition.

**Key Upcoming Dates:**
- **Trade Deadline:** Approaching fast on ${shortDate(TRADE_DEADLINE)}.
- **Playoffs:** Begin on ${shortDate(PLAYOFFS_START)}.

Managers must finalize those crucial deals to secure a playoff spot and avoid the Loser's Bracket!
        `;
    }, [users, rosters, nflWeek]);

    // --- Admin/User Actions (uses window.confirm instead of alert/confirm dialog) ---
    const handleAddNews = () => {
        if (newNewsContent.trim()) {
            const newItem: NewsItem = {
                id: Date.now(), // Unique ID based on timestamp
                content: newNewsContent.trim(),
                date: Date.now(),
                isArchived: false,
            };
            // Prepend new item
            setManualNewsItems(prev => [newItem, ...prev]);
            setNewNewsContent('');
        }
    };

    const handleArchive = (id: number) => {
        setManualNewsItems(prev => prev.map(item => 
            item.id === id ? { ...item, isArchived: true } : item
        ));
    };
    
    const handleClearArchive = () => {
        // NOTE: Using window.confirm() here as per instructions for non-alert/prompt dialogs when needed.
        if (window.confirm("Are you sure you want to permanently delete all archived news items?")) {
            setManualNewsItems(prev => prev.filter(i => !i.isArchived));
        }
    };
    
    // --- Login Logic ---
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setLoginError(false);
            setPassword('');
        } else {
            setLoginError(true);
            setPassword('');
        }
    };

    // --- Render Components ---

    const visibleNews = manualNewsItems.filter(item => !item.isArchived);
    const archivedCount = manualNewsItems.length - visibleNews.length;

    const authInterface = isAuthenticated ? (
        <div className="pt-4 border-t border-slate-100">
            <div className="font-bold text-slate-800 mb-2">Post New Update (Admin Interface)</div>
            <textarea 
                value={newNewsContent}
                onChange={(e) => setNewNewsContent(e.target.value)}
                placeholder="Enter league news, announcements, or reminders here..."
                className="w-full p-2 border border-slate-300 rounded-lg text-sm resize-y focus:border-blue-500"
                rows={3}
            />
            <button 
                onClick={handleAddNews}
                disabled={!newNewsContent.trim()}
                className={`mt-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${newNewsContent.trim() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
            >
                Post Update
            </button>
            <div className="flex items-center justify-between mt-2">
                {archivedCount > 0 && (
                    <div className="text-xs text-slate-500">
                        {archivedCount} archived items hidden.
                        <button 
                            onClick={handleClearArchive}
                            className="ml-2 text-red-500 hover:text-red-700 underline"
                        >
                            Clear Archive
                        </button>
                    </div>
                )}
                <button 
                    onClick={() => setIsAuthenticated(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                >
                    Logout
                </button>
            </div>
        </div>
    ) : (
        <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 mb-2">Commissioner Login</h3>
            <form onSubmit={handleLogin} className="flex flex-col gap-2">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLoginError(false); }}
                    placeholder="Enter admin password"
                    className={`p-2 border rounded-lg text-sm ${loginError ? 'border-red-500' : 'border-slate-300'}`}
                />
                <button 
                    type="submit"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                    Login
                </button>
                {loginError && <p className="text-xs text-red-600">Incorrect password.</p>}
            </form>
        </div>
    );

    const newsFeedContent = (
        <div className="space-y-4">
            {/* Automated Summary Card */}
            <Card className="p-4 bg-slate-50">
                <div className="font-bold text-slate-900 mb-1">Automated League Recap</div>
                <p className="text-slate-700 whitespace-pre-line text-sm">{autoSummary}</p>
            </Card>

            {/* Manual News Feed */}
            {visibleNews.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                    <div className="font-bold text-slate-800 mb-2">Commissioner Updates ({visibleNews.length})</div>
                    <div className="space-y-3">
                        {visibleNews.map(item => (
                            <div key={item.id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm flex justify-between items-start">
                                <p className="text-blue-900 leading-snug">{item.content} <span className="text-xs text-blue-600 ml-2">({new Date(item.date).toLocaleDateString()})</span></p>
                                {/* Archive Button (only visible if authenticated) */}
                                {isAuthenticated && (
                                    <button 
                                        onClick={() => handleArchive(item.id)}
                                        className="text-xs text-blue-500 hover:text-blue-700 ml-3 shrink-0 underline"
                                        title="Archive this news item"
                                    >
                                        Archive
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Admin Input/Login */}
            {authInterface}
        </div>
    );

    return (
        <Card className="p-6 md:col-span-3">
            <div 
                className="flex justify-between items-center cursor-pointer -mt-2 -mb-2"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <SectionTitle title="Weekly News Recap" subtitle={`Current NFL Week: ${nflWeek ?? 'N/A'}. Automated trends plus manual Commissioner updates.`} />
                <button 
                    className="flex items-center gap-1 text-sm px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold shrink-0"
                >
                    {isExpanded ? 'Minimize ' : 'Maximize '}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                </button>
            </div>
            {isExpanded && newsFeedContent}
        </Card>
    );
}

function ConstitutionSection() {
    const [isExpanded, setIsExpanded] = useState(false);

    // Simplified JSX structure of the full constitution
    const constitutionContent = (
        <div className="text-sm text-slate-700 space-y-4 pt-4 border-t border-slate-200 mt-4">
            <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-slate-800">Article I – League Officers</h3>
                <p><strong>Commissioner:</strong> Josef Santos 📱 (425) 419-8012 (Text preferred) 📧 tnutffl@gmail.com</p>
                <p><strong>Co-Commissioner:</strong> Leland Mann 📱 (253) 304-8221 (Text preferred)</p>
                <p>Funds managed jointly by Commissioner and Co-Commissioner. For urgent roster requests, post to the league message board to establish a verifiable timestamp.</p>
            </div>
            
            <div className="space-y-2 pt-4">
                <h3 className="text-xl font-extrabold text-slate-800">Article II – League Entry & Fees</h3>
                <p><strong>Entry Fee:</strong> $140 per team. The last-place team in the Loser’s Bracket pays the annual trophy engraving fee and displays the **Loser Flag** for the entire offseason.</p>
            </div>
            
            <div className="space-y-2 pt-4">
                <h3 className="text-xl font-extrabold text-slate-800">Article III – Prize Payouts</h3>
                <ul className="list-disc pl-5">
                    <li>**1st Place:** $780 (65%)</li>
                    <li>**2nd Place:** $300 (25%)</li>
                    <li>**3rd Place:** $120 (10%)</li>
                    <li>**Weekly Prizes:** $25 per week $\times$ 14 weeks = $350</li>
                </ul>
                <p>Payment due via Venmo **@josefsantos** by Tuesday after Week 1.</p>
            </div>

            <div className="space-y-2 pt-4">
                <h3 className="text-xl font-extrabold text-slate-800">Article IV – Late Payments</h3>
                <p>Any prize won before entry payment is forfeited. **Deadline to pay:** Week 3. Non-payment = **immediate expulsion**.</p>
            </div>

            <div className="space-y-2 pt-4">
                <h3 className="text-xl font-extrabold text-slate-800">Article V & VI – Playoffs & Draft Order</h3>
                <p><strong>Playoffs:</strong> Championship Bracket (6 teams, Wk 15-16). Loser's Bracket (6 teams, Wk 15-17) determines next year's draft order (1st pick goes to Loser's Champion; last pick goes to League Champion).</p>
            </div>
            
            <div className="space-y-2 pt-4">
                <h3 className="text-xl font-extrabold text-slate-800">Article VII – Trades & Transactions</h3>
                <p><strong>Fees:</strong> $1 per FA move, $2 per trade. **Veto Window:** 24 hours. Requires 60%+ non-involved votes to veto based on Comparable Value/Clear Improvement criteria. No "short-term loans" (3-week player return restriction).</p>
            </div>
            
            <div className="space-y-2 pt-4">
                <h3 className="text-xl font-extrabold text-slate-800">Article X – League Format</h3>
                <ul className="list-disc pl-5">
                    <li>**Teams:** 12 total. **Divisions:** NUT Federation & Water SAC Alliance.</li>
                    <li>**14 Starters:** 1 QB, 2 RB, 3 WR, 1 TE, 1 FLEX (W/R/T), 1 SUPER FLEX (Q/W/R/T), 2 DL, 1 LB, 2 DB.</li>
                    <li>**Bench/Reserve:** 10 Bench, 3 Taxi, 5 IR slots.</li>
                </ul>
            </div>
            <div className="space-y-2 pt-4">
                <h3 className="text-xl font-extrabold text-slate-800">Ethics & Inactivity</h3>
                <p>No collusion or tanking. **Inactivity Policy:** Warning after 3 weeks of knowingly starting injured/unavailable players. Replacement after 1 more week if unresolved.</p>
            </div>
        </div>
    );

    return (
        <Card className="p-6 md:col-span-3">
            <div 
                className="flex justify-between items-center cursor-pointer -mt-2 -mb-2"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <SectionTitle 
                    title="League Constitution" 
                    subtitle="View all official bylaws, roster settings, and payout details." 
                />
                <button 
                    className="flex items-center gap-1 text-sm px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition font-semibold shrink-0"
                >
                    {isExpanded ? 'Minimize ' : 'Maximize '}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                </button>
            </div>
            {isExpanded && constitutionContent}
        </Card>
    );
}

function LeagueInfoView({ scores, users, rosters, nflWeek }: { scores: PowerScore[], users: SleeperUser[] | null, rosters: SleeperRoster[] | null, nflWeek: number | null }) {
  const draftLeft = timeLeft(DRAFT_DAY);
  const tradeLeft = timeLeft(TRADE_DEADLINE);
  const playoffsLeft = timeLeft(PLAYOFFS_START);
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="p-6">
        <SectionTitle title="Draft Day" />
        <Countdown target={DRAFT_DAY} left={draftLeft} />
      </Card>
      <Card className="p-6">
        <SectionTitle title="Trade Deadline" />
        <Countdown target={TRADE_DEADLINE} left={tradeLeft} />
      </Card>
      <Card className="p-6">
        <SectionTitle title="Playoffs Begin" />
        <Countdown target={PLAYOFFS_START} left={playoffsLeft} />
      </Card>

      <LeagueNewsSection users={users} rosters={rosters} nflWeek={nflWeek} />
        
      <ConstitutionSection />

      <Card className="p-6 md:col-span-3">
        <SectionTitle title="Owner Transactions Totals" subtitle="Waiver adds = $1 each • Trades = $1 per participant • Drops = $0" />
        <OwnerTransactionsTracker />
      </Card>
      </div>
  );
}

function OwnerTransactionsTracker() {
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date(new Date().getFullYear(), 7, 1); // Aug 1 this year
    return d.toISOString().slice(0,10);
  });
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<{ owner: string; adds: number; trades: number; total: number }[]>([]);

  const withinRange = (ts?: number) => {
    if (!ts) return true; // if missing, include
    const t = new Date(ts).getTime();
    const start = new Date(fromDate + 'T00:00:00').getTime();
    const end = new Date(toDate + 'T23:59:59').getTime();
    return t >= start && t <= end;
  };

  const sync = async () => {
    try {
      setLoading(true); setError(null);
      const [users, rosters] = await Promise.all([
        safeJson(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`),
        safeJson(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`),
      ]);
      const userById = new Map<string, SleeperUser>((Array.isArray(users) ? users : []).map((u: SleeperUser) => [u.user_id, u]));
      const rosterById = new Map<number, SleeperRoster>((Array.isArray(rosters) ? rosters : []).map((r: SleeperRoster) => [r.roster_id, r]));

      // Helper to get owner display name from roster id
      const ownerName = (rid: number) => {
        const r = rosterById.get(rid);
        const u = r?.owner_id ? userById.get(r.owner_id) : undefined;
        return u?.display_name || `Roster ${rid}`;
      };

      // Pull transactions week-by-week (1..18)
      const weeks = Array.from({length: 18}, (_, i) => i + 1);
      const allTxns: SleeperTransaction[] = [];
      for (const w of weeks) {
        const txns = await safeJson(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/transactions/${w}`);
        if (Array.isArray(txns)) allTxns.push(...txns);
      }

      // Aggregate
      const ledger = new Map<string, { adds: number; trades: number }>();
      const ensure = (name: string) => {
        if (!ledger.has(name)) ledger.set(name, { adds: 0, trades: 0 });
        return ledger.get(name)!;
      };

      for (const t of allTxns) {
        if (!withinRange(t.status_updated)) continue;
        if (t.status !== 'complete') continue;
        const type = t.type || '';
        if (type === 'waiver' || type === 'free_agent') {
          // Count only adds; drops are free
          const adds = t.adds ? Object.values(t.adds) : [];
          for (const rid of adds) {
            const name = ownerName(Number(rid));
            ensure(name).adds += 1; // $1 per add
          }
        } else if (type === 'trade') {
          // $1 per participant
          const rids = t.roster_ids || [];
          for (const rid of rids) {
            const name = ownerName(Number(rid));
            ensure(name).trades += 1; // $1 per participant
          }
        }
      }

      const out = Array.from(ledger.entries()).map(([owner, v]) => ({ owner, adds: v.adds, trades: v.trades, total: v.adds + v.trades }))
        .sort((a,b) => b.total - a.total || b.adds - a.adds || b.trades - a.trades || a.owner.localeCompare(b.owner));
      setRows(out);
    } catch (e) {
      setError('Could not sync transactions (preview may block network).');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { sync(); }, []);

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-3">
        <div>
          <div className="text-xs text-slate-500 mb-1">From</div>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="border rounded-lg px-2 py-1" />
          </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">To</div>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="border rounded-lg px-2 py-1" />
        </div>
        <button onClick={sync} className="px-3 py-2 rounded-lg border bg-white hover:bg-slate-50 text-sm">Sync</button>
        {loading && <span className="text-xs text-slate-500">Syncing…</span>}
        {error && <span className="text-xs text-amber-700">{error}</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b">
              <th className="py-2 pr-2">Owner</th>
              <th className="py-2 pr-2">Waiver Adds ($1)</th>
              <th className="py-2 pr-2">Trades ($1)</th>
              <th className="py-2 pr-2">Total $</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map(r => (
              <tr key={r.owner} className="border-b last:border-0">
                <td className="py-2 pr-2 font-semibold">{r.owner}</td>
                <td className="py-2 pr-2">{r.adds}</td>
                <td className="py-2 pr-2">{r.trades}</td>
                <td className="py-2 pr-2 font-semibold">{r.total}</td>
            </tr>
            )) : (
              <tr><td colSpan={4} className="py-3 text-slate-500">No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-500 mt-2">Rules: Waiver add = $1; Trade participation = $1; Drops = $0. Filter applies to transaction timestamp (PT).</div>
      </div>
  );
}

function Countdown({ target, left }: { target: Date; left: { days: number; hours: number; mins: number } }) {
  return (
    <div>
      <div className="text-slate-700">{target.toLocaleString()}</div>
      <div className="mt-2 text-3xl font-black tracking-tight">{left.days}d {left.hours}h {left.mins}m</div>
      <div className="text-xs text-slate-500 mt-1">(auto-updates on refresh)</div>
      </div>
  );
}

// --- Shell ---
const TABS = [
  { key: "home", label: "Home" },
  { key: "league-info", label: "League Info" },
  { key: "standings", label: "Standings" },
  { key: "records", label: "Records" },
  { key: "playoffs", label: "Playoffs" },
];

export default function App() {
  const [tab, setTab] = useState<string>("home");
  
  // Fetches core league data (users and rosters)
  const { users, rosters } = useSleeperLeague(LEAGUE_ID);
  // Fetches current official NFL week
  const nflWeek = useNFLState(); 

  const scores = usePowerScores(users.data, rosters.data);
  // NEW: Fetch all historical game data once for use in Standings (rivalry) and Records
  // FIX: Unused 'contexts' removed from destructuring.
  const { gameRows, status: recordsStatus, error: recordsError, bestRegularSeasonRecords, leagueChampions } = useHistoricalLeagueData();

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
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${tab === t.key ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-700'}`}
              >{t.label}</button>
            ))}
          </nav>
          {/* Removed Resync Button */}
          <div className="md:hidden">
            <select value={tab} onChange={e => setTab(e.target.value)} className="px-3 py-2 rounded-xl border bg-white">
              {TABS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {(users.error || rosters.error || recordsError) && (
          <Card className="p-4 border-amber-300 bg-amber-50">
            <div className="text-sm text-amber-800">
              <strong>Heads up:</strong> {users.error || rosters.error || recordsError}. When deployed on a domain with CORS allowed, live data will appear automatically.
            </div>
          </Card>
        )}

        {tab === "home" && <HomeView scores={scores} />}
        {tab === "league-info" && <LeagueInfoView scores={scores} users={users.data} rosters={rosters.data} nflWeek={nflWeek} />}
        {tab === "standings" && <StandingsView scores={scores} gameRows={gameRows} recordsStatus={recordsStatus} recordsError={recordsError} />}
        {tab === "records" && <RecordsView gameRows={gameRows} recordsStatus={recordsStatus} recordsError={recordsError} bestRegularSeasonRecords={bestRegularSeasonRecords} leagueChampions={leagueChampions} />}
        {tab === "playoffs" && <PlayoffsView scores={scores} />}
      </main>

      <footer className="max-w-6xl mx-auto p-6 text-xs text-slate-500">
        Built with ❤️ • Customize divisions in <code>MANUAL_DIVISIONS</code> if Sleeper division data isn't available.
      </footer>
    </div>
  );
}

