import { useEffect, useState } from "react";

interface Props {
  loading: boolean;
  reflection: string | null;
  error: string | null;
  onClose: () => void;
}

function useAnimatedDots(active: boolean): string {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!active) {
      setDots("");
      return;
    }
    const id = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(id);
  }, [active]);

  return dots;
}

export function ReflectionModal({ loading, reflection, error, onClose }: Props) {
  const dots = useAnimatedDots(loading);

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
        <img className="reflect-modal-icon" src="/reflect-icon.png" alt="" />
        <div className="about-text">
          <h2>This Week's Reflection</h2>
          {loading && (
            <p>
              Ben's thinking<span className="loading-dots">{dots}</span>
            </p>
          )}
          {error && <p className="error-banner">{error}</p>}
          {reflection && <p>{reflection}</p>}
        </div>
      </div>
    </div>
  );
}
