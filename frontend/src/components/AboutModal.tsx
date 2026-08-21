import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

export function AboutModal({ onClose }: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="about-overlay" onClick={onClose}>
      <div className="about-modal" onClick={(e) => e.stopPropagation()}>
        <button className="about-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <img
          className="about-portrait"
          src="/franklin-portrait.webp"
          alt="Portrait of Benjamin Franklin, 1767"
        />
        <div className="about-text">
          <h2>Benjamin Franklin</h2>
          <p>
            Benjamin Franklin (1706–1790) was a Founding Father of the United
            States — a writer, scientist, inventor, diplomat, and statesman
            whose curiosity ranged from electricity to civic institutions
            like the public library and fire department.
          </p>
          <h2>The 13 Virtues</h2>
          <p>
            In his autobiography, Franklin described a personal system for
            self-improvement: thirteen virtues, each paired with a short
            precept. Rather than tackle all of them at once, he focused on
            one virtue per week, cycling through all thirteen roughly four
            times a year, and kept a daily chart marking every fault against
            his current focus. Over time, the habit was meant to become
            easier to keep than to break.
          </p>
        </div>
      </div>
    </div>
  );
}
