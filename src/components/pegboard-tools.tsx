/**
 * Tools hung on the pegboard behind the chest. Authored silhouettes, decorative only.
 * The viewBox is wider than any phone; `slice` crops to the sides so tools frame the chest on desktop.
 */

function Wrench({ x, y, len }: { x: number; y: number; len: number }) {
  const id = `wr-${x}`;
  return (
    <g className="tool" transform={`translate(${x} ${y})`}>
      <circle className="peg" cx="0" cy="-10" r="3.2" />
      <mask id={id}>
        <rect x="-30" y="-30" width="60" height={len + 60} fill="#fff" />
        <rect x="-7" y="-26" width="14" height="22" rx="2" fill="#000" />
        <circle cx="0" cy={len - 12} r="7.5" fill="#000" />
      </mask>
      <g mask={`url(#${id})`}>
        <circle cx="0" cy="12" r="17" />
        <rect x="-6.5" y="18" width="13" height={len - 44} rx="5" />
        <circle cx="0" cy={len - 12} r="15" />
      </g>
    </g>
  );
}

function Screwdriver({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g className="tool" transform={`translate(${x} ${y}) rotate(${rot})`}>
      <circle className="peg" cx="0" cy="-8" r="3.2" />
      <rect x="-13" y="0" width="26" height="92" rx="11" />
      <rect className="tool-hi" x="-9" y="10" width="3" height="70" rx="1.5" />
      <rect className="tool-hi" x="6" y="10" width="3" height="70" rx="1.5" />
      <rect x="-4" y="90" width="8" height="118" rx="2" />
      <path d="M-4 206 L4 206 L2.5 222 L-2.5 222 Z" />
    </g>
  );
}

function Hammer({ x, y }: { x: number; y: number }) {
  return (
    <g className="tool" transform={`translate(${x} ${y})`}>
      <circle className="peg" cx="-40" cy="-10" r="3.2" />
      <circle className="peg" cx="40" cy="-10" r="3.2" />
      <path d="M-58 0 h82 a6 6 0 0 1 6 6 v20 a6 6 0 0 1 -6 6 h-82 z" />
      <path d="M30 4 C 48 6, 60 16, 66 34 L 58 36 C 52 24, 44 18, 30 18 Z" />
      <rect x="-15" y="30" width="16" height="230" rx="7" />
      <rect className="tool-hi" x="-11" y="150" width="3" height="100" rx="1.5" />
    </g>
  );
}

function Pliers({ x, y }: { x: number; y: number }) {
  return (
    <g className="tool" transform={`translate(${x} ${y})`}>
      <circle className="peg" cx="0" cy="-8" r="3.2" />
      <path d="M-5 0 L5 0 L9 46 L-9 46 Z" />
      <circle cx="0" cy="56" r="11" />
      <path d="M-6 62 C -14 110, -26 150, -30 196 L -16 198 C -12 150, -2 112, 4 66 Z" />
      <path d="M6 62 C 14 110, 26 150, 30 196 L 16 198 C 12 150, 2 112, -4 66 Z" />
    </g>
  );
}

function Tape({ x, y }: { x: number; y: number }) {
  return (
    <g className="tool" transform={`translate(${x} ${y})`}>
      <circle className="peg" cx="0" cy="-8" r="3.2" />
      <rect x="-38" y="0" width="76" height="76" rx="18" />
      <circle className="tool-hi" cx="0" cy="38" r="14" />
      <rect x="30" y="58" width="22" height="9" rx="2" />
    </g>
  );
}

export function PegboardTools() {
  return (
    <svg className="tools" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMin slice" aria-hidden focusable="false">
      <g>
        <Wrench x={150} y={150} len={230} />
        <Wrench x={196} y={150} len={200} />
        <Wrench x={238} y={150} len={172} />
        <Wrench x={276} y={150} len={148} />
        <Screwdriver x={150} y={470} />
        <Screwdriver x={198} y={470} rot={4} />
        <Pliers x={280} y={470} />
      </g>
      <g>
        <Hammer x={1220} y={150} />
        <Tape x={1130} y={170} />
        <Screwdriver x={1300} y={470} rot={-3} />
        <Wrench x={1170} y={470} len={240} />
        <Wrench x={1214} y={470} len={210} />
      </g>
    </svg>
  );
}
