import { useEffect, useMemo, useRef, useState } from "react";
import { ApiError, fetchEntries, fetchFocus, fetchReflection, fetchVirtues, setEntry } from "../api";
import { addDays, dayLabel, dayNumber, localISODate, mondayOf, weekDates } from "../dates";
import type { Entry, FocusResponse, Virtue } from "../types";
import { VirtueRow } from "./VirtueRow";
import { WeekNav } from "./WeekNav";
import { ReflectionModal } from "./ReflectionModal";
import { ReflectHint } from "./ReflectHint";

const today = localISODate();

const BEN_IS_OUT_MESSAGES = [
  "Ben seems to have stepped away from his desk. Try again in a moment.",
  "Ben is out flying a kite. Back shortly, probably.",
  "Ben's quill has run dry — give him a minute to fetch more ink.",
  "Ben appears to be drafting another almanac. Try again shortly.",
  "Ben is deep in a chess game and can't be disturbed just yet.",
];

const GENERIC_REFLECT_ERROR = "Something went wrong reaching Ben. Please try again.";

function reflectErrorMessage(e: unknown): string {
  if (e instanceof ApiError && e.code === "unavailable") {
    return BEN_IS_OUT_MESSAGES[Math.floor(Math.random() * BEN_IS_OUT_MESSAGES.length)];
  }
  return GENERIC_REFLECT_ERROR;
}

const REFLECT_HINT_KEY = "franklin-seen-reflect-hint";

export function VirtueGrid() {
  const [weekStart, setWeekStart] = useState(mondayOf(today));
  const [virtues, setVirtues] = useState<Virtue[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [focus, setFocus] = useState<FocusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reflectOpen, setReflectOpen] = useState(false);
  const [reflectLoading, setReflectLoading] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [reflectError, setReflectError] = useState<string | null>(null);
  const [showReflectHint, setShowReflectHint] = useState(false);
  const reflectButtonRef = useRef<HTMLButtonElement>(null);

  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const weekEnd = dates[6];
  const focusVirtue = virtues.find((v) => v.id === focus?.virtueId);

  useEffect(() => {
    fetchVirtues().then(setVirtues).catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    let alreadySeen = true;
    try {
      alreadySeen = localStorage.getItem(REFLECT_HINT_KEY) === "1";
    } catch {
      // localStorage unavailable; skip the hint rather than risk showing it every visit
    }
    if (alreadySeen) return;

    const showTimer = setTimeout(() => {
      setShowReflectHint(true);
      try {
        localStorage.setItem(REFLECT_HINT_KEY, "1");
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!showReflectHint) return;
    const hideTimer = setTimeout(() => setShowReflectHint(false), 6000);
    return () => clearTimeout(hideTimer);
  }, [showReflectHint]);

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

  async function reflect() {
    if (!focusVirtue) return;
    setShowReflectHint(false);
    setReflectOpen(true);
    setReflectLoading(true);
    setReflectError(null);
    setReflection(null);

    const virtuesById = new Map(virtues.map((v) => [v.id, v.name]));
    const faults = entries
      .filter((e) => e.faulted)
      .map((e) => ({ virtueName: virtuesById.get(e.virtueId) ?? "Unknown", date: e.date }));

    try {
      const res = await fetchReflection({
        weekStart,
        weekEnd,
        focusVirtueName: focusVirtue.name,
        faults,
      });
      setReflection(res.reflection);
    } catch (e) {
      setReflectError(reflectErrorMessage(e));
    } finally {
      setReflectLoading(false);
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

      {focusVirtue && (
        <div className="focus-summary">
          <p>
            This week's focus: <strong>{focusVirtue.name}</strong> — {focusVirtue.precept}
          </p>
          <p className="focus-rationale">
            &ldquo;{focusVirtue.rationale}&rdquo; — Ben Franklin
          </p>
        </div>
      )}

      <div className="virtue-grid">
        <div className="virtue-row header-row">
          <div className="virtue-info">
            {showReflectHint && <ReflectHint anchorRef={reflectButtonRef} />}
            <button
              ref={reflectButtonRef}
              className="reflect-button"
              onClick={reflect}
              aria-label="Reflect on this week"
            >
              <img src="/reflect-icon.png" alt="" />
            </button>
          </div>
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

      {reflectOpen && (
        <ReflectionModal
          loading={reflectLoading}
          reflection={reflection}
          error={reflectError}
          onClose={() => setReflectOpen(false)}
        />
      )}
    </div>
  );
}
