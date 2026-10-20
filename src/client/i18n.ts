// Diccionario i18n de la página Epic (ES por defecto, EN completo).
// Todas las cadenas visibles de App.tsx viven aquí; los componentes solo
// leen del diccionario según el idioma activo (persistido en localStorage).

export type Lang = "es" | "en";

const es = {
  docTitle: "Epic — Parlay Estelar y marcadores de hoy",
  // Encabezado
  logoAlt:
    "Logo oficial de Epic: la palabra EPIC en letras doradas metálicas rodeada de balones de los cinco deportes en oro y bronce",
  subscriberLogin: "Ya soy suscriptor · Entrar",
  langAria: "Idioma / Language",
  heroEyebrow: "EPIC · PICKS CON ESTADÍSTICA REAL",
  heroTitle: "Toda la información disponible a la mano de cada usuario",
  heroBody:
    "Fútbol, fútbol americano colegial, NBA, NHL y MLB: los marcadores de hoy y el Parlay Estelar de cada día — un Parlay con múltiples selecciones para llegar a momios de +400 a +500 — elegido por el equipo Epic. No se publica todo lo que analiza el modelo.",
  // Marcadores
  scoresAria: "Marcadores en vivo",
  scoresTitleLive: "Marcadores en vivo",
  scoresTitleToday: "Juegos de hoy",
  live: "EN VIVO",
  livePill: "EN VIVO · {n}",
  todayPill: "JUEGOS DE HOY",
  final: "FINAL",
  refresh: "Actualizar",
  refreshing: "Actualizando…",
  refreshAria: "Actualizar marcadores",
  sportAria: "Deporte",
  loadingAria: "Cargando marcadores",
  loadingText: "Cargando los juegos de hoy…",
  errorTitle: "No se pudieron cargar los marcadores.",
  errorBody: "La fuente de datos no respondió. Inténtalo de nuevo.",
  retry: "Reintentar",
  scoresSource: "Fuente: ESPN · Marcadores de hoy.",
  sportsLabels: ["Fútbol", "NCAAF", "NBA", "NHL", "MLB"],
  emptyNotes: [
    "Hoy no hay partidos en las ligas que cubre el programa de fútbol.",
    "Hoy no hay juegos de fútbol americano colegial FBS.",
    "Hoy no hay juegos de NBA en el calendario.",
    "Hoy no hay juegos de NHL en el calendario.",
    "Hoy no hay juegos de MLB en el calendario.",
  ],
  // Registro de picks oficiales
  recordAria: "Registro de picks oficiales",
  recordBig: "Alto porcentaje",
  recordCaption: "Registro de picks oficiales",
  recordP1a:
    "De todo lo que el modelo analiza cada jornada, el equipo Epic selecciona personalmente los ",
  recordP1strong: "parlays oficiales",
  recordP1b:
    " — un Parlay con múltiples selecciones para llegar a momios de +400 a +500 —: solo esos reciben los suscriptores y solo esos cuentan en el registro público de picks oficiales.",
  recordP2a: "Cada parlay oficial se registra con fecha y hora, ",
  recordP2strong: "antes de que empiece el juego",
  recordP2b:
    ", y se cuentan todos — los que aciertan y los que fallan. El porcentaje exacto se publicará aquí conforme el registro se acumule; mientras tanto, no mostramos una cifra que todavía no existe.",
  // Planes
  plansAria: "Planes y precios",
  plansTitle: "El Parlay Estelar, hoy o cada día",
  plansIntroA: "El producto Epic es un ",
  plansIntroStrong1:
    "parlay diario con múltiples selecciones y cuota entre +400 y +500",
  plansIntroB:
    ", uno por deporte en días de juego. Puedes comprarlo suelto o recibirlo cada día con suscripción: ",
  plansIntroStrong2:
    "$90 el Parlay Estelar (hoy $60 en promo de lanzamiento), $249/semana o $699/mes por deporte",
  plansIntroC:
    ". Nada de precios de saldo: esto es selección premium, no volumen.",
  premiumBadge: "ACCESO PREMIUM",
  billingAria: "Forma de pago",
  tabParlay: "Parlay Estelar",
  tabParlayHint: "Desde $60 hoy",
  tabWeekly: "Semanal",
  tabWeeklyHint: "Desde $249 / semana",
  tabMonthly: "Mensual",
  tabMonthlyHint: "Desde $699 / mes",
  modeParlayStrong: "Parlay Estelar — acceso único: $60 hoy (precio normal $90):",
  modeParlayBody:
    " precio promocional de lanzamiento para nuevos clientes. Un Parlay con múltiples selecciones para llegar a momios de +400 a +500, del deporte que elijas, entregado completo antes del primer juego. Sin suscripción ni renovación.",
  modeWeeklyStrong: "Suscripción semanal — $249/semana por deporte:",
  modeWeeklyBodyA:
    " recibes el Parlay Estelar de ese deporte durante 7 días. El contraste es claro: 7 parlays sueltos a $90 serían ",
  modeWeeklyBodyB:
    "; con la semanal pagas $249. Sin compromiso mensual: renueva solo si te convence. Promo de lanzamiento: tus primeros 3 días de suscripción GRATIS.",
  modeMonthlyStrong: "Suscripción mensual — $699/mes por deporte:",
  modeMonthlyBody:
    " el Parlay Estelar de ese deporte durante todo el mes. Cuatro semanas sueltas costarían $996; la mensual sale en $699 y no te pierdes ningún parlay. Promo de lanzamiento: tus primeros 3 días de suscripción GRATIS.",
  programDescs: [
    "Parlay diario con múltiples selecciones de las 9 ligas que cubre el modelo: Premier, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Süper Lig, Primeira y Champions.",
    "Parlay con múltiples selecciones en días de juego FBS: spread, totales, récord local/visita y bajas de QB ajustadas en el cálculo.",
    "Parlay diario en días de juego con múltiples selecciones. Últimos 10 en casa y fuera por separado, líderes por equipo y bajas de estrellas en la tarjeta.",
    "Temporada 2026-27 ya en curso. Parlay diario en días de juego con múltiples selecciones; la variable crítica: el portero titular de cada noche.",
    "Cierre de postemporada 2026 y construcción completa rumbo a 2027. Parlay en días de juego con múltiples selecciones; clave: el pitcher abridor.",
  ],
  cardMetaLine:
    "Múltiples selecciones · cuota entre +400 y +500 · 1 parlay por día de juego",
  promoChip: "PROMO −$30",
  todaySuffix: " hoy",
  select: "Elegir",
  selected: "Elegido",
  ariaChooseParlay: "Elegir el Parlay Estelar de {name}",
  ariaChoosePlan: "Elegir plan {name} {mode}",
  crossTitle: "¿Lo quieres cada día?",
  crossBody:
    "7 parlays sueltos serían $630. La suscripción semanal de un deporte cuesta $249 y la mensual $699 — el Parlay Estelar, sin pensar en pagar cada día.",
  crossWeeklyBtn: "Ver semanal · $249",
  crossMonthlyBtn: "Ver mensual · $699",
  parlayFootnote:
    "El Parlay Estelar se vende solo en días de juego de ese deporte y nunca de juegos ya empezados. Si el parlay se cancela por suspensión de un partido, se repone por otro sin costo.",
  contrastWeekly: "7 parlays sueltos: $630 · ahorras $381",
  contrastMonthly: "4 semanas sueltas: $996 · ahorras $297",
  altWeekly: "o ${price}/mes",
  altMonthly: "equivale a ~${price}/semana",
  perWeek: "/semana",
  perMonth: "/mes",
  packageName: "Paquete Total Epic",
  packageChip: "LOS 5 DEPORTES",
  packageSaveWeekly: "AHORRAS $646 / SEMANA",
  packageSaveMonthly: "AHORRAS $1,996 / MES",
  packageBody:
    "Fútbol, NCAAF, NBA, NHL y MLB en una sola suscripción: el Parlay Estelar de cada deporte en días de juego, con todas sus tarjetas, sin tener que elegir deporte. Promo de lanzamiento: tus primeros 3 días de suscripción GRATIS.",
  packageSeparateWeekly: "Por separado serían $1,245/semana",
  packageSeparateMonthly: "Por separado serían $3,495/mes",
  // Resumen de orden
  summaryAria: "Resumen de la orden",
  summaryTitle: "Tu orden",
  sumOption: "Modalidad",
  sumProduct: "Producto",
  sumPlan: "Plan",
  sumIncludes: "Incluye",
  sumRegularPrice: "Precio normal",
  sumPromo: "Promo lanzamiento",
  sumOneTime: "Pago único",
  sumPrice: "Precio",
  sumTotalWeekly: "Total semanal",
  sumTotalMonthly: "Total mensual",
  sumIncludesParlay: "Múltiples selecciones · +400 a +500",
  sumIncludesSub: "Parlay Estelar diario · múltiples selecciones de +400 a +500",
  sumProductValue: "Parlay Estelar — {name}",
  ctaBuyParlay: "Comprar parlay · $60",
  ctaSubscribe: "Suscribirme",
  ariaCtaParlay: "Continuar al pago del Parlay Estelar de {name} en Whop",
  ariaCtaPlan: "Continuar al pago de {name} {mode} en Whop",
  payNoteParlay:
    "El pago se procesa de forma segura en Whop, nuestra tienda oficial. Pago único, sin renovación automática. Promo de lanzamiento para nuevos clientes; precio normal $90. Recibes tu Parlay Estelar dentro de Whop: el mismo día si los juegos aún no han empezado; si ya empezaron, al día siguiente.",
  payNoteSub:
    "El pago se procesa de forma segura en Whop, nuestra tienda oficial. Sin permanencia: cancelas cuando quieras y no se te cobra el siguiente periodo. Promo de lanzamiento: tus primeros 3 días de suscripción GRATIS. Recibes el Parlay Estelar dentro de Whop cada día antes del mediodía ET.",
  asideNoteParlay: "¿Lo quieres cada día? Semanal $249 · Mensual $699.",
  asideNoteSub: "¿Solo quieres el parlay de hoy? Cambia a «Parlay Estelar» arriba.",
  // Proceso de compra (Whop)
  howTitle: "¿Cómo funciona?",
  howSteps: [
    {
      title: "1. Elige tu plan o el Parlay Estelar",
      body: "Selecciona el deporte y la modalidad: Parlay Estelar con acceso único, suscripción semanal, mensual o el Paquete Total Epic.",
    },
    {
      title: "2. Paga seguro en Whop",
      body: "El cobro se hace en nuestra tienda oficial de Whop, con pago protegido. Sin registros raros ni intermediarios.",
    },
    {
      title: "3. Recibe tus picks dentro de Whop",
      body: "Los parlays salen cada día antes del mediodía ET y los recibes dentro de Whop: el mismo día si los juegos aún no han empezado; si ya empezaron, al día siguiente.",
    },
  ],
  // Segunda oportunidad
  secondAria: "Segunda oportunidad Epic",
  secondTitle: "SEGUNDA OPORTUNIDAD EPIC",
  secondChip: "PARLAY ESTELAR",
  secondBody:
    "Si el Parlay Estelar de hoy no se da, recibes UN parlay adicional totalmente GRATIS, del mismo deporte. Así tienes otra oportunidad con nosotros, sin volver a pagar.",
  secondFine:
    "Aplica una sola vez por parlay comprado: el parlay adicional corresponde al siguiente día con juegos de ese deporte. No es una promesa de acierto: es una segunda oportunidad para intentarlo con el análisis Epic.",
  // Qué incluye
  features: [
    {
      title: "Un Parlay Estelar diario por deporte",
      body: "Un Parlay con múltiples selecciones para llegar a momios de +400 a +500, solo en días de juego. No recibes los 10-18 juegos que analiza el modelo: solo el parlay que el equipo Epic selecciona y firmaría con su nombre.",
    },
    {
      title: "Tarjeta completa por parlay",
      body: "Cada selección del parlay trae probabilidad del modelo, comparación con el mercado, bajas ajustadas, últimos 10 casa/fuera y H2H cuando aplica.",
    },
    {
      title: "Antes del juego, siempre",
      body: "Todo parlay oficial se registra y se entrega antes del inicio. El registro público cuenta todos los oficiales, ganados y perdidos.",
    },
  ],
  // Datos estadísticos (solo suscriptores)
  statsAria: "Datos estadísticos de cada juego",
  statsEyebrow: "SOLO PARA SUSCRIPTORES",
  statsTitle: "Datos estadísticos de cada juego",
  statsIntro:
    "Con tu suscripción no recibes solo el parlay: recibes la tarjeta completa de cada juego que lo compone, con los datos que el modelo Epic usa para decidir.",
  statsItems: [
    {
      title: "Probabilidades del modelo",
      body: "1X2, moneyline y totales con la probabilidad calculada por el modelo, sin inflar.",
    },
    {
      title: "Forma y rachas",
      body: "Últimos resultados, racha actual y goles a favor y en contra de cada equipo.",
    },
    {
      title: "Últimos 10 resultados",
      body: "Los 10 juegos más recientes de cada equipo, con marcador, para ver el momento real.",
    },
    {
      title: "Récord local / visita por separado",
      body: "El rendimiento como local y como visitante en columnas distintas: no es lo mismo jugar en casa que fuera.",
    },
    {
      title: "Últimos 5 enfrentamientos directos",
      body: "El historial H2H entre ambos equipos y si confirma o contradice la dirección del pick.",
    },
    {
      title: "Bajas clave y su impacto",
      body: "Las ausencias importantes van en la tarjeta y ajustan el cálculo: un QB o un goleador fuera cambia los números, no es solo una nota.",
    },
    {
      title: "Brecha modelo vs mercado",
      body: "Dónde coincide el modelo con el mercado y dónde no: las líneas más sólidas son las de brecha más pequeña.",
    },
    {
      title: "Goles, totales y córners",
      body: "En fútbol: goles esperados, líneas de totales y córners calculados con los últimos 5 juegos de liga local de cada equipo.",
    },
  ],
  statsNote:
    "Aplican según el deporte: fútbol (8 ligas locales + Champions), NCAAF, NBA, NHL y MLB.",
  // Pie
  footerAge: "Solo para mayores de 18 años.",
  footerAbout:
    " Este servicio ofrece análisis estadístico y pronósticos deportivos con fines informativos y de entretenimiento. Ningún resultado pasado garantiza resultados futuros y no prometemos ganancias.",
  footerResponsible:
    "Juega con responsabilidad: apuesta solo lo que puedas permitirte perder. Si el juego deja de ser diversión, busca ayuda en tu país.",
  footerSource: "Marcadores: ESPN. Los horarios se muestran en tu zona horaria.",
};

