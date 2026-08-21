interface Props {
  date: string;
  faulted: boolean;
  isFuture: boolean;
  onToggle: () => void;
}

export function DayCell({ date, faulted, isFuture, onToggle }: Props) {
  return (
    <button
      className={`day-cell${faulted ? " faulted" : ""}${isFuture ? " future" : ""}`}
      onClick={onToggle}
      disabled={isFuture}
      aria-pressed={faulted}
      aria-label={`${date}: ${faulted ? "faulted" : "clean"}`}
    >
      {faulted ? "•" : ""}
    </button>
  );
}
