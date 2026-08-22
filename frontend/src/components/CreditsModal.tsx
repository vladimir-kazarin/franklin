import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

export function CreditsModal({ onClose }: Props) {
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
        <div className="about-text">
          <h2>Credits</h2>
          <p>
            <a
              href="https://www.flaticon.com/free-icons/benjamin-franklin"
              title="benjamin franklin icons"
              target="_blank"
              rel="noopener noreferrer"
            >
              Benjamin franklin icons created by Magnific - Flaticon
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
