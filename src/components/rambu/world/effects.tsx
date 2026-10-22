"use client";

import { useEffect, useRef, useState } from "react";
import { kmDari } from "./world";
import "./world.css";

const GATE_KEY = "rambu-palang";
const REACH = 280; // px from the beam centre where a sign stops reflecting
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Boom barrier that lifts once per browser session. Decorative overlay: never blocks taps or delays content. */
export function Gate() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(GATE_KEY) || still()) return;
      sessionStorage.setItem(GATE_KEY, "1");
      setShow(true);
    } catch {}
  }, []);
  if (!show) return null;
  return (
    <div className="palang" aria-hidden onAnimationEnd={(e) => e.target === e.currentTarget && setShow(false)}>
      <span className="palang-lengan" />
      <span className="palang-tiang" />
    </div>
  );
}

/**
 * Night atmosphere: dashed road-edge markings (scroll-driven in CSS) and a headlight that follows the
 * pointer, or sweeps slowly while a touch screen scrolls. Once per frame: the beam moves via --lx/--ly on
 * itself, then signs near it get --lit (0–1) so their reflective rule and halo light up like sheeting.
 * All rects are read before any write, so a frame never forces layout twice.
 */
export function Suasana() {
  const light = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = light.current;
    if (!el || still()) return;
    let x = innerWidth / 2;
    let y = innerHeight * 0.3;
    let raf = 0;
    const paint = () => {
      raf = 0;
      const t = document.documentElement.dataset.theme;
      const night = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      const signs = night ? [...document.querySelectorAll<HTMLElement>(".rambu:not([data-preview]) :is(.sign, .board, .plate)")] : [];
      const lit = signs.map((s) => {
        const r = s.getBoundingClientRect();
        const d = Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
        return Math.max(0, 1 - d / REACH).toFixed(1);
      });
      el.style.setProperty("--lx", `${x}px`);
      el.style.setProperty("--ly", `${y}px`);
      signs.forEach((s, i) => s.style.getPropertyValue("--lit") !== lit[i] && s.style.setProperty("--lit", lit[i]));
    };
    const at = (nx: number, ny: number) => {
      x = nx;
      y = ny;
      raf ||= requestAnimationFrame(paint);
    };
    const onPointer = (e: PointerEvent) => at(e.clientX, e.clientY);
    // Touch: the beam sweeps side to side as the page scrolls. Mouse: it stays put while signs scroll past it.
    const touch = matchMedia("(pointer: coarse)").matches;
    const onScroll = () => (touch ? at(innerWidth * (0.5 + 0.4 * Math.sin(scrollY / 500)), innerHeight * 0.45) : at(x, y));
    addEventListener("pointermove", onPointer, { passive: true });
    addEventListener("pointerdown", onPointer, { passive: true });
    addEventListener("scroll", onScroll, { passive: true });
    paint();
    return () => {
      removeEventListener("pointermove", onPointer);
      removeEventListener("pointerdown", onPointer);
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <>
      <div className="marka" aria-hidden />
      <div ref={light} className="headlight" aria-hidden />
    </>
  );
}

/** Distance travelled on the KM post, from how far the page is scrolled. */
export function KmJarak({ preview }: { preview: boolean }) {
  const [km, setKm] = useState(kmDari(0));
  useEffect(() => {
    if (preview) return;
    let raf = 0;
    const paint = () => ((raf = 0), setKm(kmDari(scrollY)));
    const onScroll = () => (raf ||= requestAnimationFrame(paint));
    addEventListener("scroll", onScroll, { passive: true });
    paint();
    return () => (removeEventListener("scroll", onScroll), cancelAnimationFrame(raf));
  }, [preview]);
  return <b>{km}</b>;
}
