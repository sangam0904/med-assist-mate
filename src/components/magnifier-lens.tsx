import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

const LENS_SIZE = 168;

function textUnder(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!el) return null;
  if (el.closest("[data-no-magnify]")) return null;
  let node: HTMLElement | null = el;
  while (node && node !== document.body) {
    const text = (node.innerText || node.textContent || "").trim();
    if (text && text.length <= 260) return text;
    if (text) return text.slice(0, 260) + "…";
    node = node.parentElement;
  }
  return null;
}

export function MagnifierLens() {
  const [enabled, setEnabled] = useState(true);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [text, setText] = useState<string | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPos(null);
      setText(null);
      return;
    }
    if (!window.matchMedia("(pointer: fine)").matches) return;

    function onMove(e: MouseEvent) {
      const { clientX: x, clientY: y } = e;
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        setPos({ x, y });
        setText(textUnder(x, y));
      });
    }
    function onLeave() {
      setPos(null);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [enabled]);

  return (
    <>
      <button
        type="button"
        data-no-magnify
        onClick={() => setEnabled((v) => !v)}
        aria-pressed={enabled}
        aria-label={enabled ? "Turn off reading magnifier" : "Turn on reading magnifier"}
        className="fixed bottom-4 right-4 z-50 hidden rounded-full border border-border bg-card p-3 text-muted-foreground shadow-lift transition-colors hover:text-primary lg:block"
      >
        {enabled ? <ZoomOut className="size-4" /> : <ZoomIn className="size-4" />}
      </button>

      {enabled && pos && text ? (
        <div
          aria-hidden="true"
          data-no-magnify
          className="pointer-events-none fixed z-[60] flex items-center justify-center overflow-hidden rounded-full border border-border bg-card/95 p-4 text-center shadow-lift backdrop-blur"
          style={{
            width: LENS_SIZE,
            height: LENS_SIZE,
            left: Math.min(Math.max(pos.x - LENS_SIZE / 2, 8), window.innerWidth - LENS_SIZE - 8),
            top: Math.min(pos.y + 18, window.innerHeight - LENS_SIZE - 8),
          }}
        >
          <span className="line-clamp-4 text-[15px] font-semibold leading-snug text-foreground">
            {text}
          </span>
        </div>
      ) : null}
    </>
  );
}
