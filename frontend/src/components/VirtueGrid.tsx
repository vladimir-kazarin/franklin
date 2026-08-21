import { useEffect, useMemo, useState } from "react";
import { fetchEntries, fetchFocus, fetchVirtues, setEntry } from "../api";
import { addDays, dayLabel, dayNumber, mondayOf, toISODate, weekDates } from "../dates";
import type { Entry, FocusResponse, Virtue } from "../types";
import { VirtueRow } from "./VirtueRow";
import { WeekNav } from "./WeekNav";

const today = toISODate(new Date());

export function VirtueGrid() {
  const [weekStart, setWeekStart] = useState(mondayOf(today));
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [focus, setFocus] = useState<FocusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const weekEnd = dates[6];

  useEffect(() => {
    fetchVirtues().then(setVirtues).catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchEntries(weekStart, weekEnd), fetchFocus(weekStart)])
      .then(([entriesRes, focusRes]) => {
        setEntries(entriesRes);
        setFocus(focusRes);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [weekStart, weekEnd]);

  const faultsByVirtue = useMemo(() => {
    const map = new Map<number, Record<string, boolean>>();
    for (const e of entries) {
      if (!map.has(e.virtueId)) map.set(e.virtueId, {});
      map.get(e.virtueId)![e.date] = e.faulted;
    }
    return map;
  }, [entries]);

  async function toggle(virtueId: number, date: string) {
    const current = faultsByVirtue.get(virtueId)?.[date] ?? false;
    const next = !current;
    setEntries((prev) => {
      const withoutThis = prev.filter((e) => !(e.virtueId === virtueId && e.date === date));
      return [...withoutThis, { virtueId, date, faulted: next }];
    });
    try {
      await setEntry(date, virtueId, next);
    } catch (e) {
      setError(String(e));
      setEntries((prev) => {
        const withoutThis = prev.filter((en) => !(en.virtueId === virtueId && en.date === date));
        return [...withoutThis, { virtueId, date, faulted: current }];
      });
    }
  }

  return (
    <div className="virtue-grid-container">
      <WeekNav
        weekStart={weekStart}
        weekEnd={weekEnd}
        onPrev={() => setWeekStart((w) => addDays(w, -7))}
        onNext={() => setWeekStart((w) => addDays(w, 7))}
        onToday={() => setWeekStart(mondayOf(today))}
      />

      {error && <div className="error-banner">{error}</div>}

      <div className="virtue-grid">
        <div className="virtue-row header-row">
          <div className="virtue-info" />
          <div className="virtue-days">
            {dates.map((d) => (
              <div key={d} className={`day-header${d === today ? " today" : ""}`}>
                <div className="day-name">{dayLabel(d)}</div>
                <div className="day-num">{dayNumber(d)}</div>
              </div>
            ))}
          </div>
          <div className="virtue-count">Σ</div>
        </div>

        {loading && virtues.length === 0 ? (
          <div className="loading">Loading…</div>
        ) : (
          virtues.map((v) => (
            <VirtueRow
              key={v.id}
              virtue={v}
              dates={dates}
              faultsByDate={faultsByVirtue.get(v.id) ?? {}}
              isFocus={focus?.virtueId === v.id}
              today={today}
              onToggle={(date) => toggle(v.id, date)}
            />
          ))
        )}
      </div>
    </div>
  );
}
