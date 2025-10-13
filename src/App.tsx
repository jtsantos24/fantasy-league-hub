<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>NUT & Friends — Sleeper Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root{--bg:#111;--text:#e5e5e5;--muted:#9ca3af;--card:rgba(255,255,255,.04);--border:rgba(255,255,255,.08)}
    html{color-scheme:dark light}
    body{font-family:Inter,system-ui,Arial,sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;}
    *{ -webkit-tap-highlight-color:transparent }
    .card{background:var(--card);border:1px solid var(--border);border-radius:14px}
    .chip{border:1px solid rgba(255,255,255,.14);border-radius:12px}
    .grid-auto{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1rem}
    code{color:var(--text);background:rgba(255,255,255,.06);padding:2px 6px;border-radius:8px}
    header nav{overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none}
    header nav::-webkit-scrollbar{display:none}
    header nav button{transition:all .15s ease;white-space:nowrap}
    header nav button:hover{background:rgba(255,255,255,.08)}
    @media (max-width:640px){
      html{font-size:15px}
      .grid-auto{grid-template-columns:repeat(auto-fill,minmax(200px,1fr))}
      header .brand{display:none}
      table{font-size:.9rem}
      th,td{padding-left:.5rem;padding-right:.5rem}
    }
    @media (prefers-reduced-motion:reduce){
      *{animation:none!important;transition:none!important}
    }
  </style>
</head>
<body>
<header class="sticky top-0 z-50 bg-white/5 backdrop-blur border-b border-white/10">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
    <div class="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-slate-200">N</div>
    <div class="brand text-lg md:text-xl font-extrabold">NUT & Friends Fantasy Football</div>
    <span id="leagueYear" class="ml-2 text-sm text-slate-400"></span>
    <nav class="ml-auto flex gap-1 pr-1">
      <button data-route="home" class="px-3 py-1.5 rounded-xl chip">Home</button>
      <button data-route="standings" class="px-3 py-1.5 rounded-xl chip">Standings</button>
      <button data-route="power" class="px-3 py-1.5 rounded-xl chip">Power</button>
      <button data-route="records" class="px-3 py-1.5 rounded-xl chip">Records</button>
      <button data-route="info" class="px-3 py-1.5 rounded-xl chip">League Info</button>
    </nav>
  </div>
</header>
<main class="max-w-7xl mx-auto px-4 py-6 space-y-6">
  <div id="status" class="hidden card p-4 text-sm text-amber-200"></div>

  <!-- HOME -->
  <section id="view-home" class="space-y-6">
    <div class="grid md:grid-cols-2 gap-4">
      <div class="card p-5">
        <h2 class="text-xl font-bold mb-2">Welcome</h2>
        <p class="text-slate-300">Live data from Sleeper league <code class=\"font-semibold\">1180316624798797824</code>.</p>
      </div>
      <div class="card p-5">
        <h2 class="text-xl font-bold mb-2">Key Info</h2>
        <div id="leagueMeta" class="text-slate-300 text-sm"></div>
      </div>
    </div>
    <div class="card p-5">
      <h3 class="text-lg font-bold mb-3">This Week — Scoreboard</h3>
      <div id="scoreboard" class="grid-auto"></div>
    </div>

    <!-- Activity & Fees -->
    <div class="card p-5">
      <div class="flex flex-col md:flex-row md:items-end gap-3 mb-3">
        <div class="flex-1">
          <h3 class="text-lg font-bold">Activity & Fees</h3>
          <p class="text-slate-400 text-sm">Waiver adds $1 · Drops $0 · Trades $1 per owner</p>
        </div>
        <div class="flex gap-2 items-end flex-wrap">
          <label class="text-xs text-slate-300">Start <input id="actStart" type="date" class="ml-1 bg-transparent chip rounded-xl px-2 py-1 text-sm"/></label>
          <label class="text-xs text-slate-300">End <input id="actEnd" type="date" class="ml-1 bg-transparent chip rounded-xl px-2 py-1 text-sm"/></label>
          <label class="text-xs text-slate-300">Sort <select id="actSort" class="ml-1 bg-transparent chip rounded-xl px-2 py-1 text-sm"><option value="total">Total</option><option value="adds">Adds</option><option value="drops">Drops</option><option value="trades">Trades</option><option value="owner">Owner</option></select></label>
          <button id="actApply" class="px-3 py-1.5 rounded-xl chip">Apply</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-slate-400"><tr><th class="text-left pb-2">Owner</th><th class="text-right pb-2">Adds</th><th class="text-right pb-2">Drops</th><th class="text-right pb-2">Trades</th><th class="text-right pb-2">Total</th></tr></thead>
          <tbody id="activityBody"></tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- STANDINGS -->
  <section id="view-standings" class="hidden space-y-4">
    <div class="flex items-center gap-2"><h2 class="text-xl font-bold">Standings</h2>
      <span id="standingsUpdated" class="text-slate-400 text-sm"></span>
      <div class="ml-auto flex items-center gap-2"><label class="text-sm text-slate-300">Sort:</label>
        <select id="standSort" class="bg-transparent chip rounded-xl px-2 py-1 text-sm"><option value="wins">Wins</option><option value="pf">PF</option><option value="pa">PA</option></select>
      </div>
    </div>
    <div id="standings" class="grid md:grid-cols-2 gap-4"></div>
  </section>

  <!-- POWER -->
  <section id="view-power" class="hidden space-y-4"><h2 class="text-xl font-bold">Power Rankings</h2><div id="powerList" class="space-y-2"></div></section>

  <!-- RECORDS -->
  <section id="view-records" class="hidden space-y-4">
    <h2 class="text-xl font-bold">League Records <span id="recordsSeasons" class="ml-2 text-slate-400 text-sm"></span></h2>
    <div id="recordsList" class="grid-auto"></div>
    <h3 class="text-lg font-bold mt-6">Playoff Records <span id="playoffSeasons" class="ml-2 text-slate-400 text-sm"></span></h3>
    <div id="playoffRecordsList" class="grid-auto"></div>
  </section>

  <!-- INFO -->
  <section id="view-info" class="hidden space-y-4">
    <h2 class="text-xl font-bold">League Info</h2>
    <div id="leagueInfoBox" class="card p-4"></div>
    <div class="card p-4">
      <div class="flex items-center gap-2 mb-2">
        <h3 class="font-semibold">Weekly Prizes Tracker</h3>
        <span class="text-slate-400 text-xs">$25/week</span>
        <span id="wpAuthStatus" class="text-xs text-slate-400 ml-2"></span>
        <div class="ml-auto flex items-center gap-2 text-sm">
          <label>From W <input id="wpFrom" type="number" min="1" max="20" value="1" class="w-16 bg-transparent chip rounded-xl px-2 py-1 ml-1"/></label>
          <label>To W <input id="wpTo" type="number" min="1" max="20" value="14" class="w-16 bg-transparent chip rounded-xl px-2 py-1 ml-1"/></label>
          <button id="wpRecalc" class="px-3 py-1.5 rounded-xl chip">Recalculate</button>
          <button id="wpClearOverrides" class="px-3 py-1.5 rounded-xl chip">Clear Overrides</button>
          <button id="wpSignIn" class="px-3 py-1.5 rounded-xl chip">Sign in</button>
          <button id="wpSignOut" class="px-3 py-1.5 rounded-xl chip">Sign out</button>
        </div>
      </div>
      <p class="text-slate-400 text-sm mb-3">Some awards auto-compute; others are manual. Click a winner to override. Editing is password‑protected.</p>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-slate-400"><tr><th class="text-left pb-2">Week</th><th class="text-left pb-2">Award</th><th class="text-left pb-2">Winner</th><th class="text-right pb-2">Metric</th><th class="text-right pb-2">Prize</th></tr></thead>
          <tbody id="wpBody"></tbody>
          <tfoot><tr><td colspan="5" class="pt-3"><div id="wpTotals" class="text-sm text-slate-300"></div></td></tr></tfoot>
        </table>
      </div>
    </div>
    <div class="card p-4"><h3 class="font-semibold mb-2">Deploy</h3><ol class="list-decimal pl-6 space-y-1 text-slate-300"><li>Add this file as <code>index.html</code> to a repo</li><li>Vercel → New Project → Framework: Other → Build: none → Output: /</li></ol></div>
  </section>
</main>
<footer class="max-w-7xl mx-auto px-4 pb-10 text-center text-xs text-slate-500">Built for Sleeper League 1180316624798797824 · Single‑file site</footer>

<script>
;(function(){
  // ==== Config ====
  const LEAGUE_ID = '1180316624798797824';
  const HIST_IDS = ['996112028718841856','1053587508728012800']; // 2023, 2024
  const YEAR_BY_LID = { '1180316624798797824':'2025','996112028718841856':'2023','1053587508728012800':'2024' };
  const MANUAL_DIV = { 'CamWells16':'AFC','Smittytribe27':'AFC','AlanCarignan':'NFC','cincy_kid':'NFC','JeffPeterson20':'AFC','Savro24':'AFC','twillie391':'NFC','PAHTNAH':'NFC','BReyes':'AFC' };
  const MAX_WEEK = 20, DEFAULT_PO_START = 15;

  // Weekly Prizes auth
  const WP_PASS = 's24011480';
  const WP_AUTH_KEY = `wpAuth-ok-${LEAGUE_ID}`;
  const isAuthed = () => localStorage.getItem(WP_AUTH_KEY)==='1';
  const setAuthed = (v) => { if(v) localStorage.setItem(WP_AUTH_KEY,'1'); else localStorage.removeItem(WP_AUTH_KEY); updAuthUI(); };

  // ==== Utils ====
  const $ = s => document.querySelector(s);
  const el = (t,c,h)=>{ const n=document.createElement(t); if(c) n.className=c; if(h!=null) n.innerHTML=h; return n; };
  const fetchJson = async u => { const r = await fetch(u); if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); };
  const pct = v => (v*100).toFixed(1)+'%';

  // ==== Router ====
  const ROUTES = ['home','standings','power','records','info'];
  function show(route){
    ROUTES.forEach(id=>{ const v=document.getElementById('view-'+id); if(v) v.classList.toggle('hidden', id!==route); });
    document.querySelectorAll('nav [data-route]').forEach(b=> b.classList.toggle('bg-white/10', b.dataset.route===route));
    location.hash = route;
    if(route==='records') loadRecordsOnce();
    if(route==='info'){ wireWeeklyPrizes(); buildWeeklyPrizes(); }
  }
  document.querySelectorAll('nav [data-route]').forEach(b=> b.addEventListener('click',()=>show(b.dataset.route)));
  window.addEventListener('hashchange',()=>show((location.hash||'#home').slice(1)));

  // ==== API ====
  const API = {
    league: () => fetchJson(`https://api.sleeper.app/v1/league/${LEAGUE_ID}`),
    users:  () => fetchJson(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/users`),
    rosters:() => fetchJson(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/rosters`),
    state:  () => fetchJson(`https://api.sleeper.app/v1/state/nfl`),
    matchups:(w) => fetchJson(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/matchups/${w}`),
    tx:(w) => fetchJson(`https://api.sleeper.app/v1/league/${LEAGUE_ID}/transactions/${w}`),
  };

  const app = { league:null, users:[], rosters:[], week:1, txByWeek:new Map() };
  const id2name = uid => { const u=app.users.find(u=>u.user_id===uid); return u ? (u.display_name||u.username||'—') : '—'; };
  const rosterId2Owner = rid => { const r=app.rosters.find(r=>r.roster_id===rid); return r? r.owner_id : null; };
  const toMs = ts => ts==null? null : (ts<1e12? ts*1000 : ts);
  const teamName = r => (r?.metadata?.team_name || r?.metadata?.nickname || '');
  const inferDiv = r => { const owner=id2name(r.owner_id); if(MANUAL_DIV[owner]) return MANUAL_DIV[owner]; const t=teamName(r).toUpperCase(); if(/\bNFC\b/.test(t)) return 'NFC'; if(/\bAFC\b/.test(t)) return 'AFC'; return ''; };

  // ==== League Meta ====
  function buildLeagueMeta(){
    const l=app.league||{};
    $('#leagueYear').textContent = `• ${l.season||''} • ${l.name||'Sleeper League'}`;
    $('#leagueMeta').innerHTML = `Season <b>${l.season||'—'}</b> · Teams <b>${app.rosters.length}</b>`;
    $('#leagueInfoBox').innerHTML = `<div>League ID: <code>${LEAGUE_ID}</code></div><div>Name: <b>${l.name||'—'}</b></div><div class='mt-2 text-xs text-slate-400'>Weekly prize $25 — see tracker below.</div>`;
  }

  // ==== Scoreboard ====
  async function buildScoreboard(){
    const box=$('#scoreboard'); box.innerHTML='';
    let wk=app.week||1; let data=await API.matchups(wk).catch(()=>[]);
    if(!data.length){ wk=Math.max(1,wk-1); data=await API.matchups(wk).catch(()=>[]); }
    const by=new Map(); data.forEach(m=>{ if(!by.has(m.matchup_id)) by.set(m.matchup_id,[]); by.get(m.matchup_id).push(m); });
    if(!by.size){ box.appendChild(el('div','text-slate-400','No matchups yet.')); return; }
    for(const [id,arr] of by){ const a=arr[0]||{}, b=arr[1]||{}; const ra=app.rosters.find(r=>r.roster_id===a.roster_id), rb=app.rosters.find(r=>r.roster_id===b.roster_id); const card=el('div','card p-4'); card.innerHTML = `<div class="flex items-center justify-between gap-4"><div><div class="text-sm text-slate-400">Matchup ${id} · Week ${wk}</div><div class="font-semibold">${id2name(ra?.owner_id)} <span class="text-slate-400">vs</span> ${id2name(rb?.owner_id)}</div></div><div class="text-right text-2xl font-extrabold">${(a.points||0).toFixed(2)}<span class="text-slate-400 text-base"> – </span>${(b.points||0).toFixed(2)}</div></div>`; box.appendChild(card); }
  }

  // ==== Standings / Power ====
  function teams(){
    return app.rosters
      .map(r=>{ const pf=(r.settings?.fpts||0)+(r.settings?.fpts_decimal||0)/100; const pa=(r.settings?.fpts_against||0)+(r.settings?.fpts_against_decimal||0)/100; return {r, owner:id2name(r.owner_id), team:teamName(r), div:inferDiv(r), wins:r.settings?.wins||0, losses:r.settings?.losses||0, ties:r.settings?.ties||0, pf, pa}; })
      .map((t,i,arr)=>{ if(!t.div){ const nfc=arr.filter(x=>x.div==='NFC').length, afc=arr.filter(x=>x.div==='AFC').length; t.div = nfc<=afc?'NFC':'AFC'; } return t; });
  }
  function buildStandings(){
    const data=teams(); const wrap=$('#standings'); const upd=$('#standingsUpdated');
    function render(rows){
      wrap.innerHTML='';
      [{lab:'NFC', rows:rows.filter(t=>t.div==='NFC')},{lab:'AFC', rows:rows.filter(t=>t.div==='AFC')}].forEach(g=>{
        const col=el('div','space-y-2'); col.appendChild(el('div','text-slate-200 font-semibold',g.lab));
        g.rows.forEach((t,i)=>{ const gp=(t.wins+t.losses+t.ties)||0, w=gp? (t.wins+.5*t.ties)/gp : 0; const row=el('div','card p-3 flex items-center gap-3'); row.innerHTML = `<div class="w-6 text-right text-slate-400">${i+1}</div><div class="flex-1"><div class="font-semibold">${t.owner} <span class="ml-2 text-[10px] px-1.5 py-0.5 rounded chip">${t.div}</span></div><div class="text-xs text-slate-400">${t.wins}-${t.losses}${t.ties?'-'+t.ties:''} · PF ${t.pf.toFixed(2)} · PA ${t.pa.toFixed(2)}</div></div><div class="text-sm font-semibold">${pct(w)}</div>`; col.appendChild(row); }); wrap.appendChild(col); });
      upd.textContent = 'Updated '+new Date().toLocaleString();
    }
    const sel=$('#standSort'); const sort=()=>{ const how=sel.value; const s=[...data].sort((a,b)=> how==='wins'? ((b.wins-b.losses)-(a.wins-a.losses) || b.pf-a.pf) : how==='pf'? (b.pf-a.pf) : (b.pa-a.pa) ); render(s); };
    sel.onchange=sort; sort();
  }
  function buildPower(){
    const list=$('#powerList'); list.innerHTML='';
    teams().map(t=>{ const gp=(t.wins+t.losses+t.ties)||0, w=gp? (t.wins+.5*t.ties)/gp : 0; return {...t, score: t.pf*0.7 + w*100*0.3}; })
      .sort((a,b)=>b.score-a.score)
      .forEach((t,i)=>{ list.appendChild(el('div','card p-3 flex items-center gap-3', `<div class="w-6 text-right text-slate-400">${i+1}</div><div class="flex-1"><div class="font-semibold">${t.owner}</div><div class="text-xs text-slate-400">PF ${t.pf.toFixed(2)} · Win% ${pct((t.wins+0.5*t.ties)/((t.wins+t.losses+t.ties)||1))}</div></div><div class="text-sm font-extrabold">${t.score.toFixed(1)}</div>`)); });
  }

  // ==== Activity & Fees ====
  async function ensureTx(){ if(app.txByWeek.size) return; for(let w=1; w<=MAX_WEEK; w++){ try{ const tx=await API.tx(w); if(tx?.length) app.txByWeek.set(w,tx); }catch{} } }
  function buildActivity(){
    const tbody=$('#activityBody'); tbody.innerHTML='';
    const s=$('#actStart'), e=$('#actEnd'); const today=new Date(), d60=new Date(Date.now()-60*24*3600*1000);
    if(!s.value) s.value=d60.toISOString().slice(0,10);
    if(!e.value) e.value=today.toISOString().slice(0,10);
    const sMs=Date.parse(s.value), eMs=Date.parse(e.value)+86399999;
    const per=new Map(); const add=(oid)=>{ if(!per.has(oid)) per.set(oid,{owner:id2name(oid),adds:0,drops:0,trades:0}); return per.get(oid); };
    for(const [,list] of app.txByWeek){
      for(const t of list){ const ts=toMs(t.status_updated||t.created); if(ts && (ts<sMs||ts>eMs)) continue;
        if(t.type==='waiver'&&t.adds) Object.values(t.adds).forEach(rid=>{ const oid=rosterId2Owner(rid); if(oid) add(oid).adds++; });
        if(t.drops) Object.values(t.drops).forEach(rid=>{ const oid=rosterId2Owner(rid); if(oid) add(oid).drops++; });
        if(t.type==='trade'&&Array.isArray(t.roster_ids)) t.roster_ids.forEach(rid=>{ const oid=rosterId2Owner(rid); if(oid) add(oid).trades++; });
      }
    }
    const rows=[...per.values()].map(r=>({...r,total:r.adds+r.trades}));
    const how=$('#actSort').value;
    const cmp={ total:(a,b)=>b.total-a.total||a.owner.localeCompare(b.owner), adds:(a,b)=>b.adds-a.adds||a.owner.localeCompare(b.owner), drops:(a,b)=>b.drops-a.drops||a.owner.localeCompare(b.owner), trades:(a,b)=>b.trades-a.trades||a.owner.localeCompare(b.owner), owner:(a,b)=>a.owner.localeCompare(b.owner) }[how]||((a,b)=>b.total-a.total);
    rows.sort(cmp);
    if(!rows.length){ tbody.innerHTML='<tr><td colspan="5" class="py-6 text-center text-slate-400">No activity in this range.</td></tr>'; return; }
    rows.forEach(r=> tbody.appendChild(el('tr','', `<td class="py-1.5">${r.owner}</td><td class="py-1.5 text-right">${r.adds}</td><td class="py-1.5 text-right">${r.drops}</td><td class="py-1.5 text-right">${r.trades}</td><td class="py-1.5 text-right font-semibold">$${r.total}</td>`)) );
  }
  function wireActivity(){ $('#actApply').addEventListener('click',buildActivity); ['actSort','actStart','actEnd'].forEach(id=> $('#'+id).addEventListener('change',buildActivity)); }

  // ==== Weekly Prizes ====
  const PRIZE=25;
  const PRIZES=[
    {w:1,key:'fast_start',name:'Fast Start Award',note:'Most points in Week 1',kind:'team_max_points'},
    {w:2,key:'rookie_roulette',name:'Rookie Roulette',note:'Highest rookie score',kind:'manual'},
    {w:3,key:'one_man_army',name:'One-Man Army',note:'Highest single starter',kind:'max_single_starter'},
    {w:4,key:'bench_blunder',name:'Bench Blunder',note:'Most bench points',kind:'max_bench_points'},
    {w:5,key:'perfect_lineup',name:'Perfect Lineup',note:'Smallest optimal gap (approx)',kind:'approx_gap'},
    {w:6,key:'rivalry_wrecker',name:'Rivalry Wrecker',note:'Largest cross-division win',kind:'max_margin_cross'},
    {w:7,key:'close_call',name:'Close Call',note:'Narrowest win',kind:'min_margin'},
    {w:8,key:'midseason_monster',name:'Midseason Monster',note:'Most points through W1-8',kind:'sum_thru_8'},
    {w:9,key:'blowout_bonus',name:'Blowout Bonus',note:'Largest margin',kind:'max_margin'},
    {w:10,key:'iron_man',name:'Iron Man Award',note:'All starters ≥10; best team pts',kind:'iron_man'},
    {w:11,key:'waiver_wizard',name:'Waiver Wizard',note:'Best waiver pickup',kind:'manual'},
    {w:12,key:'lucky_break',name:'Lucky Break',note:'Lowest winning score',kind:'min_win_score'},
    {w:13,key:'comeback_kid',name:'Comeback Kid',note:'Biggest comeback vs proj',kind:'manual'},
    {w:14,key:'longest_qb_pass',name:'Longest QB Passing Play',note:'Longest QB pass',kind:'manual'},
  ];
  const OVKEY=`wpOverrides-${LEAGUE_ID}`;
  const loadOv=()=>{ try{ return JSON.parse(localStorage.getItem(OVKEY)||'{}'); }catch{ return {}; } };
  const saveOv=o=> localStorage.setItem(OVKEY, JSON.stringify(o));

  const muCache=new Map();
  async function getMu(w){ if(muCache.has(w)) return muCache.get(w); const mu=await API.matchups(w).catch(()=>[]); muCache.set(w, Array.isArray(mu)?mu:[]); return muCache.get(w); }
  const pair=list=>{ const m=new Map(); list.forEach(x=>{ if(!m.has(x.matchup_id)) m.set(x.matchup_id,[]); m.get(x.matchup_id).push(x); }); return [...m.values()].filter(a=>a.length>=2); };
  const divOfRid=rid=>{ const r=app.rosters.find(r=>r.roster_id===rid); return r? inferDiv(r) : ''; };

  async function computePrize(p){
    const mu=await getMu(p.w); const pairs=pair(mu); if(!pairs.length) return null;
    const out={week:p.w,key:p.key,name:p.name,val:null,owner:null};
    if(p.kind==='team_max_points'){
      let best=null; pairs.forEach(([a,b])=>{ [a,b].forEach(m=>{ const v=m.points||0; if(!best||v>best.v) best={v,rid:m.roster_id}; }); });
      if(best){ const r=app.rosters.find(x=>x.roster_id===best.rid); out.val=best.v.toFixed(2); out.owner=id2name(r?.owner_id); }
    } else if(p.kind==='max_single_starter'){
      let best=null; pairs.forEach(([a,b])=>{ [a,b].forEach(m=>{ (m.starters||[]).forEach(pid=>{ const v=(m.players_points?.[pid]||0); if(!best||v>best.v) best={v,rid:m.roster_id}; }); }); });
      if(best){ const r=app.rosters.find(x=>x.roster_id===best.rid); out.val=best.v.toFixed(2); out.owner=id2name(r?.owner_id); }
    } else if(p.kind==='max_bench_points'){
      let best=null; pairs.forEach(([a,b])=>{ [a,b].forEach(m=>{ const starters=new Set(m.starters||[]), pts=m.players_points||{}, players=m.players||[]; let bench=0; players.forEach(pid=>{ if(!starters.has(pid)) bench += (pts[pid]||0); }); if(!best||bench>best.v) best={v:bench,rid:m.roster_id}; }); });
      if(best){ const r=app.rosters.find(x=>x.roster_id===best.rid); out.val=best.v.toFixed(2); out.owner=id2name(r?.owner_id); }
    } else if(p.kind==='approx_gap'){
      let best=null; const gap=m=>{ const pts=m.players_points||{}, players=m.players||[], starters=m.starters||[]; const actual=starters.reduce((s,id)=>s+(pts[id]||0),0); const optimal=players.map(id=>pts[id]||0).sort((a,b)=>b-a).slice(0,starters.length||9).reduce((a,b)=>a+b,0); return Math.max(0,optimal-actual) };
      pairs.forEach(([a,b])=>{ [a,b].forEach(m=>{ const g=gap(m); if(best==null||g<best.g) best={g,rid:m.roster_id}; }); });
      if(best){ const r=app.rosters.find(x=>x.roster_id===best.rid); out.val=best.g.toFixed(2); out.owner=id2name(r?.owner_id); }
    } else if(p.kind==='max_margin' || p.kind==='max_margin_cross' || p.kind==='min_margin' || p.kind==='min_win_score'){
      let best=null; pairs.forEach(([a,b])=>{ const ap=a.points||0, bp=b.points||0, margin=Math.abs(ap-bp); const win=ap>=bp?a:b; if(p.kind==='max_margin'){ if(!best||margin>best.val) best={val:margin,rid:win.roster_id}; } else if(p.kind==='max_margin_cross'){ if(divOfRid(a.roster_id)!==divOfRid(b.roster_id)){ if(!best||margin>best.val) best={val:margin,rid:win.roster_id}; } } else if(p.kind==='min_margin'){ if(margin>0 && (!best||margin<best.val)) best={val:margin,rid:win.roster_id}; } else if(p.kind==='min_win_score'){ const ws=Math.max(ap,bp); if(!best||ws<best.val) best={val:ws,rid:win.roster_id}; } });
      if(best){ const r=app.rosters.find(x=>x.roster_id===best.rid); out.val=best.val.toFixed(2); out.owner=id2name(r?.owner_id); }
    }
    return out;
  }

  function updAuthUI(){
    const st=$('#wpAuthStatus'); if(!st) return;
    st.textContent = isAuthed()? 'Edit enabled' : 'Edit locked';
    const inBtn=$('#wpSignIn'), outBtn=$('#wpSignOut');
    if(inBtn) inBtn.disabled = isAuthed();
    if(outBtn) outBtn.disabled = !isAuthed();
  }
  function wireWeeklyPrizes(){
    const from=$('#wpFrom'), to=$('#wpTo');
    $('#wpRecalc').addEventListener('click',buildWeeklyPrizes);
    $('#wpClearOverrides').addEventListener('click',()=>{ localStorage.removeItem(OVKEY); buildWeeklyPrizes(); });
    $('#wpSignIn').addEventListener('click',()=>{ const p=prompt('Enter Weekly Prizes password:'); if(p===WP_PASS){ setAuthed(true); alert('Editing enabled'); } else { alert('Incorrect password'); } });
    $('#wpSignOut').addEventListener('click',()=>{ setAuthed(false); alert('Signed out'); });
    from.addEventListener('change',buildWeeklyPrizes); to.addEventListener('change',buildWeeklyPrizes);
    updAuthUI();
  }

  async function buildWeeklyPrizes(){
    const tbody=$('#wpBody'); if(!tbody) return; tbody.innerHTML='';
    const from=Math.max(1,parseInt($('#wpFrom').value||'1')); const to=Math.max(from,parseInt($('#wpTo').value||'14'));
    const defs=PRIZES.filter(p=>p.w>=from && p.w<=to);
    const rows=await Promise.all(defs.map(computePrize));
    const ov=loadOv();
    const totals=new Map(); const addTotal=n=>{ if(!n) return; totals.set(n,(totals.get(n)||0)+PRIZE); };
    rows.forEach(r=>{
      const key=`${r?.week||''}:${r?.key||''}`; const o=ov[key];
      const winner=(o&&o.owner)||r?.owner||'(—)'; const metric=r?.val||(o&&o.value)||'';
      if(winner && winner!=='(—)') addTotal(winner);
      const canEdit = isAuthed();
      const editAttr = canEdit? '' : 'disabled title="Sign in to edit"';
      const tr=el('tr','', `<td class="py-1.5">W${r?.week||''}</td><td class="py-1.5">${r?.name||''}</td><td class="py-1.5"><button class="underline decoration-dotted" data-k="${key}" data-o="${winner}" ${editAttr}>${winner}</button></td><td class="py-1.5 text-right">${metric}</td><td class="py-1.5 text-right font-semibold">${winner!=='(—)'?'$'+PRIZE:''}</td>`);
      tbody.appendChild(tr);
    });
    $('#wpTotals').textContent = [...totals.entries()].sort((a,b)=>b[1]-a[1]).map(([n,a])=>`${n}: $${a}`).join(' · ') || '(No winners yet)';
    // Wire inline overrides if authed
    if(isAuthed()){
      tbody.querySelectorAll('button[data-k]').forEach(b=> b.addEventListener('click',()=>{
        const k=b.getAttribute('data-k'); const cur=b.getAttribute('data-o')||'';
        const owner=prompt('Winner display name (exact):',cur)||'';
        const value=prompt('Metric / notes:', '')||'';
        const data=loadOv(); data[k]={owner,value}; saveOv(data); buildWeeklyPrizes();
      }));
    }
  }

  // ==== Records (Top 5 regular + playoff) ====
  const nameById = users => { const m=new Map(users.map(u=>[u.user_id,(u.display_name||u.username||'—')])); return id=>m.get(id)||'—'; };
  const isPO = (wk,start) => Number(wk)>=Number(start);
  const pairByMu = arr => { const m=new Map(); arr.forEach(x=>{ if(!m.has(x.matchup_id)) m.set(x.matchup_id,[]); m.get(x.matchup_id).push(x); }); return [...m.values()].filter(a=>a.length>=2); };
  let _recLoading=false,_recDone=false;
  async function loadRecordsOnce(){ if(_recLoading||_recDone) return; _recLoading=true; try{ await loadRecords(); _recDone=true; } finally { _recLoading=false; } }
  async function loadRecords(){
    const lids=[LEAGUE_ID,...HIST_IDS];
    const seasons=[...new Set(lids.map(id=>YEAR_BY_LID[id]).filter(Boolean))].sort();
    $('#recordsSeasons').textContent = seasons.length? `— Seasons: ${seasons.join(', ')}` : '';
    $('#playoffSeasons').textContent = $('#recordsSeasons').textContent;
    const box=$('#recordsList'), pbox=$('#playoffRecordsList'); box.innerHTML=''; pbox.innerHTML='';
    const weekHigh=[], weekLow=[], blow=[], spf=[], spa=[], savg=[]; const pWeekHigh=[], pWeekLow=[], pBlow=[];
    for(const lid of lids){
      try{
        const [lg,users,rosters]=await Promise.all([
          fetchJson(`https://api.sleeper.app/v1/league/${lid}`),
          fetchJson(`https://api.sleeper.app/v1/league/${lid}/users`),
          fetchJson(`https://api.sleeper.app/v1/league/${lid}/rosters`)
        ]);
        const poStart=Number(lg?.settings?.playoff_week_start||DEFAULT_PO_START);
        const yr=YEAR_BY_LID[lid]||lg.season||'';
        const uname=nameById(users);
        const rid2uid=new Map(rosters.map(r=>[r.roster_id,r.owner_id]));
        const rid2name=rid=>uname(rid2uid.get(rid));
        rosters.forEach(r=>{
          const pf=(r.settings?.fpts||0)+(r.settings?.fpts_decimal||0)/100;
          const pa=(r.settings?.fpts_against||0)+(r.settings?.fpts_against_decimal||0)/100;
          const gp=(r.settings?.wins||0)+(r.settings?.losses||0)+(r.settings?.ties||0);
          const avg=gp? pf/gp : 0;
          spf.push({v:pf,owner:uname(r.owner_id),season:yr});
          spa.push({v:pa,owner:uname(r.owner_id),season:yr});
          savg.push({v:avg,owner:uname(r.owner_id),season:yr});
        });
        for(let w=1; w<=MAX_WEEK; w++){
          const mu=await fetchJson(`https://api.sleeper.app/v1/league/${lid}/matchups/${w}`).catch(()=>[]);
          if(!mu.length) continue;
          const target=isPO(w,poStart)? {arr:pWeekHigh,arrL:pWeekLow} : {arr:weekHigh,arrL:weekLow};
          mu.forEach(m=>{ const v=m.points||0; target.arr.push({v,owner:rid2name(m.roster_id),season:yr,week:w}); target.arrL.push({v,owner:rid2name(m.roster_id),season:yr,week:w}); });
          const pairs=pairByMu(mu);
          pairs.forEach(([a,b])=>{ const ap=a.points||0,bp=b.points||0,mar=Math.abs(ap-bp); const W=ap>=bp?a:b,L=ap>=bp?b:a; const rec={ m:mar, win:rid2name(W.roster_id), lose:rid2name(L.roster_id), wPts:Math.max(ap,bp), lPts:Math.min(ap,bp), season:yr, week:w}; (isPO(w,poStart)?pBlow:blow).push(rec); });
        }
      }catch(e){ console.warn('skip',lid,e); }
    }
    const top=(a,k,n=5,desc=true)=>[...a].sort((x,y)=>desc?y[k]-x[k]:x[k]-y[k]).slice(0,n);
    const render=(wrap,title,items,fmt)=>{ const c=el('div','card p-4'); c.innerHTML = `<div class="text-slate-400 text-sm">${title} — Top 5</div>` + (items.length? `<ol class="mt-2 text-sm text-slate-300 list-decimal pl-6 space-y-1">${items.map(fmt).join('')}</ol>` : `<div class="text-slate-400 text-sm mt-2">(No data)</div>`); wrap.appendChild(c); };
    render(box,'Single‑Week High', top(weekHigh,'v',5,true), r=>`<li>${r.v.toFixed(2)} — ${r.owner} · ${r.season} · W${r.week}</li>`);
    render(box,'Single‑Week Low', top(weekLow,'v',5,false), r=>`<li>${r.v.toFixed(2)} — ${r.owner} · ${r.season} · W${r.week}</li>`);
    render(box,'Biggest Blowout (Margin)', top(blow,'m',5,true), r=>`<li>${r.m.toFixed(2)} — ${r.win} def. ${r.lose} (${r.wPts.toFixed(2)}–${r.lPts.toFixed(2)}) · ${r.season} · W${r.week}</li>`);
    render(box,'Season Points For (PF)', top(spf,'v',5,true), r=>`<li>${r.v.toFixed(2)} — ${r.owner} · ${r.season}</li>`);
    render(box,'Season Points Against (PA)', top(spa,'v',5,true), r=>`<li>${r.v.toFixed(2)} — ${r.owner} · ${r.season}</li>`);
    render(box,'Best Average Weekly Score', top(savg,'v',5,true), r=>`<li>${r.v.toFixed(2)} — ${r.owner} · ${r.season}</li>`);
    render(pbox,'Playoff Single‑Week High', top(pWeekHigh,'v',5,true), r=>`<li>${r.v.toFixed(2)} — ${r.owner} · ${r.season} · W${r.week}</li>`);
    render(pbox,'Playoff Single‑Week Low', top(pWeekLow,'v',5,false), r=>`<li>${r.v.toFixed(2)} — ${r.owner} · ${r.season} · W${r.week}</li>`);
    render(pbox,'Playoff Biggest Blowout', top(pBlow,'m',5,true), r=>`<li>${r.m.toFixed(2)} — ${r.win} def. ${r.lose} (${r.wPts.toFixed(2)}–${r.lPts.toFixed(2)}) · ${r.season} · W${r.week}</li>`);
  }

  // ==== Boot + smoke tests ====
  function runTests(){
    const pairs=pairByMu([{matchup_id:1,roster_id:1},{matchup_id:1,roster_id:2},{matchup_id:2,roster_id:3}]);
    console.log('Smoke tests:', [{name:'pair complete', pass: pairs.length===1 && pairs[0].length===2}]);
  }
  async function boot(){
    try{
      $('#status').classList.add('hidden');
      const [lg,us,ro,nfl]=await Promise.all([API.league(),API.users(),API.rosters(),API.state()]);
      app.league=lg; app.users=us; app.rosters=ro; app.week=nfl.week;
      buildLeagueMeta();
      await buildScoreboard();
      buildStandings();
      buildPower();
      await ensureTx();
      wireActivity();
      buildActivity();
      wireWeeklyPrizes();
      await buildWeeklyPrizes();
      show((location.hash||'#home').slice(1));
      if(location.hash.includes('test')) runTests();
    }catch(err){ const s=$('#status'); s.textContent='⚠️ '+(err?.message||'Failed to load')+'. Is the league public?'; s.classList.remove('hidden'); console.error(err); }
  }
  boot();
})();
</script>
</body>
</html>
