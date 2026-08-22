import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

interface Props {
  anchorRef: RefObject<HTMLElement | null>;
}

export function ReflectHint({ anchorRef }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    function update() {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setPos({ top: rect.top - 10, left: rect.left + rect.width / 2 });
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [anchorRef]);

  if (!pos) return null;

  return createPortal(
    <div className="reflect-hint" style={{ top: pos.top, left: pos.left }}>
      Ask Ben!
    </div>,
    document.body
  );
}
