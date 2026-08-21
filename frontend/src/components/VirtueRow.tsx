import { useState } from "react";
import type { Virtue } from "../types";
import { DayCell } from "./DayCell";

interface Props {
  virtue: Virtue;
  dates: string[];
  faultsByDate: Record<string, boolean>;
  isFocus: boolean;
  today: string;
  onToggle: (date: string) => void;
}

export function VirtueRow({ virtue, dates, faultsByDate, isFocus, today, onToggle }: Props) {
  const [expanded, setExpanded] = useState(false);
  const weeklyFaults = dates.reduce((sum, d) => sum + (faultsByDate[d] ? 1 : 0), 0);

  return (
    <div className={`virtue-row${isFocus ? " focus" : ""}`}>
      <div className="virtue-info" onClick={() => setExpanded((e) => !e)}>
        <div className="virtue-name" title={virtue.precept}>
          {isFocus && <span className="focus-badge">Focus</span>}
          {virtue.name}
        </div>
        {expanded && <div className="virtue-precept">{virtue.precept}</div>}
      </div>
      <div className="virtue-days">
        {dates.map((date) => (
          <DayCell
            key={date}
            date={date}
            faulted={!!faultsByDate[date]}
            isFuture={date > today}
            onToggle={() => onToggle(date)}
          />
        ))}
      </div>
      <div className="virtue-count">{weeklyFaults}</div>
    </div>
  );
}
