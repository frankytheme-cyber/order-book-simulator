export type Side = 'buy' | 'sell';

/** Chi ha inviato l'ordine. `bot` = flusso automatico / liquidità di sfondo. */
export type Owner = 'user' | 'manipulator' | 'bot';

export interface Order {
  id: string;
  side: Side;
  price: number;
  quantity: number;
  timestamp: number;
  owner?: Owner;
  /** Numero di sequenza assegnato dal motore: garantisce la priorità temporale (FIFO). */
  seq?: number;
}

export interface Trade {
  id: string;
  price: number;
  quantity: number;
  buyOrderId: string;
  sellOrderId: string;
  buyOwner: Owner;
  sellOwner: Owner;
  aggressor: Side;
  timestamp: number;
}

export interface Account {
  /** Posizione netta: > 0 long, < 0 short. */
  position: number;
  /** Prezzo medio di carico della posizione aperta. */
  avgPrice: number;
  realizedPnl: number;
  /** Volume eseguito (esclusi i self-trade). */
  volume: number;
  tradeCount: number;
}

export const TICK = 0.01;
/** Numero massimo di trade conservati in memoria (le statistiche restano cumulative). */
export const MAX_TRADES = 5000;

export function roundToTick(price: number): number {
  return parseFloat((Math.round(price / TICK) * TICK).toFixed(2));
}

export function emptyAccount(): Account {
  return { position: 0, avgPrice: 0, realizedPnl: 0, volume: 0, tradeCount: 0 };
}

/** P&L totale (realizzato + non realizzato) valutato al prezzo `mark`. */
export function accountPnl(acc: Account, mark: number | null): { realized: number; unrealized: number; total: number } {
  const unrealized = mark !== null && acc.position !== 0 ? (mark - acc.avgPrice) * acc.position : 0;
  return { realized: acc.realizedPnl, unrealized, total: acc.realizedPnl + unrealized };
}

export class Engine {
  bids: Order[] = [];
  asks: Order[] = [];
  trades: Trade[] = [];

  /** Volume cumulativo di tutta la sessione. */
  totalVolume = 0;
  /** Volume in cui compratore e venditore coincidono (wash trade). */
  selfTradeVolume = 0;
  tradeCount = 0;

  private seq = 0;
  private sumPQ = 0;
  private sumQ = 0;
  private accounts = new Map<Owner, Account>();

  addOrder(order: Order): Trade[] {
    const price = roundToTick(order.price);
    const quantity = Math.floor(order.quantity);
    if (!(price > 0) || !(quantity > 0)) return [];

    const o: Order = { ...order, price, quantity, owner: order.owner ?? 'bot', seq: ++this.seq };
    if (o.side === 'buy') {
      this.bids.splice(this.insertIndex(this.bids, o), 0, o);
    } else {
      this.asks.splice(this.insertIndex(this.asks, o), 0, o);
    }

    const newTrades = this.matchOrders(o.side);
    this.pushTrades(newTrades);
    return newTrades;
  }