export type Dict = typeof es;

const en: Dict = {
  docTitle: "Epic — Parlay Estelar and today's scores",
  logoAlt:
    "Official Epic logo: the word EPIC in metallic gold letters surrounded by balls from the five sports in gold and bronze",
  subscriberLogin: "I'm already a subscriber · Log in",
  langAria: "Language / Idioma",
  heroEyebrow: "EPIC · PICKS BACKED BY REAL STATISTICS",
  heroTitle: "All the information available at every user's fingertips",
  heroBody:
    "Soccer, college football, NBA, NHL and MLB: today's scores and each day's Parlay Estelar — a parlay with multiple selections built to reach +400 to +500 odds — picked by the Epic team. We don't publish everything the model analyzes.",
  scoresAria: "Live scores",
  scoresTitleLive: "Live scores",
  scoresTitleToday: "Today's games",
  live: "LIVE",
  livePill: "LIVE · {n}",
  todayPill: "TODAY'S GAMES",
  final: "FINAL",
  refresh: "Refresh",
  refreshing: "Refreshing…",
  refreshAria: "Refresh scores",
  sportAria: "Sport",
  loadingAria: "Loading scores",
  loadingText: "Loading today's games…",
  errorTitle: "We couldn't load the scores.",
  errorBody: "The data source didn't respond. Please try again.",
  retry: "Retry",
  scoresSource: "Source: ESPN · Today's scores.",
  sportsLabels: ["Soccer", "NCAAF", "NBA", "NHL", "MLB"],
  emptyNotes: [
    "There are no games today in the leagues covered by the soccer program.",
    "There are no FBS college football games today.",
    "There are no NBA games on today's schedule.",
    "There are no NHL games on today's schedule.",
    "There are no MLB games on today's schedule.",
  ],
  recordAria: "Official picks record",
  recordBig: "High hit rate",
  recordCaption: "Official picks record",
  recordP1a:
    "From everything the model analyzes each day, the Epic team personally selects the ",
  recordP1strong: "official parlays",
  recordP1b:
    " — a parlay with multiple selections built to reach +400 to +500 odds —: only those go to subscribers and only those count in the public official picks record.",
  recordP2a: "Every official parlay is logged with date and time, ",
  recordP2strong: "before the game starts",
  recordP2b:
    ", and every one counts — the winners and the losers. The exact percentage will be published here as the record builds; until then, we won't show a number that doesn't exist yet.",
  plansAria: "Plans and pricing",
  plansTitle: "The Parlay Estelar, today or every day",
  plansIntroA: "The Epic product is a ",
  plansIntroStrong1: "daily parlay with multiple selections at +400 to +500 odds",
  plansIntroB:
    ", one per sport on game days. Buy it on its own or get it every day with a subscription: ",
  plansIntroStrong2:
    "the Parlay Estelar is $90 (today $60 launch promo), $249/week or $699/month per sport",
  plansIntroC: ". No bargain-bin pricing: this is premium selection, not volume.",
  premiumBadge: "PREMIUM ACCESS",
  billingAria: "Billing option",
  tabParlay: "Parlay Estelar",
  tabParlayHint: "From $60 today",
  tabWeekly: "Weekly",
  tabWeeklyHint: "From $249 / week",
  tabMonthly: "Monthly",
  tabMonthlyHint: "From $699 / month",
  modeParlayStrong: "Parlay Estelar — single access: $60 today (regular price $90):",
  modeParlayBody:
    " launch promo price for new customers. A parlay with multiple selections built to reach +400 to +500 odds, for the sport you choose, delivered in full before the first game. No subscription, no renewal.",
  modeWeeklyStrong: "Weekly subscription — $249/week per sport:",
  modeWeeklyBodyA:
    " you get that sport's Parlay Estelar for 7 days. The math is clear: 7 single parlays at $90 would be ",
  modeWeeklyBodyB:
    "; with the weekly plan you pay $249. No monthly commitment: renew only if it convinces you. Launch promo: your first 3 days of subscription FREE.",
  modeMonthlyStrong: "Monthly subscription — $699/month per sport:",
  modeMonthlyBody:
    " that sport's Parlay Estelar all month long. Four separate weeks would cost $996; the monthly plan is $699 and you won't miss a single parlay. Launch promo: your first 3 days of subscription FREE.",
  programDescs: [
    "Daily parlay with multiple selections from the 9 leagues the model covers: Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Eredivisie, Süper Lig, Primeira Liga and the Champions League.",
    "Parlay with multiple selections on FBS game days: spread, totals, home/away record and QB absences adjusted in the calculation.",
    "Daily parlay on game days with multiple selections. Last 10 at home and away shown separately, team leaders and star absences on the card.",
    "The 2026-27 season is already underway. Daily parlay on game days with multiple selections; the critical variable: each night's starting goalie.",
    "The close of the 2026 postseason and a full build toward 2027. Parlay on game days with multiple selections; the key: the starting pitcher.",
  ],
  cardMetaLine: "Multiple selections · +400 to +500 odds · 1 parlay per game day",
  promoChip: "PROMO −$30",
  todaySuffix: " today",
  select: "Select",
  selected: "Selected",
  ariaChooseParlay: "Select the {name} Parlay Estelar",
  ariaChoosePlan: "Select the {name} {mode} plan",
  crossTitle: "Want it every day?",
  crossBody:
    "7 single parlays would be $630. A weekly subscription for one sport is $249 and the monthly is $699 — the Parlay Estelar, without thinking about paying every day.",
  crossWeeklyBtn: "See weekly · $249",
  crossMonthlyBtn: "See monthly · $699",
  parlayFootnote:
    "The Parlay Estelar is sold only on that sport's game days and never for games that have already started. If the parlay is cancelled because a game is suspended, it is replaced with another at no cost.",
  contrastWeekly: "7 single parlays: $630 · you save $381",
  contrastMonthly: "4 separate weeks: $996 · you save $297",
  altWeekly: "or ${price}/month",
  altMonthly: "works out to ~${price}/week",
  perWeek: "/week",
  perMonth: "/month",
  packageName: "Paquete Total Epic",
  packageChip: "ALL 5 SPORTS",
  packageSaveWeekly: "YOU SAVE $646 / WEEK",
  packageSaveMonthly: "YOU SAVE $1,996 / MONTH",
  packageBody:
    "Soccer, NCAAF, NBA, NHL and MLB in a single subscription: each sport's Parlay Estelar on game days, with all its cards, no need to pick a sport. Launch promo: your first 3 days of subscription FREE.",
  packageSeparateWeekly: "Separately it would be $1,245/week",
  packageSeparateMonthly: "Separately it would be $3,495/month",
  summaryAria: "Order summary",
  summaryTitle: "Your order",
  sumOption: "Option",
  sumProduct: "Product",
  sumPlan: "Plan",
  sumIncludes: "Includes",
  sumRegularPrice: "Regular price",
  sumPromo: "Launch promo",
  sumOneTime: "One-time payment",
  sumPrice: "Price",
  sumTotalWeekly: "Weekly total",
  sumTotalMonthly: "Monthly total",
  sumIncludesParlay: "Multiple selections · +400 to +500",
  sumIncludesSub: "Daily Parlay Estelar · multiple selections at +400 to +500",
  sumProductValue: "Parlay Estelar — {name}",
  ctaBuyParlay: "Buy parlay · $60",
  ctaSubscribe: "Subscribe",
  ariaCtaParlay: "Continue to Whop checkout for the {name} Parlay Estelar",
  ariaCtaPlan: "Continue to Whop checkout for the {name} {mode} plan",
  payNoteParlay:
    "Payment is processed securely on Whop, our official store. One-time payment, no automatic renewal. Launch promo for new customers; regular price $90. You receive your Parlay Estelar inside Whop: the same day if the games haven't started yet; if they have, the next day.",
  payNoteSub:
    "Payment is processed securely on Whop, our official store. No lock-in: cancel anytime and you won't be charged for the next period. Launch promo: your first 3 days of subscription FREE. You receive the Parlay Estelar inside Whop every day before noon ET.",
  asideNoteParlay: "Want it every day? Weekly $249 · Monthly $699.",
  asideNoteSub: "Only want today's parlay? Switch to “Parlay Estelar” above.",
  howTitle: "How it works",
  howSteps: [
    {
      title: "1. Choose your plan or the Parlay Estelar",
      body: "Pick your sport and option: a Parlay Estelar with single access, a weekly or monthly subscription, or the Paquete Total Epic.",
    },
    {
      title: "2. Pay securely on Whop",
      body: "Checkout happens in our official Whop store, with secure payment. No sketchy signups or middlemen.",
    },
    {
      title: "3. Get your picks inside Whop",
      body: "Parlays go out every day before noon ET and you receive them inside Whop: the same day if the games haven't started yet; if they have, the next day.",
    },
  ],
  secondAria: "Epic Second Chance",
  secondTitle: "EPIC SECOND CHANCE",
  secondChip: "PARLAY ESTELAR",
  secondBody:
    "If today's Parlay Estelar doesn't hit, you get ONE additional parlay completely FREE, in the same sport. One more shot with us, without paying again.",
  secondFine:
    "Applies once per parlay purchased: the additional parlay is for the next day with games in that sport. It is not a promise of a win: it is a second chance to try again with the Epic analysis.",
  features: [
    {
      title: "One daily Parlay Estelar per sport",
      body: "A parlay with multiple selections built to reach +400 to +500 odds, on game days only. You don't get the 10-18 games the model analyzes: only the parlay the Epic team selects and would sign its name to.",
    },
    {
      title: "A full card for every parlay",
      body: "Every selection in the parlay comes with the model's probability, market comparison, adjusted absences, last 10 home/away and head-to-head when applicable.",
    },
    {
      title: "Before the game, always",
      body: "Every official parlay is logged and delivered before kickoff. The public record counts all of them, won and lost.",
    },
  ],
  statsAria: "Statistical data for every game",
  statsEyebrow: "SUBSCRIBERS ONLY",
  statsTitle: "Statistical data for every game",
  statsIntro:
    "Your subscription doesn't just include the parlay: you get the full card for every game in it, with the data the Epic model uses to decide.",
  statsItems: [
    {
      title: "Model probabilities",
      body: "1X2, moneyline and totals with the probability calculated by the model, never inflated.",
    },
    {
      title: "Form and streaks",
      body: "Recent results, current streak and goals for and against for each team.",
    },
    {
      title: "Last 10 results",
      body: "Each team's 10 most recent games, with scores, so you can see their real form.",
    },
    {
      title: "Home / away record, separately",
      body: "Home and away performance in separate columns: playing at home is not the same as playing on the road.",
    },
    {
      title: "Last 5 head-to-head meetings",
      body: "The H2H history between both teams and whether it backs or contradicts the direction of the pick.",
    },
    {
      title: "Key absences and their impact",
      body: "Important absences appear on the card and adjust the calculation: a QB or a top scorer being out changes the numbers, it's not just a note.",
    },
    {
      title: "Model vs. market gap",
      body: "Where the model agrees with the market and where it doesn't: the most solid lines are the ones with the smallest gap.",
    },
    {
      title: "Goals, totals and corners",
      body: "In soccer: expected goals, totals lines and corners calculated from each team's last 5 home league games.",
    },
  ],
  statsNote:
    "Applied per sport: soccer (8 domestic leagues + Champions League), NCAAF, NBA, NHL and MLB.",
  footerAge: "Adults 18+ only.",
  footerAbout:
    " This service offers statistical analysis and sports picks for information and entertainment purposes. Past results do not guarantee future results and we do not promise winnings.",
  footerResponsible:
    "Play responsibly: only bet what you can afford to lose. If gambling stops being fun, seek help in your country.",
  footerSource: "Scores: ESPN. Times are shown in your time zone.",
};

export const dict: Record<Lang, Dict> = { es, en };

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] === undefined ? `{${k}}` : String(vars[k]),
  );
}
