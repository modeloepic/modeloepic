import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaTopScrim } from "./shims";
import { api, type ApiResponse } from "./api";
const logoEpic = "./assets/logo-epic.webp";

type Scores = ApiResponse<typeof api, "getScores">;
type Game = Scores["groups"][number]["games"][number];
type Sport = Scores["sport"];

const SPORTS: { key: Sport; label: string; short: string }[] = [
  { key: "futbol", label: "Fútbol", short: "Fútbol" },
  { key: "ncaaf", label: "NCAAF", short: "NCAAF" },
  { key: "nba", label: "NBA", short: "NBA" },
  { key: "nhl", label: "NHL", short: "NHL" },
  { key: "mlb", label: "MLB", short: "MLB" },
];

const EMPTY_NOTES: Record<Sport, string> = {
  futbol: "Hoy no hay partidos en las ligas que cubre el programa de fútbol.",
  ncaaf: "Hoy no hay juegos de fútbol americano colegial FBS.",
  nba: "Hoy no hay juegos de NBA en el calendario.",
  nhl: "Hoy no hay juegos de NHL en el calendario.",
  mlb: "Hoy no hay juegos de MLB en el calendario.",
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function useSecondsAgo(iso: string | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.round((now - then) / 1000));
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
            {game.detail || "EN VIVO"}
          </span>
        ) : game.state === "post" ? (
          <span className="font-mono text-[11px] font-semibold tracking-wide text-[var(--board-dim)]">
            {game.detail || "FINAL"}
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
  const [sport, setSport] = useState<Sport>("futbol");
  const queryClient = useQueryClient();
  const scores = useQuery({
    queryKey: ["scores", sport],
    queryFn: () => api.getScores({ sport }),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
  const secondsAgo = useSecondsAgo(scores.data?.fetchedAt);
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
    <section aria-label="Marcadores en vivo" className="bg-[var(--board)]">
      <div className="mx-auto max-w-5xl px-4 pt-5 pb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="font-display text-xl font-extrabold tracking-tight text-[var(--board-text)]">
            {scores.data?.anyLive ? "Marcadores en vivo" : "Juegos de hoy"}
          </h2>
          {scores.data?.anyLive ? (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--live)]/15 px-2.5 py-1 font-mono text-[11px] font-bold tracking-widest text-[var(--live)]">
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
              EN VIVO · {liveCount}
            </span>
          ) : (
            <span className="rounded-full bg-[var(--board-surface)] px-2.5 py-1 font-mono text-[11px] font-semibold tracking-widest text-[var(--board-dim)] ring-1 ring-[var(--board-border)]">
              JUEGOS DE HOY
            </span>
          )}
          <span className="ml-auto flex items-center gap-3">
            {scores.data && (
              <span className="font-mono text-[11px] text-[var(--board-dim)]">
                {secondsAgo < 5
                  ? "actualizado ahora"
                  : `actualizado hace ${secondsAgo}s`}
              </span>
            )}
            <button
              type="button"
              aria-label="Actualizar marcadores"
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: ["scores", sport] })
              }
              className="rounded-full bg-[var(--board-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--board-text)] ring-1 ring-[var(--board-border)] transition hover:bg-[var(--board-border)]/40 active:scale-95"
            >
              {scores.isFetching ? "Actualizando…" : "Actualizar"}
            </button>
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Deporte"
          className="mt-4 flex flex-wrap gap-1.5 pb-1"
        >
          {SPORTS.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={sport === s.key}
              onClick={() => setSport(s.key)}
              className={`shrink-0 rounded-full px-4 py-2 font-display text-sm font-bold tracking-wide transition active:scale-95 ${
                sport === s.key
                  ? "gold-fill "
                  : "bg-[var(--board-surface)] text-[var(--board-dim)] ring-1 ring-[var(--board-border)] hover:text-[var(--board-text)]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {scores.isPending ? (
            <div className="space-y-3" aria-label="Cargando marcadores">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-[var(--radius)] bg-[var(--board-surface)] ring-1 ring-[var(--board-border)]"
                />
              ))}
              <p className="text-center font-mono text-xs text-[var(--board-dim)]">
                Cargando los juegos de hoy…
              </p>
            </div>
          ) : scores.isError ? (
            <div className="rounded-[var(--radius)] bg-[var(--board-surface)] px-4 py-8 text-center ring-1 ring-[var(--board-border)]">
              <p className="text-sm font-medium text-[var(--board-text)]">
                No se pudieron cargar los marcadores.
              </p>
              <p className="mt-1 text-sm text-[var(--board-dim)]">
                La fuente de datos no respondió. Inténtalo de nuevo.
              </p>
              <button
                type="button"
                onClick={() => scores.refetch()}
                className="mt-4 rounded-full gold-fill px-4 py-2 text-sm font-semibold  transition active:scale-95"
              >
                Reintentar
              </button>
            </div>
          ) : totalGames === 0 ? (
            <div className="rounded-[var(--radius)] bg-[var(--board-surface)] px-4 py-8 text-center ring-1 ring-[var(--board-border)]">
              <p className="text-sm text-[var(--board-dim)]">
                {EMPTY_NOTES[sport]}
              </p>
              <p className="mt-1 font-mono text-[11px] text-[var(--board-dim)]">
                La tabla se actualiza sola cada 60 segundos.
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
          Fuente: ESPN · Se actualiza automáticamente cada 60 segundos.
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

const PROGRAMS: { name: string; desc: string }[] = [
  {
    name: "Fútbol Epic",
    desc: "Parlay diario con 3 selecciones de las 9 ligas que cubre el modelo: Premier, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Süper Lig, Primeira y Champions.",
  },
  {
    name: "NCAAF Epic",
    desc: "Parlay de 3 selecciones en días de juego FBS: spread, totales, récord local/visita y bajas de QB ajustadas en el cálculo.",
  },
  {
    name: "NBA Epic",
    desc: "Parlay diario en días de juego con 3 selecciones. Últimos 10 en casa y fuera por separado, líderes por equipo y bajas de estrellas en la tarjeta.",
  },
  {
    name: "NHL Epic",
    desc: "Temporada 2026-27 ya en curso. Parlay diario en días de juego con 3 selecciones; la variable crítica: el portero titular de cada noche.",
  },
  {
    name: "MLB Epic",
    desc: "Cierre de postemporada 2026 y construcción completa rumbo a 2027. Parlay en días de juego con 3 selecciones; clave: el pitcher abridor.",
  },
];

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function Plans() {
  const [mode, setMode] = useState<BillingMode>("parlay");
  const [selectedSub, setSelectedSub] = useState<string>("Paquete Total Epic");
  const [selectedParlay, setSelectedParlay] = useState<string>("Fútbol Epic");

  const isParlayMode = mode === "parlay";
  const subPrice = mode === "semanal" ? WEEKLY_PRICE : MONTHLY_PRICE;
  const packagePrice = mode === "semanal" ? PACKAGE_WEEKLY : PACKAGE_MONTHLY;
  const periodLabel = mode === "semanal" ? "/semana" : "/mes";
  const selectedSubPrice =
    selectedSub === "Paquete Total Epic" ? packagePrice : subPrice;

  return (
    <section aria-label="Planes y precios" className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-[var(--text)]">
            El parlay del día, o el parlay cada día
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--dim)]">
            El producto Epic es un <strong className="text-[var(--text)]">parlay diario de 3 selecciones con cuota +500 o mayor</strong>,
            uno por deporte en días de juego. Puedes comprarlo suelto o recibirlo
            cada día con suscripción:{" "}
            <strong className="text-[var(--text)]">
              $90 el parlay del día (hoy $60 en promo de lanzamiento), $249/semana o $699/mes por deporte
            </strong>
            . Nada de precios de saldo: esto es selección premium, no volumen.
          </p>
        </div>
        <span className="gold-fill rounded-full px-3 py-1 font-mono text-[11px] font-bold tracking-widest">
          ACCESO PREMIUM
        </span>
      </div>

      {/* Selector de modalidad */}
      <div
        role="tablist"
        aria-label="Forma de pago"
        className="mt-6 grid grid-cols-3 gap-1 rounded-full bg-[var(--surface)] p-1 ring-1 ring-[var(--border)] sm:max-w-xl"
      >
        {(
          [
            { key: "parlay", label: "Parlay del día", hint: "Desde $60 hoy" },
            { key: "semanal", label: "Semanal", hint: "Desde $249 / semana" },
            { key: "mensual", label: "Mensual", hint: "Desde $699 / mes" },
          ] as { key: BillingMode; label: string; hint: string }[]
        ).map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={mode === t.key}
            onClick={() => setMode(t.key)}
            className={`rounded-full px-2 py-2.5 text-center transition active:scale-[0.98] ${
              mode === t.key
                ? "bg-[var(--board)] text-[var(--board-text)] shadow-sm ring-1 ring-[var(--accent)]"
                : "text-[var(--dim)] hover:text-[var(--text)]"
            }`}
          >
            <span className="block font-display text-sm font-bold leading-tight">
              {t.label}
            </span>
            <span className="block font-mono text-[10px] leading-tight text-[var(--board-dim)]">
              {t.hint}
            </span>
          </button>
        ))}
      </div>

      {mode === "parlay" && (
        <p className="mt-3 max-w-2xl text-sm text-[var(--dim)]">
          <strong className="text-[var(--text)]">Parlay del día suelto — $60 hoy (precio normal $90):</strong>{" "}
          precio promocional de lanzamiento para nuevos clientes. Un parlay de
          3 selecciones, cuota +500 o mayor, del deporte que elijas, entregado
          completo antes del primer juego. Sin suscripción ni renovación.
        </p>
      )}
      {mode === "semanal" && (
        <p className="mt-3 max-w-2xl text-sm text-[var(--dim)]">
          <strong className="text-[var(--text)]">Suscripción semanal — $249/semana por deporte:</strong>{" "}
          recibes el parlay diario de ese deporte durante 7 días. El contraste
          es claro: 7 parlays sueltos a $90 serían{" "}
          <strong className="text-[var(--text)]">$630</strong>; con la semanal
          pagas $249. Sin compromiso mensual: renueva solo si te convence.
          Promo de lanzamiento: primeros 3 días de suscripción GRATIS.
        </p>
      )}
      {mode === "mensual" && (
        <p className="mt-3 max-w-2xl text-sm text-[var(--dim)]">
          <strong className="text-[var(--text)]">Suscripción mensual — $699/mes por deporte:</strong>{" "}
          el parlay diario de ese deporte durante todo el mes. Cuatro semanas
          sueltas costarían $996; la mensual sale en $699 y no te pierdes
          ningún parlay. Promo de lanzamiento: primeros 3 días de
          suscripción GRATIS.
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {isParlayMode ? (
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PROGRAMS.map((prog) => (
                <article
                  key={prog.name}
                  className="flex flex-col rounded-[var(--radius)] bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold text-[var(--text)]">
                      {prog.name}
                    </h3>
                    <span className="rounded-full gold-fill px-2 py-0.5 font-mono text-[10px] font-bold ">
                      PROMO −$30
                    </span>
                  </div>
                  <p className="mt-1 flex-1 text-sm text-[var(--dim)]">{prog.desc}</p>
                  <p className="mt-2 font-mono text-[11px] text-[var(--dim)]">
                    3 selecciones · cuota +500 o mayor · 1 parlay por día de juego
                  </p>
                  <div className="mt-1.5 flex items-end justify-between gap-2">
                    <p className="font-mono leading-none">
                      <span className="text-sm font-medium text-[var(--dim)] line-through">
                        ${PARLAY_NORMAL}
                      </span>{" "}
                      <span className="text-[22px] font-bold text-[var(--text)]">
                        ${PARLAY_PROMO}
                      </span>
                      <span className="text-xs font-medium text-[var(--dim)]"> hoy</span>
                    </p>
                    <button
                      type="button"
                      aria-label={`Elegir parlay del día de ${prog.name}`}
                      aria-pressed={selectedParlay === prog.name}
                      onClick={() => setSelectedParlay(prog.name)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
                        selectedParlay === prog.name
                          ? "bg-[var(--text)] text-[var(--bg)]"
                          : "gold-fill "
                      }`}
                    >
                      {selectedParlay === prog.name ? "Elegido" : "Elegir"}
                    </button>
                  </div>
                </article>
              ))}
              <article className="flex flex-col justify-center rounded-[var(--radius)] bg-[var(--board)] p-4 ring-1 ring-[var(--board-border)]">
                <h3 className="font-display text-base font-bold text-[var(--board-text)]">
                  ¿Lo quieres cada día?
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--board-dim)]">
                  7 parlays sueltos serían $630. La suscripción semanal de un
                  deporte cuesta $249 y la mensual $699 — el parlay diario,
                  sin pensar en pagar cada día.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("semanal")}
                    className="rounded-full gold-fill px-3.5 py-1.5 text-sm font-semibold  transition active:scale-95"
                  >
                    Ver semanal · $249
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("mensual")}
                    className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-[var(--board-text)] ring-1 ring-white/15 transition active:scale-95"
                  >
                    Ver mensual · $699
                  </button>
                </div>
              </article>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--dim)]">
              El parlay suelto se vende solo en días de juego de ese deporte y
              nunca de juegos ya empezados. Si el parlay se cancela por
              suspensión de un partido, se repone por otro sin costo.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {PROGRAMS.map((prog) => {
              const contrast =
                mode === "semanal"
                  ? "7 parlays sueltos: $630 · ahorras $381"
                  : "4 semanas sueltas: $996 · ahorras $297";
              const alt =
                mode === "semanal"
                  ? `o $${fmt(MONTHLY_PRICE)}/mes`
                  : `equivale a ~$${Math.round(MONTHLY_PRICE / 4.33)}/semana`;
              return (
                <article
                  key={prog.name}
                  className="flex flex-col rounded-[var(--radius)] bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]"
                >
                  <h3 className="font-display text-base font-bold text-[var(--text)]">
                    {prog.name}
                  </h3>
                  <p className="mt-1 flex-1 text-sm text-[var(--dim)]">{prog.desc}</p>
                  <p className="mt-2 font-mono text-[11px] text-[var(--dim)]">{contrast}</p>
                  <p className="mt-1 font-mono text-[11px] text-[var(--dim)]">{alt}</p>
                  <div className="mt-1.5 flex items-end justify-between gap-2">
                    <p className="font-mono text-[22px] font-bold leading-none text-[var(--text)]">
                      ${fmt(subPrice)}
                      <span className="text-xs font-medium text-[var(--dim)]">
                        {periodLabel}
                      </span>
                    </p>
                    <button
                      type="button"
                      aria-label={`Elegir plan ${prog.name} ${mode}`}
                      aria-pressed={selectedSub === prog.name}
                      onClick={() => setSelectedSub(prog.name)}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
                        selectedSub === prog.name
                          ? "bg-[var(--text)] text-[var(--bg)]"
                          : "gold-fill "
                      }`}
                    >
                      {selectedSub === prog.name ? "Elegido" : "Elegir"}
                    </button>
                  </div>
                </article>
              );
            })}
            <article className="flex flex-col rounded-[var(--radius)] bg-[var(--board)] p-4 ring-1 ring-[var(--board-border)] sm:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-base font-bold text-[var(--board-text)]">
                  Paquete Total Epic
                </h3>
                <span className="rounded-full gold-fill px-2 py-0.5 font-mono text-[11px] font-bold ">
                  LOS 5 DEPORTES
                </span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--board-text)] ring-1 ring-white/15">
                  {mode === "semanal" ? "AHORRAS $646 / SEMANA" : "AHORRAS $1,996 / MES"}
                </span>
              </div>
              <p className="mt-1 flex-1 text-sm text-[var(--board-dim)]">
                Fútbol, NCAAF, NBA, NHL y MLB en una sola suscripción: el
                parlay diario de cada deporte en días de juego, con todas sus
                tarjetas, sin tener que elegir deporte. Promo de lanzamiento:
                primeros 3 días de suscripción GRATIS.
              </p>
              <p className="mt-2 font-mono text-[11px] text-[var(--board-dim)]">
                {mode === "semanal"
                  ? "Por separado serían $1,245/semana"
                  : "Por separado serían $3,495/mes"}
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
                  aria-label={`Elegir plan Paquete Total Epic ${mode}`}
                  aria-pressed={selectedSub === "Paquete Total Epic"}
                  onClick={() => setSelectedSub("Paquete Total Epic")}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95 ${
                    selectedSub === "Paquete Total Epic"
                      ? "bg-[var(--board-text)] text-[var(--board)]"
                      : "gold-fill "
                  }`}
                >
                  {selectedSub === "Paquete Total Epic" ? "Elegido" : "Elegir"}
                </button>
              </div>
            </article>
          </div>
        )}

        <aside
          aria-label="Resumen de la orden"
          className="h-fit rounded-[var(--radius)] bg-[var(--surface)] p-4 ring-1 ring-[var(--border)] lg:sticky lg:top-4"
        >
          <h3 className="font-display text-sm font-bold tracking-wide text-[var(--text)] uppercase">
            Tu orden
          </h3>
          {isParlayMode ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">Modalidad</dt>
                <dd className="font-semibold text-[var(--text)]">Parlay del día</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">Producto</dt>
                <dd className="text-right font-semibold text-[var(--text)]">
                  Parlay del día — {selectedParlay}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">Incluye</dt>
                <dd className="text-right font-semibold text-[var(--text)]">
                  3 selecciones · +500 o mayor
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">Precio normal</dt>
                <dd className="font-mono font-semibold text-[var(--dim)] line-through">
                  ${PARLAY_NORMAL}.00
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">Promo lanzamiento</dt>
                <dd className="font-mono font-semibold text-[var(--text)]">
                  −$30.00
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-[var(--border)] pt-2">
                <dt className="text-[var(--dim)]">Pago único</dt>
                <dd className="font-mono text-base font-bold text-[var(--text)]">
                  ${PARLAY_PROMO}.00
                </dd>
              </div>
            </dl>
          ) : (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">Modalidad</dt>
                <dd className="font-semibold capitalize text-[var(--text)]">
                  {mode}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">Plan</dt>
                <dd className="text-right font-semibold text-[var(--text)]">
                  {selectedSub}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">Incluye</dt>
                <dd className="text-right font-semibold text-[var(--text)]">
                  Parlay diario · 3 selecciones +500
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[var(--dim)]">Precio</dt>
                <dd className="font-mono font-semibold text-[var(--text)]">
                  ${fmt(selectedSubPrice)}
                  {periodLabel}
                </dd>
              </div>
              <div className="flex justify-between gap-2 border-t border-[var(--border)] pt-2">
                <dt className="text-[var(--dim)]">
                  {mode === "semanal" ? "Total semanal" : "Total mensual"}
                </dt>
                <dd className="font-mono text-base font-bold text-[var(--text)]">
                  ${fmt(selectedSubPrice)}.00
                </dd>
              </div>
            </dl>
          )}
          <button
            type="button"
            aria-label={
              isParlayMode
                ? `Continuar al pago del parlay del día de ${selectedParlay}`
                : `Continuar al pago de ${selectedSub} ${mode}`
            }
            className="mt-4 w-full rounded-full gold-fill py-2.5 text-sm font-bold  transition active:scale-[0.98]"
          >
            {isParlayMode ? "Comprar parlay · $60" : "Suscribirme"}
          </button>
          <p className="mt-3 rounded-lg bg-[var(--bg)] px-3 py-2 text-xs leading-relaxed text-[var(--dim)]">
            El pago se procesará con Stripe cuando la cuenta esté conectada.
            Acepta tarjetas de casi todo el mundo, Apple Pay y Google Pay.
            {isParlayMode
              ? " Pago único, sin renovación automática. Promo de lanzamiento para nuevos clientes; precio normal $90."
              : " Sin permanencia: cancelas cuando quieras y no se te cobra el siguiente periodo. Promo de lanzamiento: primeros 3 días de suscripción GRATIS."}
          </p>
          <p className="mt-2 text-center font-mono text-[11px] text-[var(--dim)]">
            {isParlayMode
              ? "¿Lo quieres cada día? Semanal $249 · Mensual $699."
              : "¿Solo quieres el parlay de hoy? Cambia a «Parlay del día» arriba."}
          </p>
        </aside>
      </div>

      {/* Segunda oportunidad Epic — política del parlay suelto */}
      <section
        aria-label="Segunda oportunidad Epic"
        className="mt-8 rounded-[var(--radius)] bg-[var(--board)] p-5 ring-1 ring-[var(--board-border)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="gold-text font-display text-lg font-bold tracking-wide">
            SEGUNDA OPORTUNIDAD EPIC
          </h3>
          <span className="rounded-full gold-fill px-2.5 py-0.5 font-mono text-[11px] font-bold ">
            PARLAY SUELTO
          </span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--board-text)]">
          Si el parlay de hoy no se da, recibes uno totalmente GRATIS al día
          siguiente, del mismo deporte. Así tienes otra oportunidad con
          nosotros, sin volver a pagar.
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-[var(--board-dim)]">
          Aplica una sola vez por parlay suelto comprado: el parlay gratis
          corresponde al día siguiente con juegos de ese deporte. No es una
          promesa de acierto: es una segunda oportunidad para intentarlo con
          el análisis Epic.
        </p>
      </section>

      {/* Qué incluye — refuerza el valor */}
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            title: "Un parlay diario por deporte",
            body: "3 selecciones con cuota combinada +500 o mayor, solo en días de juego. No recibes los 10-18 juegos que analiza el modelo: solo el parlay que el equipo Epic selecciona y firmaría con su nombre.",
          },
          {
            title: "Tarjeta completa por parlay",
            body: "Cada selección del parlay trae probabilidad del modelo, comparación con el mercado, bajas ajustadas, últimos 10 casa/fuera y H2H cuando aplica.",
          },
          {
            title: "Antes del juego, siempre",
            body: "Todo parlay oficial se registra y se entrega antes del inicio. El registro público cuenta todos los oficiales, ganados y perdidos.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-[var(--radius)] bg-[var(--surface)] p-4 ring-1 ring-[var(--border)]"
          >
            <h3 className="font-display text-sm font-bold text-[var(--text)]">
              {f.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--dim)]">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function App() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <SafeAreaTopScrim backgroundColor="var(--board)" />

      <header className="bg-[var(--board)]">
        <div className="mx-auto max-w-5xl px-4 pt-8 pb-7">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
            <img
              src={logoEpic}
              alt="Logo oficial de Epic: la palabra EPIC en letras doradas metálicas rodeada de balones de los cinco deportes en oro y bronce"
              className="h-44 w-44 shrink-0 rounded-full shadow-[0_0_60px_rgba(201,162,39,0.22)] ring-1 ring-[var(--accent)]/50 sm:h-52 sm:w-52"
            />
            <div className="text-center sm:text-left">
              <p className="font-mono text-[11px] font-bold tracking-[0.3em] text-[var(--accent-bright)]">
                EPIC · PICKS CON ESTADÍSTICA REAL
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-wide text-[var(--board-text)] sm:text-4xl">
                Los juegos del día, actualizados solos.
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--board-dim)] sm:mx-0">
                Fútbol, fútbol americano colegial, NBA, NHL y MLB: los
                marcadores de hoy se actualizan solos, y el parlay oficial de
                cada día — 3 selecciones, cuota +500 o mayor — lo elige el
                equipo Epic. No se publica todo lo que analiza el modelo.
              </p>
            </div>
          </div>
        </div>
        <div className="border-t gold-rule" aria-hidden="true" />
      </header>

      <Scoreboard />

      <section
        aria-label="Registro de picks oficiales"
        className="mx-auto max-w-5xl px-4 py-10"
      >
        <div className="grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <p className="gold-text font-display text-5xl font-bold tracking-wide">
              Alto porcentaje
            </p>
            <p className="mt-1 font-mono text-xs tracking-widest text-[var(--dim)] uppercase">
              Registro de picks oficiales
            </p>
          </div>
          <div className="space-y-3 text-sm leading-relaxed text-[var(--dim)]">
            <p>
              De todo lo que el modelo analiza cada jornada, el equipo Epic
              selecciona personalmente los <strong className="text-[var(--text)]">parlays
              oficiales</strong> — 3 selecciones, cuota +500 o mayor —: solo esos
              reciben los suscriptores y solo esos cuentan en el registro
              público de picks oficiales.
            </p>
            <p>
              Cada parlay oficial se registra con fecha y hora,{" "}
              <strong className="text-[var(--text)]">antes de que empiece el juego</strong>,
              y se cuentan todos — los que aciertan y los que fallan. El
              porcentaje exacto se publicará aquí conforme el registro se
              acumule; mientras tanto, no mostramos una cifra que todavía no
              existe.
            </p>
          </div>
        </div>
      </section>

      <div className="border-t gold-rule">
        <Plans />
      </div>

      <footer className="border-t gold-rule">
        <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-xs leading-relaxed text-[var(--dim)]">
          <p>
            <strong className="text-[var(--text)]">Solo para mayores de 18 años.</strong>{" "}
            Este servicio ofrece análisis estadístico y pronósticos deportivos
            con fines informativos y de entretenimiento. Ningún resultado
            pasado garantiza resultados futuros y no prometemos ganancias.
          </p>
          <p>
            Juega con responsabilidad: apuesta solo lo que puedas permitirte
            perder. Si el juego deja de ser diversión, busca ayuda en tu país.
          </p>
          <p className="font-mono text-[11px]">
            Marcadores: ESPN. Los horarios se muestran en tu zona horaria.
          </p>
        </div>
      </footer>
    </div>
  );
}