  /** Ricerca binaria della posizione: miglior prezzo in testa, a parità di prezzo vince chi è arrivato prima. */
  private insertIndex(book: Order[], o: Order): number {
    const better = o.side === 'buy'
      ? (a: Order) => a.price >= o.price
      : (a: Order) => a.price <= o.price;
    let lo = 0, hi = book.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (better(book[mid])) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  cancelOrder(id: string): boolean {
    const bidIdx = this.bids.findIndex((o) => o.id === id);
    if (bidIdx !== -1) { this.bids.splice(bidIdx, 1); return true; }
    const askIdx = this.asks.findIndex((o) => o.id === id);
    if (askIdx !== -1) { this.asks.splice(askIdx, 1); return true; }
    return false;
  }

  /** Cancella tutti gli ordini di un owner. Restituisce quanti ne ha rimossi. */
  cancelAllByOwner(owner: Owner): number {
    const before = this.bids.length + this.asks.length;
    this.bids = this.bids.filter((o) => o.owner !== owner);
    this.asks = this.asks.filter((o) => o.owner !== owner);
    return before - this.bids.length - this.asks.length;
  }

  getOrdersByOwner(owner: Owner): Order[] {
    return [...this.bids, ...this.asks].filter((o) => o.owner === owner);
  }

  private matchOrders(aggressorSide: Side): Trade[] {
    const result: Trade[] = [];

    while (
      this.bids.length > 0 &&
      this.asks.length > 0 &&
      this.bids[0].price >= this.asks[0].price
    ) {
      const bid = this.bids[0];
      const ask = this.asks[0];
      const tradeQty = Math.min(bid.quantity, ask.quantity);
      // Si esegue sempre al prezzo del maker (l'ordine già presente nel book)
      const tradePrice = aggressorSide === 'buy' ? ask.price : bid.price;

      result.push({
        id: crypto.randomUUID(),
        price: tradePrice,
        quantity: tradeQty,
        buyOrderId: bid.id,
        sellOrderId: ask.id,
        buyOwner: bid.owner ?? 'bot',
        sellOwner: ask.owner ?? 'bot',
        aggressor: aggressorSide,
        timestamp: Date.now(),
      });

      bid.quantity -= tradeQty;
      ask.quantity -= tradeQty;

      if (bid.quantity === 0) this.bids.shift();
      if (ask.quantity === 0) this.asks.shift();
    }

    return result;
  }

  /**
   * Esegue un ordine a mercato consumando il book livello per livello.
   * Con `preventSelfTrade` gli ordini dello stesso owner vengono saltati (self-trade prevention).
   */
  addMarketOrder(side: Side, quantity: number, owner: Owner = 'bot', preventSelfTrade = false): Trade[] {
    let remaining = Math.floor(quantity);
    const result: Trade[] = [];
    const book = side === 'buy' ? this.asks : this.bids;
    let i = 0;

    while (remaining > 0 && i < book.length) {
      const resting = book[i];
      if (preventSelfTrade && resting.owner === owner) { i++; continue; }
      const tradeQty = Math.min(remaining, resting.quantity);
      result.push({
        id: crypto.randomUUID(),
        price: resting.price,
        quantity: tradeQty,
        buyOrderId: side === 'buy' ? 'market' : resting.id,
        sellOrderId: side === 'sell' ? 'market' : resting.id,
        buyOwner: side === 'buy' ? owner : resting.owner ?? 'bot',
        sellOwner: side === 'sell' ? owner : resting.owner ?? 'bot',
        aggressor: side,
        timestamp: Date.now(),
      });
      resting.quantity -= tradeQty;
      if (resting.quantity === 0) book.splice(i, 1);
      remaining -= tradeQty;
    }

    this.pushTrades(result);
    return result;
  }

  private pushTrades(newTrades: Trade[]) {
    if (newTrades.length === 0) return;
    for (const t of newTrades) this.recordTrade(t);
    this.trades.push(...newTrades);
    if (this.trades.length > MAX_TRADES) {
      this.trades.splice(0, this.trades.length - MAX_TRADES);
    }
  }

  private recordTrade(t: Trade) {
    this.sumPQ += t.price * t.quantity;
    this.sumQ += t.quantity;
    this.totalVolume += t.quantity;
    this.tradeCount += 1;

    if (t.buyOwner === t.sellOwner && t.buyOwner !== 'bot') {
      // Self-trade: nessun cambio di posizione reale, solo volume fittizio
      this.selfTradeVolume += t.quantity;
      return;
    }
    this.applyFill(t.buyOwner, t.quantity, t.price);
    this.applyFill(t.sellOwner, -t.quantity, t.price);
  }

  /** Aggiorna posizione e P&L con il metodo del costo medio. `qty` > 0 acquisto, < 0 vendita. */
  private applyFill(owner: Owner, qty: number, price: number) {
    let acc = this.accounts.get(owner);
    if (!acc) { acc = emptyAccount(); this.accounts.set(owner, acc); }
    const pos = acc.position;

    if (pos === 0 || Math.sign(pos) === Math.sign(qty)) {
      const newAbs = Math.abs(pos) + Math.abs(qty);
      acc.avgPrice = (acc.avgPrice * Math.abs(pos) + price * Math.abs(qty)) / newAbs;
      acc.position = pos + qty;
    } else {
      const closing = Math.min(Math.abs(qty), Math.abs(pos));
      acc.realizedPnl += closing * (price - acc.avgPrice) * Math.sign(pos);
      const newPos = pos + qty;
      if (newPos === 0) acc.avgPrice = 0;
      else if (Math.sign(newPos) !== Math.sign(pos)) acc.avgPrice = price; // posizione invertita
      acc.position = newPos;
    }
    acc.volume += Math.abs(qty);
    acc.tradeCount += 1;
  }

  getAccount(owner: Owner): Account {
    const acc = this.accounts.get(owner);
    return acc ? { ...acc } : emptyAccount();
  }

  getSpread(): number {
    if (this.bids.length === 0 || this.asks.length === 0) return 0;
    return this.asks[0].price - this.bids[0].price;
  }

  getMidPrice(): number | null {
    if (this.bids.length === 0 || this.asks.length === 0) return null;
    return (this.bids[0].price + this.asks[0].price) / 2;
  }

  getLastPrice(): number | null {
    return this.trades.at(-1)?.price ?? null;
  }

  /** Prezzo di riferimento per valutare le posizioni: mid, altrimenti ultimo prezzo. */
  getMarkPrice(): number | null {
    return this.getMidPrice() ?? this.getLastPrice();
  }

  getVWAP(): number | null {
    return this.sumQ === 0 ? null : this.sumPQ / this.sumQ;
  }

  getImbalance(): number | null {
    if (this.bids.length === 0 && this.asks.length === 0) return null;
    const bidVol = this.bids.reduce((s, o) => s + o.quantity, 0);
    const askVol = this.asks.reduce((s, o) => s + o.quantity, 0);
    const total = bidVol + askVol;
    if (total === 0) return null;
    return bidVol / total; // 0 = full sell pressure, 1 = full buy pressure, 0.5 = balanced
  }
}
