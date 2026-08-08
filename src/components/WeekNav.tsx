import { formatRange } from "../dates";

interface Props {
  weekStart: string;
  weekEnd: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function WeekNav({ weekStart, weekEnd, onPrev, onNext, onToday }: Props) {
  return (
    <div className="week-nav">
      <button onClick={onPrev} aria-label="Previous week">
        ‹
      </button>
      <div className="week-nav-range">
        <span>{formatRange(weekStart, weekEnd)}</span>
        <button className="today-link" onClick={onToday}>
          Today
        </button>
      </div>
      <button onClick={onNext} aria-label="Next week">
        ›
      </button>
    </div>
  );
}
