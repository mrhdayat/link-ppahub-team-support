"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * The head unit's VFD. Shows the owner's name; while a drawer or preset key is hovered or focused
 * it shows that link instead, like a radio naming the station you just tuned to.
 * Listens on the nearest `.shop` so the admin preview and the public page each drive their own display.
 */
export function RadioDisplay({ name }: { name: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(name);
  const [slot, setSlot] = useState("");
  const [clock, setClock] = useState("");

  useEffect(() => setText(name), [name]);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    };
    tick();
    const t = setInterval(tick, 15_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const shop = root.current?.closest(".shop");
    if (!shop) return;
    let reset: ReturnType<typeof setTimeout>;
    const show = (e: Event) => {
      const el = (e.target as Element | null)?.closest?.("[data-vfd]");
      if (!el) return;
      clearTimeout(reset);
      setText(el.getAttribute("data-vfd") ?? name);
      setSlot(el.getAttribute("data-slot") ?? "");
    };
    const hide = (e: Event) => {
      if (!(e.target as Element | null)?.closest?.("[data-vfd]")) return;
      clearTimeout(reset);
      reset = setTimeout(() => {
        setText(name);
        setSlot("");
      }, 900);
    };
    shop.addEventListener("pointerover", show);
    shop.addEventListener("focusin", show);
    shop.addEventListener("pointerout", hide);
    shop.addEventListener("focusout", hide);
    return () => {
      clearTimeout(reset);
      shop.removeEventListener("pointerover", show);
      shop.removeEventListener("focusin", show);
      shop.removeEventListener("pointerout", hide);
      shop.removeEventListener("focusout", hide);
    };
  }, [name]);

  // Long text scrolls across the glass; short text sits still.
  const line = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);
  useEffect(() => {
    const el = line.current;
    if (!el) return;
    const measure = () => setOverflow(Math.max(0, el.scrollWidth - (el.parentElement?.clientWidth ?? 0)));
    measure();
    const ro = new ResizeObserver(measure);
    if (el.parentElement) ro.observe(el.parentElement);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div className="vfd-face" ref={root}>
      <div className="vfd-top">
        <span>{slot || "CH"}</span>
        <span className="vfd-clock">{clock || "--:--"}</span>
      </div>
      <div className="vfd-line">
        <span
          key={text}
          ref={line}
          className="vfd-text"
          data-marquee={overflow > 0 || undefined}
          style={{ "--run": `${-overflow - 12}px`, "--dur": `${Math.max(4, overflow / 22)}s` } as CSSProperties}
        >
          {text}
        </span>
      </div>
      <div className="vfd-meter" data-hot={slot ? "" : undefined}>
        {Array.from({ length: 16 }, (_, i) => (
          <i key={i} style={{ "--b": i } as CSSProperties} />
        ))}
      </div>
    </div>
  );
}
