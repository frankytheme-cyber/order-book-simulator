import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Engine, MAX_TRADES, accountPnl, type Order } from '../lib/engine.ts';

let n = 0;
const ord = (side: 'buy' | 'sell', price: number, quantity: number, owner?: Order['owner']): Order => ({
  id: `o${++n}`, side, price, quantity, timestamp: Date.now(), owner,
});

test('ordini ordinati per prezzo e poi per tempo (FIFO)', () => {
  const e = new Engine();
  e.addOrder(ord('buy', 99, 10));
  e.addOrder(ord('buy', 100, 10));
  const first = ord('buy', 99.5, 10); e.addOrder(first);
  const second = ord('buy', 99.5, 10); e.addOrder(second);
  assert.deepEqual(e.bids.map((o) => o.price), [100, 99.5, 99.5, 99]);
  assert.equal(e.bids[1].id, first.id);
  assert.equal(e.bids[2].id, second.id);
});

test('ordine limit aggressivo esegue al prezzo del maker e lascia il residuo', () => {
  const e = new Engine();
  e.addOrder(ord('sell', 100, 5));
  e.addOrder(ord('sell', 100.1, 5));
  const trades = e.addOrder(ord('buy', 100.1, 12));
  assert.deepEqual(trades.map((t) => [t.price, t.quantity]), [[100, 5], [100.1, 5]]);
  assert.equal(e.asks.length, 0);
  assert.equal(e.bids[0].quantity, 2);
  assert.equal(e.bids[0].price, 100.1);
});

test('prezzi arrotondati al tick e quantità non valide rifiutate', () => {
  const e = new Engine();
  e.addOrder(ord('buy', 99.987, 10));
  assert.equal(e.bids[0].price, 99.99);
  assert.deepEqual(e.addOrder(ord('buy', 100, 0)), []);
  assert.deepEqual(e.addOrder(ord('buy', -1, 10)), []);
  assert.equal(e.bids.length, 1);
});

test('market order attraversa più livelli', () => {
  const e = new Engine();
  e.addOrder(ord('buy', 99, 10));
  e.addOrder(ord('buy', 98, 10));
  const trades = e.addMarketOrder('sell', 15);
  assert.deepEqual(trades.map((t) => [t.price, t.quantity]), [[99, 10], [98, 5]]);
  assert.equal(e.bids[0].quantity, 5);
});

test('VWAP e volume cumulativi', () => {
  const e = new Engine();
  e.addOrder(ord('sell', 100, 10));
  e.addOrder(ord('sell', 102, 10));
  e.addMarketOrder('buy', 20);
  assert.equal(e.getVWAP(), 101);
  assert.equal(e.totalVolume, 20);
});

test('conto per owner: posizione, prezzo medio, P&L realizzato e non', () => {
  const e = new Engine();
  e.addOrder(ord('sell', 100, 10));
  e.addMarketOrder('buy', 10, 'user');           // long 10 @ 100
  e.addOrder(ord('buy', 103, 4));
  e.addMarketOrder('sell', 4, 'user');           // chiude 4 @ 103 → +12
  const acc = e.getAccount('user');
  assert.equal(acc.position, 6);
  assert.equal(acc.avgPrice, 100);
  assert.equal(acc.realizedPnl, 12);
  const pnl = accountPnl(acc, 101);
  assert.equal(pnl.unrealized, 6);
  assert.equal(pnl.total, 18);
  // la controparte (bot) ha P&L opposto
  assert.equal(accountPnl(e.getAccount('bot'), 101).total, -18);
});

test('inversione di posizione da long a short', () => {
  const e = new Engine();
  e.addOrder(ord('sell', 100, 5));
  e.addMarketOrder('buy', 5, 'user');
  e.addOrder(ord('buy', 99, 8));
  e.addMarketOrder('sell', 8, 'user');
  const acc = e.getAccount('user');
  assert.equal(acc.position, -3);
  assert.equal(acc.avgPrice, 99);
  assert.equal(acc.realizedPnl, -5);
});

test('self-trade conteggiato come volume fittizio senza toccare la posizione', () => {
  const e = new Engine();
  e.addOrder(ord('sell', 100, 10, 'manipulator'));
  e.addMarketOrder('buy', 10, 'manipulator');
  assert.equal(e.selfTradeVolume, 10);
  assert.equal(e.getAccount('manipulator').position, 0);
});

test('cancellazione per owner e storico limitato', () => {
  const e = new Engine();
  e.addOrder(ord('buy', 99, 10, 'manipulator'));
  e.addOrder(ord('buy', 98, 10));
  assert.equal(e.cancelAllByOwner('manipulator'), 1);
  assert.equal(e.bids.length, 1);

  for (let i = 0; i < MAX_TRADES + 50; i++) {
    e.addOrder(ord('sell', 100, 1));
    e.addMarketOrder('buy', 1);
  }
  assert.equal(e.trades.length, MAX_TRADES);
  assert.equal(e.tradeCount, MAX_TRADES + 50);
});

test('self-trade prevention salta i propri ordini', () => {
  const e = new Engine();
  e.addOrder(ord('sell', 100, 10, 'manipulator'));
  e.addOrder(ord('sell', 100.1, 10));
  const trades = e.addMarketOrder('buy', 5, 'manipulator', true);
  assert.deepEqual(trades.map((t) => [t.price, t.sellOwner]), [[100.1, 'bot']]);
  assert.equal(e.asks[0].quantity, 10);
  assert.equal(e.selfTradeVolume, 0);
});
