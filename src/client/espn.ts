// Marcadores en vivo desde los feeds públicos de ESPN, ejecutado 100% en el
// navegador del visitante (sin servidor).
//
// Esto es un porte fiel de la lógica que vivía en el servidor del artefacto
// fullstack (server/src/actions.ts, acción getScores): mismos feeds, misma
// normalización, mismo orden (en vivo -> próximos -> finales) y misma fecha
// "de hoy" en America/New_York. La única diferencia: el fetch lo hace el
// cliente directamente contra site.api.espn.com, cuyos endpoints públicos
// responden con `Access-Control-Allow-Origin: *` (verificado el 2026-10-19),
// por lo que no hace falta proxy.
//
// Si ESPN restringiera CORS en el futuro, la alternativa es volver a la
// versión de servidor incluida como referencia en src/server-reference/.

const ESPN = "https://site.api.espn.com/apis/site/v2/sports";

export type SportKey = "futbol" | "ncaaf" | "nba" | "nhl" | "mlb";

type Feed = { league: string; path: string; query?: string };

const FEEDS: Record<SportKey, Feed[]> = {
  futbol: [
    { league: "Champions League", path: "soccer/uefa.champions" },
    { league: "Premier League", path: "soccer/eng.1" },
    { league: "La Liga", path: "soccer/esp.1" },
    { league: "Serie A", path: "soccer/ita.1" },
    { league: "Bundesliga", path: "soccer/ger.1" },
    { league: "Ligue 1", path: "soccer/fra.1" },
    { league: "Eredivisie", path: "soccer/ned.1" },
    { league: "Süper Lig", path: "soccer/tur.1" },
    { league: "Primeira Liga", path: "soccer/por.1" },
  ],
  ncaaf: [{ league: "NCAAF · FBS", path: "football/college-football", query: "groups=80" }],
  nba: [{ league: "NBA", path: "basketball/nba" }],
  nhl: [{ league: "NHL", path: "hockey/nhl" }],
  mlb: [{ league: "MLB", path: "baseball/mlb" }],
};

export interface Game {
  id: string;
  homeName: string;
  homeAbbr: string;
  awayName: string;
  awayAbbr: string;
  homeScore: number | null;
  awayScore: number | null;
  state: "pre" | "in" | "post";
  detail: string;
  startTime: string;
}

export interface ScoresResponse {
  sport: SportKey;
  fetchedAt: string;
  anyLive: boolean;
  groups: { league: string; games: Game[] }[];
}

interface EspnCompetitor {
  homeAway?: string;
  score?: string;
  team?: { displayName?: string; shortDisplayName?: string; abbreviation?: string };
}

interface EspnEvent {
  id?: string;
  date?: string;
  competitions?: {
    competitors?: EspnCompetitor[];
    status?: {
      type?: { state?: string; detail?: string; shortDetail?: string };
      displayClock?: string;
      period?: number;
    };
  }[];
}

function toScore(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function normalizeEvent(ev: EspnEvent): Game | null {
  const comp = ev.competitions?.[0];
  const competitors = comp?.competitors ?? [];
  const home = competitors.find((c) => c.homeAway === "home") ?? competitors[0];
  const away = competitors.find((c) => c.homeAway === "away") ?? competitors[1];
  if (!home || !away) return null;
  const stateRaw = comp?.status?.type?.state;
  const state: Game["state"] =
    stateRaw === "in" ? "in" : stateRaw === "post" ? "post" : "pre";
  const detail =
    state === "post"
      ? (comp?.status?.type?.shortDetail ?? "Final")
      : state === "in"
        ? (comp?.status?.type?.shortDetail ??
          comp?.status?.type?.detail ??
          "En vivo")
        : "";
  return {
    id: String(ev.id ?? `${home.team?.abbreviation}-${away.team?.abbreviation}-${ev.date}`),
    homeName: home.team?.displayName ?? home.team?.shortDisplayName ?? "Local",
    homeAbbr: home.team?.abbreviation ?? "—",
    awayName: away.team?.displayName ?? away.team?.shortDisplayName ?? "Visitante",
    awayAbbr: away.team?.abbreviation ?? "—",
    homeScore: state === "pre" ? null : toScore(home.score),
    awayScore: state === "pre" ? null : toScore(away.score),
    state,
    detail,
    startTime: ev.date ?? "",
  };
}

const STATE_ORDER: Record<Game["state"], number> = { in: 0, pre: 1, post: 2 };

/** Today's date (YYYYMMDD) in America/New_York — the day the board shows. */
function todayET(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}${get("month")}${get("day")}`;
}

async function fetchFeed(feed: Feed): Promise<EspnEvent[]> {
  const params = [feed.query, `dates=${todayET()}`].filter(Boolean).join("&");
  const url = `${ESPN}/${feed.path}/scoreboard?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN ${feed.path}: HTTP ${res.status}`);
  const json = (await res.json()) as { events?: EspnEvent[] };
  return json.events ?? [];
}

export async function getScores(args: { sport: SportKey }): Promise<ScoresResponse> {
  const feeds = FEEDS[args.sport];
  const settled = await Promise.allSettled(feeds.map((f) => fetchFeed(f)));
  const groups: { league: string; games: Game[] }[] = [];
  let failures = 0;
  settled.forEach((result, i) => {
    const feed = feeds[i];
    if (!feed) return;
    if (result.status === "rejected") {
      failures += 1;
      return;
    }
    const games = result.value
      .map(normalizeEvent)
      .filter((g): g is Game => g !== null)
      .sort((a, b) => {
        const byState = STATE_ORDER[a.state] - STATE_ORDER[b.state];
        if (byState !== 0) return byState;
        return a.startTime.localeCompare(b.startTime);
      });
    if (games.length > 0) groups.push({ league: feed.league, games });
  });
  if (failures === feeds.length) {
    throw new Error("No se pudo contactar la fuente de marcadores.");
  }
  return {
    sport: args.sport,
    fetchedAt: new Date().toISOString(),
    anyLive: groups.some((g) => g.games.some((game) => game.state === "in")),
    groups,
  };
}
