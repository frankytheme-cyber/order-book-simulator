import { Engine, Trade } from './engine';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ManipulationType =
  | 'spoofing'
  | 'pump-and-dump'
  | 'bear-raid'
  | 'wash-trading'
  | 'layering';

export interface ManipulationEvent {
  id: string;
  timestamp: number;
  type: 'manipulator' | 'market' | 'phase-change' | 'info';
  description: string;
  highlight?: 'buy' | 'sell' | 'cancel' | 'warning' | 'neutral';
}

export interface ManipulationPhase {
  index: number;
  name: string;
  description: string;
  watchFor: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function randn(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function uid(): string {
  return crypto.randomUUID();
}

export const BASE_PRICE = 100.0;
const STEP = 0.10;
const LEVELS = 10;

export function seedEngine(engine: Engine) {
  const base = engine.getMidPrice() ?? BASE_PRICE;
  const now = Date.now();
  for (let i = 1; i <= LEVELS; i++) {
    engine.addOrder({
      id: uid(),
      side: 'buy',
      price: parseFloat((base - i * STEP).toFixed(2)),
      quantity: Math.floor(Math.random() * 150) + 30,
      timestamp: now + i,
    });
    engine.addOrder({
      id: uid(),
      side: 'sell',
      price: parseFloat((base + i * STEP).toFixed(2)),
      quantity: Math.floor(Math.random() * 150) + 30,
      timestamp: now + 100 + i,
    });
  }
}

export function seedThinEngine(engine: Engine) {
  const base = BASE_PRICE;
  const now = Date.now();
  for (let i = 1; i <= 4; i++) {
    engine.addOrder({
      id: uid(),
      side: 'buy',
      price: parseFloat((base - i * STEP).toFixed(2)),
      quantity: Math.floor(Math.random() * 30) + 5,
      timestamp: now + i,
    });
    engine.addOrder({
      id: uid(),
      side: 'sell',
      price: parseFloat((base + i * STEP).toFixed(2)),
      quantity: Math.floor(Math.random() * 30) + 5,
      timestamp: now + 100 + i,
    });
  }
}

export type Bias = 'neutral' | 'buy-heavy' | 'sell-heavy' | 'none';

/** Ordini per passo generati dagli altri partecipanti (rumore di mercato). */
const NOISE_ORDERS_PER_STEP = 3;

export function generateNoise(engine: Engine, bias: Bias, count = NOISE_ORDERS_PER_STEP): void {
  if (bias === 'none') return;

  const biased = bias !== 'neutral';
  const buyProb = bias === 'buy-heavy' ? 0.8 : bias === 'sell-heavy' ? 0.2 : 0.5;
  // Quando il mercato "reagisce" i partecipanti diventano più aggressivi (più ordini a mercato)
  const marketProb = biased ? 0.35 : 0.15;

  for (let k = 0; k < count; k++) {
    const ref = engine.getMidPrice() ?? engine.getLastPrice() ?? BASE_PRICE;
    const side: 'buy' | 'sell' = Math.random() < buyProb ? 'buy' : 'sell';

    if (Math.random() < marketProb) {
      engine.addMarketOrder(side, Math.floor(Math.random() * (biased ? 50 : 30)) + 1);
    } else {
      const sigma = 0.002;
      // Chi segue il trend quota leggermente più aggressivo dalla propria parte
      const skew = biased ? (side === 'buy' ? 1 : -1) * 0.0008 * ref : 0;
      const price = Math.max(0.01, ref + skew + randn() * sigma * ref);
      engine.addOrder({
        id: uid(),
        side,
        price,
        quantity: Math.floor(Math.random() * 80) + 1,
        timestamp: Date.now(),
      });
    }
  }

  // Auto-reseed se il book è troppo sottile
  if (engine.bids.length < 3 || engine.asks.length < 3) {
    seedEngine(engine);
  }
}

/** Ordine limit del manipolatore. */
function manipLimit(engine: Engine, ctx: ScenarioContext, side: 'buy' | 'sell', price: number, quantity: number): string {
  const id = uid();
  ctx.manipIds.add(id);
  engine.addOrder({ id, side, price, quantity, timestamp: Date.now(), owner: 'manipulator' });
  return id;
}

/**
 * Wash trade: il manipolatore piazza una vendita dentro lo spread e la compra subito lui stesso.
 * Il prezzo viene forzato dentro lo spread così l'acquisto colpisce sicuramente il proprio ordine.
 */
function washTrade(engine: Engine, desiredPrice: number, quantity: number): number | null {
  const bestBid = engine.bids[0]?.price ?? 0;
  const bestAsk = engine.asks[0]?.price ?? Infinity;
  const lo = bestBid + 0.01;
  const hi = bestAsk - 0.01;
  if (lo > hi + 1e-9) return null;
  const price = parseFloat(Math.min(Math.max(desiredPrice, lo), hi).toFixed(2));
  engine.addOrder({ id: uid(), side: 'sell', price, quantity, timestamp: Date.now(), owner: 'manipulator' });
  engine.addOrder({ id: uid(), side: 'buy', price, quantity, timestamp: Date.now(), owner: 'manipulator' });
  return price;
}

// ─── Scenario Definitions ─────────────────────────────────────────────────────

export interface ScenarioContext {
  manipIds: Set<string>;
  stepData: Map<string, unknown>;
}

export interface ScenarioStep {
  phase: number;
  noiseBias: Bias;
  action: (engine: Engine, ctx: ScenarioContext) => ManipulationEvent[];
}

// ─── Azioni del manipolatore ──────────────────────────────────────────────────

function ev(
  type: ManipulationEvent['type'],
  description: string,
  highlight: ManipulationEvent['highlight'],
): ManipulationEvent {
  return { id: uid(), timestamp: Date.now(), type, description, highlight };
}

function fill(trades: Trade[]): { qty: number; avg: number } | null {
  const qty = trades.reduce((s, t) => s + t.quantity, 0);
  if (qty === 0) return null;
  return { qty, avg: trades.reduce((s, t) => s + t.price * t.quantity, 0) / qty };
}

/** Ordine a mercato del manipolatore, con self-trade prevention (non colpisce i propri ordini). */
function manipMarket(engine: Engine, side: 'buy' | 'sell', qty: number): Trade[] {
  return engine.addMarketOrder(side, qty, 'manipulator', true);
}

function passiveIds(ctx: ScenarioContext): Set<string> {
  let set = ctx.stepData.get('passive') as Set<string> | undefined;
  if (!set) { set = new Set(); ctx.stepData.set('passive', set); }
  return set;
}

/**
 * Ordine passivo che migliora di un tick il best bid (o best ask): resta nel book
 * e viene eseguito quando sono gli altri partecipanti ad arrivare a mercato.
 */
function manipPassive(engine: Engine, ctx: ScenarioContext, side: 'buy' | 'sell', qty: number) {
  const bestBid = engine.bids[0]?.price;
  const bestAsk = engine.asks[0]?.price;
  if (bestBid === undefined || bestAsk === undefined || qty <= 0) return;
  let price = side === 'buy' ? bestBid + 0.01 : bestAsk - 0.01;
  if (side === 'buy' && price >= bestAsk) price = bestBid;
  if (side === 'sell' && price <= bestBid) price = bestAsk;
  const id = uid();
  passiveIds(ctx).add(id);
  engine.addOrder({ id, side, price, quantity: qty, timestamp: Date.now(), owner: 'manipulator' });
}

function cancelPassive(engine: Engine, ctx: ScenarioContext) {
  const set = passiveIds(ctx);
  for (const id of set) engine.cancelOrder(id);
  set.clear();
}

/** Quantità già in attesa nel book con ordini passivi su un lato. */
function pendingPassive(engine: Engine, ctx: ScenarioContext, side: 'buy' | 'sell'): number {
  const set = passiveIds(ctx);
  const book = side === 'buy' ? engine.bids : engine.asks;
  return book.filter((o) => set.has(o.id)).reduce((s, o) => s + o.quantity, 0);
}

/** Smonta gradualmente la posizione con ordini passivi, in `stepsLeft` tranche. */
function distribute(engine: Engine, ctx: ScenarioContext, side: 'buy' | 'sell', stepsLeft: number) {
  const pos = engine.getAccount('manipulator').position;
  const toClose = side === 'sell' ? pos : -pos;
  const remaining = toClose - pendingPassive(engine, ctx, side);
  if (remaining <= 0) return;
  manipPassive(engine, ctx, side, Math.ceil(remaining / Math.max(1, stepsLeft)));
}

/** Chiude a mercato una frazione (1/stepsLeft) della posizione residua. */
function unwind(engine: Engine, stepsLeft: number): { qty: number; avg: number } | null {
  const pos = engine.getAccount('manipulator').position;
  if (pos === 0) return null;
  const qty = Math.ceil(Math.abs(pos) / Math.max(1, stepsLeft));
  return fill(manipMarket(engine, pos > 0 ? 'sell' : 'buy', qty));
}

// ── 1. Spoofing ───────────────────────────────────────────────────────────────

const SPOOFING_PHASES: ManipulationPhase[] = [
  {
    index: 0,
    name: 'Mercato normale',
    description: 'Il mercato è in equilibrio. Nel frattempo il manipolatore accumula in silenzio una piccola posizione con ordini passivi sul bid.',
    watchFor: 'Bilanciamento tra bid e ask, spread stabile. Piccoli ordini ambra sul best bid.',
  },
  {
    index: 1,
    name: 'Piazzamento ordini fake',
    description: 'Il manipolatore inserisce ordini bid enormi appena sotto il best bid, creando un muro artificiale di domanda che non intende mai eseguire.',
    watchFor: 'Grandi ordini in ambra sul lato bid. Il depth chart si gonfia sul lato verde.',
  },
  {
    index: 2,
    name: 'Reazione del mercato',
    description: 'Gli altri trader vedono il muro di domanda e credono ci sia forte interesse all\'acquisto. Comprano, spingendo il prezzo verso l\'alto, e il manipolatore vende loro la sua posizione con ordini sul best ask.',
    watchFor: 'Il prezzo sale. Gli ordini ambra passano sul lato ask e vengono eseguiti.',
  },
  {
    index: 3,
    name: 'Cancellazione e profitto',
    description: 'Prima che il muro venga toccato, il manipolatore cancella tutti gli ordini fake e vende a mercato l\'eventuale residuo al prezzo artificialmente gonfiato.',
    watchFor: 'Gli ordini ambra scompaiono di colpo. Il depth chart si sgonfia sul lato bid.',
  },
  {
    index: 4,
    name: 'Risultato',
    description: 'Senza il falso supporto il prezzo torna verso i livelli precedenti. Il manipolatore ha comprato basso e venduto al picco artificiale; chi ha comprato durante la salita resta in perdita.',
    watchFor: 'Il prezzo scende. Confronta il P&L del manipolatore nel pannello.',
  },
];

function buildSpoofingScript(): ScenarioStep[] {
  const script: ScenarioStep[] = [];

  // Phase 0: accumulo passivo (6 passi)
  for (let i = 0; i < 6; i++) {
    script.push({
      phase: 0,
      noiseBias: 'neutral',
      action: (engine, ctx) => {
        manipPassive(engine, ctx, 'buy', Math.floor(Math.random() * 20) + 30);
        return i === 0 ? [ev('manipulator', 'Il manipolatore accumula con piccoli ordini passivi sul best bid, senza muovere il prezzo.', 'buy')] : [];
      },
    });
  }

  // Phase 1: piazzamento 7 ordini fake bid
  for (let i = 0; i < 7; i++) {
    const offset = (i + 1) * STEP;
    script.push({
      phase: 1,
      noiseBias: 'neutral',
      action: (engine, ctx) => {
        if (i === 0) cancelPassive(engine, ctx);
        const ref = engine.getMidPrice() ?? BASE_PRICE;
        const price = parseFloat((ref - offset - 0.05).toFixed(2));
        const qty = Math.floor(Math.random() * 800) + 600;
        manipLimit(engine, ctx, 'buy', price, qty);
        return [ev('manipulator', `Ordine fake bid piazzato: ${qty} unità @ ${price.toFixed(2)}`, 'buy')];
      },
    });
  }

  // Phase 2: reazione del mercato + distribuzione passiva (6 passi)
  for (let i = 0; i < 6; i++) {
    script.push({
      phase: 2,
      noiseBias: 'buy-heavy',
      action: (engine, ctx) => {
        distribute(engine, ctx, 'sell', 6 - i);
        return i === 0 ? [
          ev('market', 'I trader vedono il grande muro bid e iniziano ad acquistare, aspettandosi un rialzo.', 'warning'),
          ev('manipulator', 'Il manipolatore offre la sua posizione sul best ask: sono i compratori a eseguirla.', 'sell'),
        ] : [];
      },
    });
  }

  // Phase 3: cancellazione fake + vendita residuo
  script.push({
    phase: 3,
    noiseBias: 'none',
    action: (engine, ctx) => {
      const canceled = ctx.manipIds.size;
      for (const id of ctx.manipIds) engine.cancelOrder(id);
      ctx.manipIds.clear();
      cancelPassive(engine, ctx);
      return [ev('manipulator', `${canceled} ordini fake cancellati in blocco!`, 'cancel')];
    },
  });
  for (let i = 0; i < 2; i++) {
    script.push({
      phase: 3,
      noiseBias: 'neutral',
      action: (engine) => {
        const r = unwind(engine, 2 - i);
        return r ? [ev('manipulator', `Vendita market del residuo: ${r.qty} unità @ ~${r.avg.toFixed(2)}`, 'sell')] : [];
      },
    });
  }

  // Phase 4: risultato (4 passi)
  for (let i = 0; i < 4; i++) {
    script.push({
      phase: 4,
      noiseBias: 'sell-heavy',
      action: () => i === 0 ? [ev('info', 'Scenario completato. Il falso supporto è sparito e il prezzo ritraccia. Il manipolatore ha venduto in cima, chi ha creduto alla domanda fittizia ha comprato caro.', 'neutral')] : [],
    });
  }

  return script;
}

// ── 2. Pump and Dump ─────────────────────────────────────────────────────────

const PUMP_DUMP_PHASES: ManipulationPhase[] = [
  {
    index: 0,
    name: 'Accumulo silenzioso',
    description: 'Il manipolatore accumula posizioni con ordini limit passivi sul bid, senza muovere il mercato. Nessuno si accorge di nulla.',
    watchFor: 'Ordini ambra sul best bid. Il prezzo rimane stabile.',
  },
  {
    index: 1,
    name: 'Pump: acquisti aggressivi',
    description: 'Il manipolatore compra in modo aggressivo con ordini a mercato, consumando la liquidità lato ask e facendo salire il prezzo.',
    watchFor: 'Il prezzo sale bruscamente. Il lato ask dell\'order book si svuota.',
  },
  {
    index: 2,
    name: 'Euforia (FOMO)',
    description: 'Vedendo il prezzo salire, altri trader comprano per paura di perdere il rialzo (FOMO). Il manipolatore inizia a distribuire: vende a loro, un pezzo alla volta, sul best ask.',
    watchFor: 'Molti buy consecutivi nel trade history. Gli ordini ambra ora stanno sul lato ask.',
  },
  {
    index: 3,
    name: 'Dump: vendita massiccia',
    description: 'Quando la domanda si esaurisce, il manipolatore scarica il resto della posizione con ordini a mercato.',
    watchFor: 'Crollo improvviso del prezzo. Grandi sell nel trade history.',
  },
  {
    index: 4,
    name: 'Risultato',
    description: 'Il prezzo crolla. Chi è entrato durante l\'euforia si ritrova in perdita; il manipolatore ha comprato basso e venduto alto.',
    watchFor: 'Il prezzo scende verso i livelli iniziali. Volume sell dominante.',
  },
];

function buildPumpDumpScript(): ScenarioStep[] {
  const script: ScenarioStep[] = [];

  // Phase 0: accumulo passivo (6 passi)
  for (let i = 0; i < 6; i++) {
    script.push({
      phase: 0,
      noiseBias: 'neutral',
      action: (engine, ctx) => {
        manipPassive(engine, ctx, 'buy', Math.floor(Math.random() * 30) + 50);
        return i === 0 ? [ev('manipulator', 'Accumulo silenzioso: ordini buy limit passivi sul best bid.', 'buy')] : [];
      },
    });
  }

  // Phase 1: pump con 5 market buy
  for (let i = 0; i < 5; i++) {
    script.push({
      phase: 1,
      noiseBias: 'neutral',
      action: (engine, ctx) => {
        if (i === 0) cancelPassive(engine, ctx);
        const qty = Math.floor(Math.random() * 30) + 50;
        const f = fill(manipMarket(engine, 'buy', qty));
        return [ev('manipulator', `Market buy aggressivo: ${qty} unità${f ? ` @ ~${f.avg.toFixed(2)}` : ''} — consumo liquidità ask`, 'buy')];
      },
    });
  }

  // Phase 2: FOMO + distribuzione (8 passi)
  for (let i = 0; i < 8; i++) {
    script.push({
      phase: 2,
      noiseBias: 'buy-heavy',
      action: (engine, ctx) => {
        distribute(engine, ctx, 'sell', 7 - i);
        return i === 0 ? [
          ev('market', 'Effetto FOMO: altri trader vedono il rialzo e comprano, amplificando il movimento.', 'warning'),
          ev('manipulator', 'Distribuzione: il manipolatore vende la posizione a chi compra, sul best ask.', 'sell'),
        ] : [];
      },
    });
  }

  // Phase 3: dump del residuo (4 passi)
  for (let i = 0; i < 4; i++) {
    script.push({
      phase: 3,
      noiseBias: 'sell-heavy',
      action: (engine, ctx) => {
        if (i === 0) cancelPassive(engine, ctx);
        const r = unwind(engine, 4 - i);
        return r ? [ev('manipulator', `DUMP: vendita a mercato di ${r.qty} unità @ ~${r.avg.toFixed(2)}`, 'sell')] : [];
      },
    });
  }

  // Phase 4: risultato (4 passi)
  for (let i = 0; i < 4; i++) {
    script.push({
      phase: 4,
      noiseBias: 'sell-heavy',
      action: () => i === 0 ? [ev('info', 'Scenario completato. Pump & Dump eseguito: i retail hanno comprato al picco, il manipolatore ha venduto.', 'neutral')] : [],
    });
  }

  return script;
}

// ── 3. Bear Raid ─────────────────────────────────────────────────────────────

const BEAR_RAID_PHASES: ManipulationPhase[] = [
  {
    index: 0,
    name: 'Mercato normale',
    description: 'Il mercato è in equilibrio con domanda e offerta bilanciate.',
    watchFor: 'Order book simmetrico, spread stabile.',
  },
  {
    index: 1,
    name: 'Vendita aggressiva',
    description: 'Il manipolatore vende allo scoperto in massa con ordini a mercato, consumando i bid e facendo crollare il prezzo.',
    watchFor: 'Il prezzo scende bruscamente. Il lato bid si svuota.',
  },
  {
    index: 2,
    name: 'Panico generalizzato',
    description: 'Vedendo il prezzo scendere, altri trader vendono in preda al panico. Il manipolatore li aspetta con ordini buy passivi sul best bid e ricompra da loro.',
    watchFor: 'Molti sell consecutivi. Ordini ambra sul lato bid che vengono eseguiti.',
  },
  {
    index: 3,
    name: 'Acquisto a sconto',
    description: 'Il manipolatore chiude il resto della posizione short con acquisti a mercato a prezzi scontati.',
    watchFor: 'Ordini buy nel trade history. Il prezzo smette di scendere.',
  },
  {
    index: 4,
    name: 'Risultato',
    description: 'Il prezzo recupera verso i livelli pre-manipolazione. Il manipolatore ha venduto alto e ricomprato basso; chi ha venduto in panico ha realizzato una perdita.',
    watchFor: 'Il prezzo risale. Confronta il P&L del manipolatore.',
  },
];

function buildBearRaidScript(): ScenarioStep[] {
  const script: ScenarioStep[] = [];

  // Phase 0: normale (5 passi)
  for (let i = 0; i < 5; i++) {
    script.push({ phase: 0, noiseBias: 'neutral', action: () => [] });
  }

  // Phase 1: vendita aggressiva (5 market sell)
  for (let i = 0; i < 5; i++) {
    script.push({
      phase: 1,
      noiseBias: 'neutral',
      action: (engine) => {
        const qty = Math.floor(Math.random() * 30) + 50;
        const f = fill(manipMarket(engine, 'sell', qty));
        return [ev('manipulator', `Vendita aggressiva: ${qty} unità${f ? ` @ ~${f.avg.toFixed(2)}` : ''} — crollo del bid`, 'sell')];
      },
    });
  }

  // Phase 2: panico + ricopertura passiva (8 passi)
  for (let i = 0; i < 8; i++) {
    script.push({
      phase: 2,
      noiseBias: 'sell-heavy',
      action: (engine, ctx) => {
        distribute(engine, ctx, 'buy', 7 - i);
        return i === 0 ? [
          ev('market', 'Panico di mercato: i trader vendono in massa per limitare le perdite.', 'warning'),
          ev('manipulator', 'Il manipolatore ricompra da chi vende in panico con ordini passivi sul best bid.', 'buy'),
        ] : [];
      },
    });
  }

  // Phase 3: chiusura short a mercato (3 passi)
  for (let i = 0; i < 3; i++) {
    script.push({
      phase: 3,
      noiseBias: 'neutral',
      action: (engine, ctx) => {
        if (i === 0) cancelPassive(engine, ctx);
        const r = unwind(engine, 3 - i);
        return r ? [ev('manipulator', `Acquisto a sconto: ${r.qty} unità @ ~${r.avg.toFixed(2)}`, 'buy')] : [];
      },
    });
  }

  // Phase 4: risultato (4 passi)
  for (let i = 0; i < 4; i++) {
    script.push({
      phase: 4,
      noiseBias: 'buy-heavy',
      action: () => i === 0 ? [ev('info', 'Bear Raid completato. Il manipolatore ha venduto alto e ricomprato basso. Il panico ha amplificato il ribasso artificiale.', 'neutral')] : [],
    });
  }

  return script;
}

// ── 4. Wash Trading ───────────────────────────────────────────────────────────

const WASH_TRADING_PHASES: ManipulationPhase[] = [
  {
    index: 0,
    name: 'Mercato illiquido',
    description: 'Il mercato è quasi vuoto: pochi ordini, volume bassissimo, nessuna attività reale. Questo è lo scenario tipico in cui viene usato il wash trading.',
    watchFor: 'Pochissimi ordini nel book. Trade history vuota.',
  },
  {
    index: 1,
    name: 'Trading con sé stesso',
    description: 'Il manipolatore piazza un ordine sell limit a un prezzo specifico, poi subito dopo un buy market order che lo esegue. Crea un trade "con sé stesso".',
    watchFor: 'Trade nel trade history, ma generati artificialmente. Il prezzo aumenta leggermente a ogni ciclo.',
  },
  {
    index: 2,
    name: 'Volume artificiale',
    description: 'Ripetendo il processo molte volte, il trade history si riempie. Il volume appare elevato. Gli indicatori sembrano segnalare un mercato attivo.',
    watchFor: 'La trade history si riempie rapidamente. Il volume cresce in modo anomalo.',
  },
  {
    index: 3,
    name: 'Attrazione di trader reali',
    description: 'Il volume artificiale attira altri trader che pensano ci sia attività genuina. Iniziano a partecipare, portando liquidità vera.',
    watchFor: 'Nuovi ordini da trader "reali" appaiono. Il book si riempie.',
  },
  {
    index: 4,
    name: 'Risultato',
    description: 'I nuovi trader entrano in un mercato manipolato. Il manipolatore può ora uscire con spread favorevole. Il volume era completamente falso.',
    watchFor: 'Il volume reale è una frazione del volume totale mostrato.',
  },
];

function buildWashTradingScript(): ScenarioStep[] {
  const script: ScenarioStep[] = [];

  // Phase 0: mercato illiquido (3 passi)
  for (let i = 0; i < 3; i++) {
    script.push({ phase: 0, noiseBias: 'none', action: () => i === 0 ? [{
      id: uid(), timestamp: Date.now(), type: 'info',
      description: 'Book quasi vuoto. Nessuna attività di mercato rilevante.',
      highlight: 'neutral',
    }] : [] });
  }

  // Phase 1: 5 wash trades (sell limit + buy market)
  for (let i = 0; i < 5; i++) {
    script.push({
      phase: 1,
      noiseBias: 'none',
      action: (engine) => {
        const ref = engine.getMidPrice() ?? engine.getLastPrice() ?? BASE_PRICE;
        const qty = Math.floor(Math.random() * 50) + 20;
        const price = washTrade(engine, ref + 0.01 * (i + 1), qty);
        if (price === null) return [];
        return [{
          id: uid(),
          timestamp: Date.now(),
          type: 'manipulator',
          description: `Wash trade #${i + 1}: sell ${qty}@${price.toFixed(2)} → immediatamente comprato da sé stesso`,
          highlight: 'warning',
        }];
      },
    });
  }

  // Phase 2: volume artificiale (5 più wash trades veloci)
  for (let i = 0; i < 5; i++) {
    script.push({
      phase: 2,
      noiseBias: 'none',
      action: (engine) => {
        const ref = engine.getLastPrice() ?? BASE_PRICE;
        const qty = Math.floor(Math.random() * 80) + 30;
        const price = washTrade(engine, ref + 0.01, qty);
        if (price === null) return [];
        return [{
          id: uid(),
          timestamp: Date.now(),
          type: 'manipulator',
          description: `Volume artificiale: +${qty} scambiati con sé stesso @ ${price.toFixed(2)}`,
          highlight: 'warning',
        }];
      },
    });
  }

  // Phase 3: attrazione trader reali (4 passi con noise)
  for (let i = 0; i < 4; i++) {
    script.push({
      phase: 3,
      noiseBias: 'neutral',
      action: () => i === 0 ? [{
        id: uid(),
        timestamp: Date.now(),
        type: 'market',
        description: 'Trader reali attratti dall\'apparente attività di mercato iniziano a partecipare.',
        highlight: 'neutral',
      }] : [],
    });
  }

  // Phase 4: risultato (3 passi)
  for (let i = 0; i < 3; i++) {
    script.push({
      phase: 4,
      noiseBias: 'neutral',
      action: () => i === 0 ? [{
        id: uid(),
        timestamp: Date.now(),
        type: 'info',
        description: 'Wash Trading completato. Il volume mostrato era quasi interamente artificiale. I nuovi trader entrano in un mercato manipolato.',
        highlight: 'neutral',
      }] : [],
    });
  }

  return script;
}

// ── 5. Layering ───────────────────────────────────────────────────────────────

const LAYERING_PHASES: ManipulationPhase[] = [
  {
    index: 0,
    name: 'Mercato normale',
    description: 'Book bilanciato. Domanda e offerta distribuiti normalmente.',
    watchFor: 'Distribuzione simmetrica ask/bid.',
  },
  {
    index: 1,
    name: 'Layering lato ask',
    description: 'Il manipolatore piazza molteplici grandi ordini sell a prezzi crescenti sopra il best ask, creando l\'illusione di una forte resistenza di vendita.',
    watchFor: 'Muro di grandi ordini ask in ambra. Il depth chart mostra forte resistenza lato sell.',
  },
  {
    index: 2,
    name: 'Pressione ribassista',
    description: 'I trader vedono il muro di vendita e si aspettano che il prezzo non possa salire. Iniziano a vendere, facendo scendere il prezzo, mentre il manipolatore compra da loro con ordini passivi sul bid.',
    watchFor: 'Il prezzo scende. Sell dominanti nel trade history, ordini ambra sul best bid.',
  },
  {
    index: 3,
    name: 'Acquisto e cancellazione layer',
    description: 'Il manipolatore acquista a prezzi depressi con market orders, poi cancella tutti i layer sell finti prima che vengano eseguiti.',
    watchFor: 'Buy market grandi. I layer ambra scompaiono dall\'order book.',
  },
  {
    index: 4,
    name: 'Risultato',
    description: 'Senza il muro di resistenza, il prezzo risale. Il manipolatore ha comprato basso grazie ai layer fake e ora beneficia del rialzo.',
    watchFor: 'Il prezzo sale. L\'order book torna normale.',
  },
];

function buildLayeringScript(): ScenarioStep[] {
  const script: ScenarioStep[] = [];

  // Phase 0: normale (5 passi)
  for (let i = 0; i < 5; i++) {
    script.push({ phase: 0, noiseBias: 'neutral', action: () => [] });
  }

  // Phase 1: piazzamento 6 layer ask
  for (let i = 0; i < 6; i++) {
    const offset = (i + 1) * STEP;
    script.push({
      phase: 1,
      noiseBias: 'neutral',
      action: (engine, ctx) => {
        const ref = engine.getMidPrice() ?? BASE_PRICE;
        const price = parseFloat((ref + offset + 0.05).toFixed(2));
        const qty = Math.floor(Math.random() * 600) + 400;
        manipLimit(engine, ctx, 'sell', price, qty);
        return [{
          id: uid(),
          timestamp: Date.now(),
          type: 'manipulator',
          description: `Layer ask piazzato: ${qty} unità @ ${price.toFixed(2)} — resistenza artificiale`,
          highlight: 'sell',
        }];
      },
    });
  }

  // Phase 2: pressione ribassista (5 passi sell-heavy)
  for (let i = 0; i < 5; i++) {
    script.push({
      phase: 2,
      noiseBias: 'sell-heavy',
      action: (engine, ctx) => {
        manipPassive(engine, ctx, 'buy', Math.floor(Math.random() * 30) + 40);
        return i === 0 ? [
          ev('market', 'Il muro di vendita spaventa i trader: vendono per paura che il prezzo non possa salire.', 'warning'),
          ev('manipulator', 'Il manipolatore raccoglie le vendite con ordini buy passivi sul best bid.', 'buy'),
        ] : [];
      },
    });
  }

  // Phase 3: acquisto + cancellazione layer
  for (let i = 0; i < 4; i++) {
    script.push({
      phase: 3,
      noiseBias: 'none',
      action: (engine, ctx) => {
        const events: ManipulationEvent[] = [];
        if (i === 0) {
          cancelPassive(engine, ctx);
          const qty = Math.floor(Math.random() * 40) + 60;
          const f = fill(manipMarket(engine, 'buy', qty));
          events.push(ev('manipulator', `Acquisto a sconto: ${qty} market buy${f ? ` @ ~${f.avg.toFixed(2)}` : ''} al prezzo depresso`, 'buy'));
        } else {
          // Cancella layer
          const toCancel = [...ctx.manipIds].slice(0, 2);
          for (const id of toCancel) {
            engine.cancelOrder(id);
            ctx.manipIds.delete(id);
          }
          if (toCancel.length > 0) {
            events.push({
              id: uid(), timestamp: Date.now(), type: 'manipulator',
              description: `${toCancel.length} layer ask cancellati — il muro sparisce`,
              highlight: 'cancel',
            });
          }
        }
        return events;
      },
    });
  }
  // Cancella eventuali layer rimasti
  script.push({
    phase: 3,
    noiseBias: 'none',
    action: (engine, ctx) => {
      for (const id of ctx.manipIds) engine.cancelOrder(id);
      const count = ctx.manipIds.size;
      ctx.manipIds.clear();
      return count > 0 ? [{
        id: uid(), timestamp: Date.now(), type: 'manipulator',
        description: `Ultimi ${count} layer rimossi. Il muro è completamente sparito.`,
        highlight: 'cancel',
      }] : [];
    },
  });

  // Phase 4: risultato (5 passi) — senza muro i compratori tornano
  for (let i = 0; i < 5; i++) {
    script.push({
      phase: 4,
      noiseBias: 'buy-heavy',
      action: () => i === 0 ? [{
        id: uid(),
        timestamp: Date.now(),
        type: 'info',
        description: 'Layering completato. Il prezzo risale dopo la rimozione del muro fake. Il manipolatore ha comprato basso grazie alla resistenza artificiale.',
        highlight: 'neutral',
      }] : [],
    });
  }

  return script;
}

// ─── Scenario registry ────────────────────────────────────────────────────────

export const SCENARIO_SCRIPTS: Record<ManipulationType, () => ScenarioStep[]> = {
  spoofing: buildSpoofingScript,
  'pump-and-dump': buildPumpDumpScript,
  'bear-raid': buildBearRaidScript,
  'wash-trading': buildWashTradingScript,
  layering: buildLayeringScript,
};

export const SCENARIO_PHASES: Record<ManipulationType, ManipulationPhase[]> = {
  spoofing: SPOOFING_PHASES,
  'pump-and-dump': PUMP_DUMP_PHASES,
  'bear-raid': BEAR_RAID_PHASES,
  'wash-trading': WASH_TRADING_PHASES,
  layering: LAYERING_PHASES,
};

