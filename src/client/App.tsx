import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaTopScrim } from "./shims";
import { api, type ApiResponse } from "./api";
import { dict, fill, type Dict, type Lang } from "./i18n";
const logoEpic = "./assets/logo-epic.webp";

const WHOP_STORE = "https://whop.com/modeloepic";
const WHOP_HOME = "https://whop.com";

type Scores = ApiResponse<typeof api, "getScores">;
type Game = Scores["groups"][number]["games"][number];
type Sport = Scores["sport"];

const SPORT_KEYS: Sport[] = ["futbol", "ncaaf", "nba", "nhl", "mlb"];

// ---------- Idioma (ES por defecto, persistido en localStorage) ----------
const LangCtx = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}>({ lang: "es", setLang: () => {}, t: dict.es });

function useLang() {
  return useContext(LangCtx);
}

function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return window.localStorage.getItem("epic-lang") === "en" ? "en" : "es";
    } catch {
      return "es";
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("epic-lang", lang);
    } catch {
      // sin almacenamiento disponible: el idioma vale solo para esta visita
    }
    document.documentElement.lang = lang;
    document.title = dict[lang].docTitle;
  }, [lang]);
  return (
    <LangCtx.Provider value={{ lang, setLang, t: dict[lang] }}>
      {children}
    </LangCtx.Provider>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function TeamRow({
  name,
  abbr,
  score,
  winner,
  dim,
}: {
  name: string;
  abbr: string;
  score: number | null;
  winner: boolean;
  dim: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className="inline-flex h-6 min-w-10 items-center justify-center rounded bg-[var(--board-surface)] px-1 font-mono text-[11px] font-semibold tracking-wide text-[var(--board-dim)] ring-1 ring-[var(--board-border)]">
        {abbr}
      </span>
      <span
        className={`flex-1 truncate text-sm ${
          winner
            ? "font-semibold text-[var(--board-text)]"
            : dim
              ? "text-[var(--board-dim)]"
              : "text-[var(--board-text)]"
        }`}
      >
        {name}
      </span>
      <span
        className={`font-mono text-base tabular-nums ${
          winner
            ? "font-bold text-[var(--board-text)]"
            : "font-medium text-[var(--board-dim)]"
        }`}
      >
        {score ?? "–"}
      </span>
    </div>
  );
}

function GameRow({ game }: { game: Game }) {
  const { t } = useLang();
  const homeWin =
    game.state === "post" &&
    game.homeScore != null &&
    game.awayScore != null &&
    game.homeScore > game.awayScore;
  const awayWin =
    game.state === "post" &&
    game.homeScore != null &&
    game.awayScore != null &&
    game.awayScore > game.homeScore;
  return (
    <div className="flex gap-3 px-3 py-2">
      <div className="flex w-16 shrink-0 flex-col justify-center">
        {game.state === "in" ? (
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold tracking-wide text-[var(--live)]">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
            {game.detail || t.live}
          </span>
        ) : game.state === "post" ? (
          <span className="font-mono text-[11px] font-semibold tracking-wide text-[var(--board-dim)]">
            {game.detail || t.final}
          </span>
        ) : (
          <span className="font-mono text-[11px] font-semibold text-[var(--board-dim)]">
            {formatTime(game.startTime)}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 divide-y divide-[var(--board-border)]/50">
        <TeamRow
          name={game.awayName}
          abbr={game.awayAbbr}
          score={game.awayScore}
          winner={awayWin}
          dim={game.state === "post" && !awayWin}
        />
        <TeamRow
          name={game.homeName}
          abbr={game.homeAbbr}
          score={game.homeScore}
          winner={homeWin}
          dim={game.state === "post" && !homeWin}
        />
      </div>
    </div>
  );
}

function Scoreboard() {
  const { t } = useLang();
  const [sport, setSport] = useState<Sport>("futbol");
  const queryClient = useQueryClient();
  const scores = useQuery({
    queryKey: ["scores", sport],
    queryFn: () => api.getScores({ sport }),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const totalGames = useMemo(
    () =>
      scores.data?.groups.reduce((acc, g) => acc + g.games.length, 0) ?? 0,
    [scores.data],
  );
  const liveCount = useMemo(
    () =>
      scores.data?.groups.reduce(
        (acc, g) => acc + g.games.filter((game) => game.state === "in").length,
        0,
      ) ?? 0,
    [scores.data],
  );

  return (
    <section aria-label={t.scoresAria} className="bg-[var(--board)]">
      <div className="mx-auto max-w-5xl px-4 pt-5 pb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-[var(--board-text)]">
            {scores.data?.anyLive ? t.scoresTitleLive : t.scoresTitleToday}
          </h2>
          {scores.data?.anyLive ? (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--live)]/15 px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest text-[var(--live)]">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
              {fill(t.livePill, { n: liveCount })}
            </span>
          ) : (
            <span className="rounded-full bg-[var(--board-surface)] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-widest text-[var(--board-dim)] ring-1 ring-[var(--board-border)]">
              {t.todayPill}
            </span>
          )}
          <span className="ml-auto flex items-center gap-3">
            <button
              type="button"
              aria-label={t.refreshAria}
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["scores", sport] })
              }
              className="rounded-full bg-[var(--board-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--board-text)] ring-1 ring-[var(--board-border)] transition hover:bg-[var(--board-border)]/40 active:scale-95"
            >
              {scores.isFetching ? t.refreshing : t.refresh}
            </button>
          </span>
        </div>

        <div
          role="tablist"
          aria-label={t.sportAria}
          className="mt-4 flex flex-wrap gap-1.5 pb-1"
        >
          {SPORT_KEYS.map((key, i) => (
            <button
              key={key}
              role="tab"
              aria-selected={sport === key}
              onClick={() => setSport(key)}
              className={`shrink-0 rounded-full px-4 py-2 font-display text-sm font-bold tracking-wide transition active:scale-95 ${
                sport === key
                  ? "gold-fill "
                  : "bg-[var(--board-surface)] text-[var(--board-dim)] ring-1 ring-[var(--board-border)] hover:text-[var(--board-text)]"
              }`}
            >
              {t.sportsLabels[i]}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {scores.isPending ? (
            <div className="space-y-3" aria-label={t.loadingAria}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-[var(--radius)] bg-[var(--board-surface)] ring-1 ring-[var(--board-border)]"
                />
              ))}
              <p className="text-center font-mono text-xs text-[var(--board-dim)]">
                {t.loadingText}
              </p>
            </div>
          ) : scores.isError ? (
            <div className="rounded-[var(--radius)] bg-[var(--board-surface)] px-4 py-8 text-center ring-1 ring-[var(--board-border)]">
              <p className="text-sm font-medium text-[var(--board-text)]">
                {t.errorTitle}
              </p>
              <p className="mt-1 text-sm text-[var(--board-dim)]">
                {t.errorBody}
              </p>
              <button
                type="button"
                onClick={() => scores.refetch()}
                className="mt-4 rounded-full gold-fill px-4 py-2 text-sm font-semibold  transition active:scale-95"
              >
                {t.retry}
              </button>
            </div>
          ) : totalGames === 0 ? (
            <div className="rounded-[var(--radius)] bg-[var(--board-surface)] px-4 py-8 text-center ring-1 ring-[var(--board-border)]">
              <p className="text-sm text-[var(--board-dim)]">
                {t.emptyNotes[SPORT_KEYS.indexOf(sport)]}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {scores.data?.groups.map((group) => (
                <div
                  key={group.league}
                  className="overflow-hidden rounded-[var(--radius)] bg-[var(--board)] ring-1 ring-[var(--board-border)]"
                >
                  <h3 className="border-b border-[var(--board-border)] bg-[var(--board-surface)] px-3 py-2 font-display text-xs font-bold tracking-widest text-[var(--board-dim)] uppercase">
                    {group.league}
                  </h3>
                  <div className="divide-y divide-[var(--board-border)]/60">
                    {group.games.map((game) => (
                      <GameRow key={game.id} game={game} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 font-mono text-[11px] text-[var(--board-dim)]">
          {t.scoresSource}
        </p>
      </div>
    </section>
  );
}

type BillingMode = "parlay" | "semanal" | "mensual";

const PARLAY_NORMAL = 90;
const PARLAY_PROMO = 60;
const WEEKLY_PRICE = 249;
const MONTHLY_PRICE = 699;
const PACKAGE_WEEKLY = 599;
const PACKAGE_MONTHLY = 1499;

const PROGRAM_NAMES = [
  "Fútbol Epic",
  "NCAAF Epic",
  "NBA Epic",
  "NHL Epic",
  "MLB Epic",
];

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function Plans() {
  const { t } = useLang();
  const [mode, setMode] = useState<BillingMode>("parlay");
  const [selectedSub, setSelectedSub] = useState<string>("Paquete Total Epic");
  const [selectedParlay, setSelectedParlay] = useState<string>("Fútbol Epic");

  const isParlayMode = mode === "parlay";
  const subPrice = mode === "semanal" ? WEEKLY_PRICE : MONTHLY_PRICE;
  const packagePrice = mode === "semanal" ? PACKAGE_WEEKLY : PACKAGE_MONTHLY;
  const periodLabel = mode === "semanal" ? t.perWeek : t.perMonth;
  const modeLabel = mode === "semanal" ? t.tabWeekly : t.tabMonthly;
  const selectedSubPrice =
    selectedSub === "Paquete Total Epic" ? packagePrice : subPrice;

  const tabs: { key: BillingMode; label: string; hint: string }[] = [
    { key: "parlay", label: t.tabParlay, hint: t.tabParlayHint },
    { key: "semanal", label: t.tabWeekly, hint: t.tabWeeklyHint },
    { key: "mensual", label: t.tabMonthly, hint: t.tabMonthlyHint },
  ];

  return (
    <section aria-label={t.plansAria} className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--text)]">
            {t.plansTitle}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--dim)]">
            {t.plansIntroA}
            <strong className="text-[var(--text)]">
              {t.plansIntroStrong1}
            </strong>
            {t.plansIntroB}
            <strong className="text-[var(--text)]">
              {t.plansIntroStrong2}
            </strong>
            {t.plansIntroC}
          </p>
        </div>
        <span className="gold-fill rounded-full px-3 py-1 font-mono text-[11px] font-bold tracking-widest">
          {t.premiumBadge}
        </span>
      </div>

      {/* Selector de modalidad */}
      <div
        role="tablist"
        aria-label={t.billingAria}
        className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-[var(--surface)] p-1 ring-1 ring-[var(--border)] sm:max-w-xl"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={mode === tab.key}
            onClick={() => setMode(tab.key)}
            className={`rounded-full px-2 py-2.5 text-center transition active:scale-[0.98] ${
              mode === tab.key
                ? "bg-[var(--board)] text-[var(--board-text)] shadow-sm ring-1 ring-[var(--accent)]"
                : "text-[var(--dim)] hover:text-[var(--text)]"
            }`}
          >
            <span className="block font-display text-sm font-bold leading-tight">
              {tab.label}
            </span>
            <span className="block font-mono text-[10px] leading-tight text-[var(--board-dim)]">
              {tab.hint}
            </span>
          </button>
        ))}
      </div>

      {mode === "parlay" && (
        <p className="mt-3 max-w-2xl text-sm text-[var(--dim)]">
          <strong className="text-[var(--text)]">{t.modeParlayStrong}</strong>
          {t.modeParlayBody}
        </p>
      )}
      {mode === "semanal" && (
        <p className="mt-3 max-w-2xl text-sm text-[var(--dim)]">
          <strong className="text-[var(--text)]">{t.modeWeeklyStrong}</strong>
          {t.modeWeeklyBodyA}
          <strong className="text-[var(--text)]">$630</strong>
          {t.modeWeeklyBodyB}
        </p>
      )}
      {mode === "mensual" && (
        <p className="mt-3 max-w-2xl text-sm text-[var(--dim)]">
          <strong className="text-[var(--text)]">{t.modeMonthlyStrong}</strong>
          {t.modeMonthlyBody}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {isParlayMode ? (
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROGRAM_NAMES.map((name, i) => (
                <article
                  key={name}
                  className="flex flex-col rounded-[var(--radius)] bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-[var(--text)]">
                      {name}
                    </h3>
                    <span className="rounded-full gold-fill px-2 py-0.5 font-mono text-[10px] font-bold ">
                      {t.promoChip}
                    </span>
                  </div>
                  <p className="mt-1 flex-1 text-sm text-[var(--dim)]">
                    {t.programDescs[i]}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-[var(--dim)]">
                    {t.cardMetaLine}
                  </p>
                  <div className="mt-1.5 flex items-end justify-between gap-2">
                    <p className="font-mono leading-none">
                      <span className="text-sm font-medium text-[var(--dim)] line-through">
                        ${PARLAY_NORMAL}
                      </span>{" "}
                      <span className="text-[22px] font-bold text-[var(--text)]">
                        ${PARLAY_PROMO}
                      </span>
                      <span className="text-xs font-medium text-[var(--dim)]">
                        {t.todaySuffix}
                      </span>
                    </p>
                    <button
                      type="button"
                      aria-label={fill(t.ariaChooseParlay, { name })}
                      aria-pressed={selectedParlay === name}
                      onClick={() => setSelectedParlay(name)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
                        selectedParlay === name
                          ? "bg-[var(--text)] text-[var(--bg)]"
                          : "gold-fill "
                      }`}
                    >
                      {selectedParlay === name ? t.selected : t.select}
                    </button>
                  </div>
                </article>
              ))}
              <article className="flex flex-col justify-center rounded-[var(--radius)] bg-[var(--board)] p-4 ring-1 ring-[var(--board-border)]">
                <h3 className="font-display text-base font-bold text-[var(--board-text)]">
                  {t.crossTitle}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--board-dim)]">
                  {t.crossBody}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("semanal")}
                    className="rounded-full gold-fill px-3.5 py-1.5 text-sm font-semibold  transition active:scale-95"
                  >
                    {t.crossWeeklyBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("mensual")}
                    className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-[var(--board-text)] ring-1 ring-white/15 transition active:scale-95"
                  >
                    {t.crossMonthlyBtn}
                  </button>
                </div>
              </article>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--dim)]">
              {t.parlayFootnote}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {PROGRAM_NAMES.map((name, i) => {
              const contrast =
                mode === "semanal" ? t.contrastWeekly : t.contrastMonthly;
              const alt =
                mode === "semanal"
                  ? fill(t.altWeekly, { price: fmt(MONTHLY_PRICE) })
                  : fill(t.altMonthly, {
                      price: Math.round(MONTHLY_PRICE / 4.33),
                    });
              return (
                <article
                  key={name}
                  className="flex flex-col rounded-[var(--radius)] bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]"
                >
                  <h3 className="font-display text-base font-bold text-[var(--text)]">
                    {name}
                  </h3>
                  <p className="mt-1 flex-1 text-sm text-[var(--dim)]">
                    {t.programDescs[i]}
                  </p>
                  <p className="mt-2 font-mono text-[11px] text-[var(--dim)]">
                    {contrast}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-[var(--dim)]">
                    {alt}
                  </p>
                  <div className="mt-1.5 flex items-end justify-between gap-2">
                    <p className="font-mono text-[22px] font-bold leading-none text-[var(--text)]">
                      ${fmt(subPrice)}
                      <span className="text-xs font-medium text-[var(--dim)]">
                        {periodLabel}
                      </span>
                    </p>
                    <button
                      type="button"
                      aria-label={fill(t.ariaChoosePlan, {
                        name,
                        mode: modeLabel,
                      })}
                      aria-pressed={selectedSub === name}
                      onClick={() => setSelectedSub(name)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
                        selectedSub === name
                          ? "bg-[var(--text)] text-[var(--bg)]"
                          : "gold-fill "
                      }`}
                    >
                      {selectedSub === name ? t.selected : t.select}
                    </button>
                  </div>
                </article>
              );
            })}
            <article className="flex flex-col rounded-[var(--radius)] bg-[var(--board)] p-4 ring-1 ring-[var(--board-border)] sm:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-base font-bold text-[var(--board-text)]">
                  {t.packageName}
                </h3>
                <span className="rounded-full gold-fill px-2 py-0.5 font-mono text-[11px] font-bold ">
                  {t.packageChip}
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--board-text)] ring-1 ring-white/15">
                  {mode === "semanal"
                    ? t.packageSaveWeekly
                    : t.packageSaveMonthly}
                </span>
              </div>
              <p className="mt-1 flex-1 text-sm text-[var(--board-dim)]">
                {t.packageBody}
              </p>
              <p className="mt-2 font-mono text-[11px] text-[var(--board-dim)]">
                {mode === "semanal"
                  ? t.packageSeparateWeekly
                  : t.packageSeparateMonthly}
              </p>
              <div className="mt-1.5 flex items-end justify-between gap-2">
                <p className="font-mono text-[22px] font-bold leading-none text-[var(--board-text)]">
                  ${fmt(packagePrice)}
                  <span className="text-xs font-medium text-[var(--board-dim)]">
                    {periodLabel}
                  </span>
                </p>
                <button
                  type="button"
                  aria-label={fill(t.ariaChoosePlan, {
                    name: t.packageName,
                    mode: modeLabel,
                  })}
                  aria-pressed={selectedSub === "Paquete Total Epic"}
                  onClick={() => setSelectedSub("Paquete Total Epic")}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
                    selectedSub === "Paquete Total Epic"
                      ? "bg-[var(--board-text)] text-[var(--board)]"
                      : "gold-fill "
                  }`}
                >
                  {selectedSub === "Paquete Total Epic" ? t.selected : t.select}
                </button>
              </div>
            </article>
          </div>
        )}

        <aside
          aria-label={t.summaryAria}
          className="h-fit rounded-[var(--radius)] bg-[var(--surface)] p-4 ring-1 ring-[var(--border)] lg:sticky lg:top-4"
        >
          <h3 className="font-display text-sm font-bold tracking-wide text-[var(--text)] uppercase">
            {t.summaryTitle}
          </h3>
          {isParlayMode ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">{t.sumOption}</dt>
                <dd className="font-semibold text-[var(--text)]">
                  {t.tabParlay}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">{t.sumProduct}</dt>
                <dd className="text-right font-semibold text-[var(--text)]">
                  {fill(t.sumProductValue, { name: selectedParlay })}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">{t.sumIncludes}</dt>
                <dd className="text-right font-semibold text-[var(--text)]">
                  {t.sumIncludesParlay}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">{t.sumRegularPrice}</dt>
                <dd className="font-mono font-semibold text-[var(--dim)] line-through">
                  ${PARLAY_NORMAL}.00
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">{t.sumPromo}</dt>
                <dd className="font-mono font-semibold text-[var(--text)]">
                  −$30.00
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-[var(--border)] pt-2">
                <dt className="text-[var(--dim)]">{t.sumOneTime}</dt>
                <dd className="font-mono text-base font-bold text-[var(--text)]">
                  ${PARLAY_PROMO}.00
                </dd>
              </div>
            </dl>
          ) : (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">{t.sumOption}</dt>
                <dd className="font-semibold text-[var(--text)]">
                  {modeLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">{t.sumPlan}</dt>
                <dd className="text-right font-semibold text-[var(--text)]">
                  {selectedSub}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">{t.sumIncludes}</dt>
                <dd className="text-right font-semibold text-[var(--text)]">
                  {t.sumIncludesSub}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">{t.sumPrice}</dt>
                <dd className="font-mono font-semibold text-[var(--text)]">
                  ${fmt(selectedSubPrice)}
                  {periodLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-[var(--border)] pt-2">
                <dt className="text-[var(--dim)]">
                  {mode === "semanal" ? t.sumTotalWeekly : t.sumTotalMonthly}
                </dt>
                <dd className="font-mono text-base font-bold text-[var(--text)]">
                  ${fmt(selectedSubPrice)}.00
                </dd>
              </div>
            </dl>
          )}
          <a
            href={WHOP_STORE}
            target="_blank"
            rel="noreferrer"
            aria-label={
              isParlayMode
                ? fill(t.ariaCtaParlay, { name: selectedParlay })
                : fill(t.ariaCtaPlan, { name: selectedSub, mode: modeLabel })
            }
            className="mt-4 block w-full rounded-full gold-fill py-2.5 text-center text-sm font-bold  transition active:scale-[0.98]"
          >
            {isParlayMode ? t.ctaBuyParlay : t.ctaSubscribe}
          </a>
          <p className="mt-3 rounded-lg bg-[var(--bg)] px-3 py-2 text-xs leading-relaxed text-[var(--dim)]">
            {isParlayMode ? t.payNoteParlay : t.payNoteSub}
          </p>
          <p className="mt-2 text-center font-mono text-[11px] text-[var(--dim)]">
            {isParlayMode ? t.asideNoteParlay : t.asideNoteSub}
          </p>
        </aside>
      </div>

      {/* Cómo funciona — proceso de compra en Whop */}
      <div className="mt-8">
        <h3 className="font-display text-lg font-bold tracking-tight text-[var(--text)]">
          {t.howTitle}
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {t.howSteps.map((s) => (
            <div
              key={s.title}
              className="rounded-[var(--radius)] bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]"
            >
              <h4 className="font-display text-sm font-bold text-[var(--text)]">
                {s.title}
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-[var(--dim)]">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Segunda oportunidad Epic — garantía del parlay comprado */}
      <section
        aria-label={t.secondAria}
        className="mt-8 rounded-[var(--radius)] bg-[var(--board)] p-5 ring-1 ring-[var(--board-border)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="gold-text font-display text-lg font-bold tracking-wide">
            {t.secondTitle}
          </h3>
          <span className="rounded-full gold-fill px-2.5 py-0.5 font-mono text-[11px] font-bold ">
            {t.secondChip}
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--board-text)]">
          {t.secondBody}
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-[var(--board-dim)]">
          {t.secondFine}
        </p>
      </section>

      {/* Qué incluye — refuerza el valor */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {t.features.map((f) => (
          <div
            key={f.title}
            className="rounded-[var(--radius)] bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]"
          >
            <h3 className="font-display text-sm font-bold text-[var(--text)]">
              {f.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--dim)]">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatsData() {
  const { t } = useLang();
  return (
    <section
      aria-label={t.statsAria}
      className="mx-auto max-w-5xl px-4 py-10"
    >
      <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-[var(--accent-bright)]">
        {t.statsEyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[var(--text)]">
        {t.statsTitle}
      </h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--dim)]">
        {t.statsIntro}
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {t.statsItems.map((item) => (
          <div
            key={item.title}
            className="rounded-[var(--radius)] bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]"
          >
            <h3 className="font-display text-sm font-bold text-[var(--text)]">
              {item.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--dim)]">
              {item.body}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-[11px] text-[var(--dim)]">
        {t.statsNote}
      </p>
    </section>
  );
}

function Page() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <SafeAreaTopScrim backgroundColor="var(--board)" />

      <header className="bg-[var(--board)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 pt-5">
          <a
            href={WHOP_HOME}
            target="_blank"
            rel="noreferrer"
            className="ml-auto rounded-full bg-[var(--board-surface)] px-3.5 py-1.5 text-sm font-semibold text-[var(--board-text)] ring-1 ring-[var(--board-border)] transition hover:bg-[var(--board-border)]/40 active:scale-95"
          >
            {t.subscriberLogin}
          </a>
          <div
            role="group"
            aria-label={t.langAria}
            className="flex items-center gap-1 rounded-full bg-[var(--board-surface)] p-1 ring-1 ring-[var(--board-border)]"
          >
            {(["es", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={lang === l}
                onClick={() => setLang(l)}
                className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest transition active:scale-95 ${
                  lang === l
                    ? "gold-fill "
                    : "text-[var(--board-dim)] hover:text-[var(--board-text)]"
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 pt-5 pb-7">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            <img
              src={logoEpic}
              alt={t.logoAlt}
              className="h-44 w-44 shrink-0 rounded-full shadow-[0_0_60px_rgba(201,162,39,0.22)] ring-1 ring-[var(--accent)]/50 sm:h-52 sm:w-52"
            />
            <div className="text-center sm:text-left">
              <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-[var(--accent-bright)]">
                {t.heroEyebrow}
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-wide text-[var(--board-text)] sm:text-4xl">
                {t.heroTitle}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--board-dim)] sm:mx-0">
                {t.heroBody}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t gold-rule" aria-hidden="true" />
      </header>

      <Scoreboard />

      <section
        aria-label={t.recordAria}
        className="mx-auto max-w-5xl px-4 py-10"
      >
        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <p className="gold-text font-display text-5xl font-bold tracking-wide">
              {t.recordBig}
            </p>
            <p className="mt-1 font-mono text-xs tracking-widest text-[var(--dim)] uppercase">
              {t.recordCaption}
            </p>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-[var(--dim)]">
            <p>
              {t.recordP1a}
              <strong className="text-[var(--text)]">
                {t.recordP1strong}
              </strong>
              {t.recordP1b}
            </p>
            <p>
              {t.recordP2a}
              <strong className="text-[var(--text)]">
                {t.recordP2strong}
              </strong>
              {t.recordP2b}
            </p>
          </div>
        </div>
      </section>

      <div className="border-t gold-rule">
        <Plans />
      </div>

      <div className="border-t gold-rule">
        <StatsData />
      </div>

      <footer className="border-t gold-rule">
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-xs leading-relaxed text-[var(--dim)]">
          <p>
            <strong className="text-[var(--text)]">{t.footerAge}</strong>
            {t.footerAbout}
          </p>
          <p>{t.footerResponsible}</p>
          <p className="font-mono text-[11px]">{t.footerSource}</p>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <LangProvider>
      <Page />
    </LangProvider>
  );
}
