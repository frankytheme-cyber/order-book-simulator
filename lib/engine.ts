export interface Order {
  id: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  timestamp: number;
}

export interface Trade {
  id: string;
  price: number;
  quantity: number;
  buyOrderId: string;
  sellOrderId: string;
  timestamp: number;
}

export class Engine {
  bids: Order[] = [];
  asks: Order[] = [];
  trades: Trade[] = [];

  addOrder(order: Order): Trade[] {
    if (order.side === 'buy') {
      this.bids.push(order);
      this.bids.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
    } else {
      this.asks.push(order);
      this.asks.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);
    }

    const newTrades = this.matchOrders(order.side);
    this.trades.push(...newTrades);
    return newTrades;
  }

  private matchOrders(aggressorSide: 'buy' | 'sell'): Trade[] {
    const result: Trade[] = [];

    while (
      this.bids.length > 0 &&
      this.asks.length > 0 &&
      this.bids[0].price >= this.asks[0].price
    ) {
      const bid = this.bids[0];
      const ask = this.asks[0];
      const tradeQty = Math.min(bid.quantity, ask.quantity);
      // Trade executes at the resting (maker) order's price
      const tradePrice = aggressorSide === 'buy' ? ask.price : bid.price;

      const trade: Trade = {
        id: crypto.randomUUID(),
        price: tradePrice,
        quantity: tradeQty,
        buyOrderId: bid.id,
        sellOrderId: ask.id,
        timestamp: Date.now(),
      };

      bid.quantity -= tradeQty;
      ask.quantity -= tradeQty;

      if (bid.quantity === 0) this.bids.shift();
      if (ask.quantity === 0) this.asks.shift();

      result.push(trade);
    }

    return result;
  }

  addMarketOrder(side: 'buy' | 'sell', quantity: number): Trade[] {
    let remaining = quantity;
    const result: Trade[] = [];
    const book = side === 'buy' ? this.asks : this.bids;

    while (remaining > 0 && book.length > 0) {
      const resting = book[0];
      const tradeQty = Math.min(remaining, resting.quantity);
      const trade: Trade = {
        id: crypto.randomUUID(),
        price: resting.price,
        quantity: tradeQty,
        buyOrderId: side === 'buy' ? 'market' : resting.id,
        sellOrderId: side === 'sell' ? 'market' : resting.id,
        timestamp: Date.now(),
      };
      resting.quantity -= tradeQty;
      if (resting.quantity === 0) book.shift();
      remaining -= tradeQty;
      result.push(trade);
    }

    this.trades.push(...result);
    return result;
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

  getVWAP(): number | null {
    if (this.trades.length === 0) return null;
    let sumPQ = 0;
    let sumQ = 0;
    for (const t of this.trades) {
      sumPQ += t.price * t.quantity;
      sumQ += t.quantity;
    }
    return sumQ === 0 ? null : sumPQ / sumQ;
  }
}
