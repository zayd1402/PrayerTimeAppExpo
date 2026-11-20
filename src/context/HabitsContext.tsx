// Habits anchored to prayers, and which were done on which day. Today and Journey both read
// this, so ticking a habit on one shows on the other straight away.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Habit, HabitDraft, HabitLog, MAX_PER_PRAYER } from '../design/journey';
import { loadHabitLog, loadHabits, loadLadderLevel, saveHabitLog, saveHabits, saveLadderLevel } from '../services/StorageService';
import { getLocalDateKey } from '../utils/date';

interface HabitsValue {
  habits: Habit[];
  log: HabitLog;
  ladderLevel: number;
  /** Adds habits, skipping any that would put a fourth habit on one prayer. Returns how many were added. */
  addHabits: (drafts: HabitDraft[]) => number;
  updateHabit: (id: string, patch: Partial<HabitDraft & { milestoneSeen: boolean }>) => void;
  removeHabit: (id: string) => void;
  toggleHabit: (id: string, dateKey?: string) => void;
  setLadderLevel: (level: number) => void;
}

const HabitsContext = createContext<HabitsValue | null>(null);

let counter = 0;
function newId(): string {
  counter += 1;
  return `h${Date.now().toString(36)}${counter.toString(36)}`;
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabits());
  const [log, setLog] = useState<HabitLog>(() => loadHabitLog());
  const [ladderLevel, setLevel] = useState<number>(() => loadLadderLevel());

  const commitHabits = useCallback((next: Habit[]) => { setHabits(next); saveHabits(next); }, []);

  const addHabits = useCallback((drafts: HabitDraft[]) => {
    const today = getLocalDateKey();
    const next = [...habits];
    let added = 0;
    for (const d of drafts) {
      if (next.filter(h => h.anchor === d.anchor).length >= MAX_PER_PRAYER) continue;
      next.push({ ...d, id: newId(), createdAt: today });
      added++;
    }
    if (added) commitHabits(next);
    return added;
  }, [habits, commitHabits]);

  const updateHabit = useCallback((id: string, patch: Partial<HabitDraft & { milestoneSeen: boolean }>) => {
    commitHabits(habits.map(h => (h.id === id ? { ...h, ...patch } : h)));
  }, [habits, commitHabits]);

  const removeHabit = useCallback((id: string) => {
    commitHabits(habits.filter(h => h.id !== id));
  }, [habits, commitHabits]);

  const toggleHabit = useCallback((id: string, dateKey: string = getLocalDateKey()) => {
    setLog(prev => {
      const day = prev[dateKey] ?? [];
      const nextDay = day.includes(id) ? day.filter(x => x !== id) : [...day, id];
      const next = { ...prev, [dateKey]: nextDay };
      saveHabitLog({ ...next });
      return next;
    });
  }, []);

  const setLadderLevel = useCallback((level: number) => {
    setLevel(prev => {
      if (level === prev) return prev;
      saveLadderLevel(level);
      return level;
    });
  }, []);

  const value = useMemo(
    () => ({ habits, log, ladderLevel, addHabits, updateHabit, removeHabit, toggleHabit, setLadderLevel }),
    [habits, log, ladderLevel, addHabits, updateHabit, removeHabit, toggleHabit, setLadderLevel],
  );
  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
}

export function useHabits(): HabitsValue {
  const v = useContext(HabitsContext);
  if (!v) throw new Error('useHabits must be used inside HabitsProvider');
  return v;
}
