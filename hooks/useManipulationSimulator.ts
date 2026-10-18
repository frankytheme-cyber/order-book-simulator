'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Engine, Order, Trade, Account, emptyAccount } from '@/lib/engine';
import {
  ManipulationType,
  ManipulationEvent,
  ManipulationPhase,
  ScenarioContext,
  ScenarioStep,
  SCENARIO_SCRIPTS,
  SCENARIO_PHASES,
  generateNoise,
  seedEngine,
  seedThinEngine,
  uid,
} from '@/lib/manipulation';

// I tipi restano esportati da qui per i componenti che già li importano dal hook
export type { ManipulationType, ManipulationEvent, ManipulationPhase } from '@/lib/manipulation';

export interface ManipulationSimulatorState {
  // Market state
  bids: Order[];
  asks: Order[];
  trades: Trade[];
  lastPrice: number | null;
  vwap: number | null;
  imbalance: number | null;
  markPrice: number | null;

  // Manipulation state
  currentScenario: ManipulationType | null;
  phases: ManipulationPhase[];
  currentPhaseIndex: number;
  events: ManipulationEvent[];
  isPlaying: boolean;
  speed: number;
  /** Ordini del manipolatore attualmente nel book (evidenziati in ambra). */
  manipulatorOrderIds: Set<string>;
  scenarioComplete: boolean;
  /** Posizione e P&L del manipolatore. */
  manipulatorAccount: Account;
  /** Prezzo (mid) all'avvio dello scenario. */
  startPrice: number | null;
  totalVolume: number;
  /** Volume generato da self-trade (wash trading). */
  selfTradeVolume: number;
  stepIndex: number;
  totalSteps: number;

  // Controls
  selectScenario: (type: ManipulationType) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  reset: () => void;
  setSpeed: (ms: number) => void;
}

export function useManipulationSimulator(): ManipulationSimulatorState {
  const engineRef = useRef<Engine | null>(null);
  const scriptRef = useRef<ScenarioStep[]>([]);
  const scenarioRef = useRef<ManipulationType | null>(null);
  const stepIndexRef = useRef(0);
  const manipIdsRef = useRef<Set<string>>(new Set());
  const stepDataRef = useRef<Map<string, unknown>>(new Map());

  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [vwap, setVwap] = useState<number | null>(null);
  const [imbalance, setImbalance] = useState<number | null>(null);
  const [markPrice, setMarkPrice] = useState<number | null>(null);

  const [currentScenario, setCurrentScenario] = useState<ManipulationType | null>(null);
  const [phases, setPhases] = useState<ManipulationPhase[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [events, setEvents] = useState<ManipulationEvent[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [manipulatorOrderIds, setManipulatorOrderIds] = useState<Set<string>>(new Set());
  const [scenarioComplete, setScenarioComplete] = useState(false);
  const [manipulatorAccount, setManipulatorAccount] = useState<Account>(emptyAccount());
  const [startPrice, setStartPrice] = useState<number | null>(null);
  const [totalVolume, setTotalVolume] = useState(0);
  const [selfTradeVolume, setSelfTradeVolume] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);

  const syncState = useCallback((engine: Engine) => {
    setBids([...engine.bids]);
    setAsks([...engine.asks]);
    setTrades([...engine.trades]);
    setLastPrice(engine.getLastPrice());
    setVwap(engine.getVWAP());
    setImbalance(engine.getImbalance());
    setMarkPrice(engine.getMarkPrice());
    setManipulatorAccount(engine.getAccount('manipulator'));
    setManipulatorOrderIds(new Set(engine.getOrdersByOwner('manipulator').map((o) => o.id)));
    setTotalVolume(engine.totalVolume);
    setSelfTradeVolume(engine.selfTradeVolume);
  }, []);

  const addEvents = useCallback((newEvents: ManipulationEvent[]) => {
    if (newEvents.length === 0) return;
    setEvents(prev => [...prev, ...newEvents].slice(-100));
  }, []);

  const executeStep = useCallback(() => {
    const engine = engineRef.current;
    const scenario = scenarioRef.current;
    const script = scriptRef.current;
    if (!engine || !scenario || script.length === 0) return;

    if (stepIndexRef.current >= script.length) {
      setIsPlaying(false);
      setScenarioComplete(true);
      return;
    }

    const step = script[stepIndexRef.current];
    const ctx: ScenarioContext = {
      manipIds: manipIdsRef.current,
      stepData: stepDataRef.current,
    };

    // Cambio di fase
    const prevPhase = stepIndexRef.current > 0 ? script[stepIndexRef.current - 1].phase : -1;
    if (step.phase !== prevPhase && prevPhase !== -1) {
      const phaseInfo = SCENARIO_PHASES[scenario][step.phase];
      addEvents([{
        id: uid(),
        timestamp: Date.now(),
        type: 'phase-change',
        description: phaseInfo ? `▸ ${phaseInfo.name}` : `Fase ${step.phase + 1}`,
        highlight: 'neutral',
      }]);
    }
    setCurrentPhaseIndex(step.phase);

    // Rumore degli altri partecipanti + azione scriptata del manipolatore
    generateNoise(engine, step.noiseBias);
    addEvents(step.action(engine, ctx));

    syncState(engine);
    stepIndexRef.current += 1;
    setStepIndex(stepIndexRef.current);

    if (stepIndexRef.current >= script.length) {
      setIsPlaying(false);
      setScenarioComplete(true);
    }
  }, [addEvents, syncState]);

  // Auto-play interval
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(executeStep, speed);
    return () => clearInterval(interval);
  }, [isPlaying, speed, executeStep]);

  const selectScenario = useCallback((type: ManipulationType) => {
    const engine = new Engine();
    engineRef.current = engine;
    scenarioRef.current = type;
    manipIdsRef.current = new Set();
    stepDataRef.current = new Map();
    stepIndexRef.current = 0;
    scriptRef.current = SCENARIO_SCRIPTS[type]();

    if (type === 'wash-trading') seedThinEngine(engine);
    else seedEngine(engine);

    setCurrentScenario(type);
    setPhases(SCENARIO_PHASES[type]);
    setCurrentPhaseIndex(0);
    setEvents([{
      id: uid(),
      timestamp: Date.now(),
      type: 'phase-change',
      description: `▸ ${SCENARIO_PHASES[type][0].name}`,
      highlight: 'neutral',
    }]);
    setIsPlaying(false);
    setScenarioComplete(false);
    setStartPrice(engine.getMarkPrice());
    setStepIndex(0);
    setTotalSteps(scriptRef.current.length);
    syncState(engine);
  }, [syncState]);

  const play = useCallback(() => {
    if (scenarioComplete || !scenarioRef.current) return;
    setIsPlaying(true);
  }, [scenarioComplete]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause(); else play();
  }, [isPlaying, play, pause]);

  const stepForward = useCallback(() => {
    if (scenarioComplete) return;
    setIsPlaying(false);
    executeStep();
  }, [executeStep, scenarioComplete]);

  const reset = useCallback(() => {
    if (!scenarioRef.current) return;
    selectScenario(scenarioRef.current);
  }, [selectScenario]);

  return {
    bids, asks, trades, lastPrice, vwap, imbalance, markPrice,
    currentScenario, phases, currentPhaseIndex, events,
    isPlaying, speed, manipulatorOrderIds, scenarioComplete,
    manipulatorAccount, startPrice, totalVolume, selfTradeVolume,
    stepIndex, totalSteps,
    selectScenario, play, pause, togglePlay, stepForward, reset, setSpeed,
  };
}
