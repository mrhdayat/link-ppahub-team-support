import { lanesOf, type Link } from "@/lib/site";

// Search over the signs: title, note, aliases (kataKunci) and lane names.
// Case- and diacritic-insensitive, typo-tolerant, ranked exact > prefix > alias > fuzzy.

export const norm = (s: string) => s.toLocaleLowerCase("id").normalize("NFD").replace(/[̀-ͯ]/g, "");

/** [start, end) character ranges in the original text, for <mark>. */
export type Range = [number, number];
export type Hit = { link: Link; score: number; judul: Range[]; catatan: Range[] };

/** Rank per query word; a link scores by its weakest word. */
const EXACT = 4, PREFIX = 3, ALIAS = 2, FUZZY = 1;

/** Optimal-string-alignment Damerau-Levenshtein: insert, delete, substitute, swap two neighbours. */
export function dl(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  return d[a.length][b.length];
}

/** Typos allowed for a query word: none under 4 letters, 1 from 4, 2 from 8. */
const slack = (w: string) => (w.length >= 8 ? 2 : w.length >= 4 ? 1 : 0);

/** Close enough to a whole word, or to its start (the visitor is still typing). */
const near = (q: string, w: string) => {
  const k = slack(q);
  return k > 0 && (dl(q, w) <= k || (w.length > q.length && dl(q, w.slice(0, q.length)) <= k));
};

/** Normalised text with a map back to the original index of every normalised character. */
function folded(s: string) {
  let text = "";
  const at: number[] = [];
  for (let i = 0; i < s.length; i++) {
    for (const c of norm(s[i])) {
      text += c;
      at.push(i);
    }
  }
  return { text, at };
}

type Field = { text: string; at: number[]; words: { w: string; i: number }[] };
function field(s: string): Field {
  const f = folded(s);
  return { ...f, words: [...f.text.matchAll(/[\p{L}\p{N}]+/gu)].map((m) => ({ w: m[0], i: m.index })) };
}
const back = (f: Field, i: number, n: number): Range => [f.at[i], f.at[i + n - 1] + 1];

/** Best rank of one query word in one field, plus where it matched. */
function rank(q: string, f: Field): { score: number; at?: Range } {
  const exact = f.words.find((x) => x.w === q);
  if (exact) return { score: EXACT, at: back(f, exact.i, q.length) };
  const pre = f.words.find((x) => x.w.startsWith(q));
  if (pre) return { score: PREFIX, at: back(f, pre.i, q.length) };
  // inside a word ("monitoring" in "swmonitoring") or across words ("hv-simper"): as good as a prefix
  const sub = f.text.indexOf(q);
  if (sub >= 0) return { score: PREFIX, at: back(f, sub, q.length) };
  const fuzzy = f.words.find((x) => near(q, x.w));
  if (fuzzy) return { score: FUZZY, at: back(f, fuzzy.i, fuzzy.w.length) };
  return { score: 0 };
}

const merge = (r: Range[]): Range[] =>
  r
    .sort((a, b) => a[0] - b[0])
    .reduce<Range[]>((out, x) => {
      const last = out.at(-1);
      if (last && x[0] <= last[1]) last[1] = Math.max(last[1], x[1]);
      else out.push([...x]);
      return out;
    }, []);

/** Links matching every word of `query`, best first; ties keep CONFIG order. `laneName` maps kategori id → name. */
export function search(links: Link[], laneName: (id: string) => string | undefined, query: string): Hit[] {
  const words = norm(query).match(/[\p{L}\p{N}]+/gu) ?? [];
  if (!words.length) return [];
  const hits: Hit[] = [];
  for (const link of links) {
    const judul = field(link.judul);
    const catatan = field(link.catatan);
    const alias = field(link.kataKunci);
    const lanes = field(lanesOf(link).map(laneName).filter(Boolean).join(" "));
    const marks = { judul: [] as Range[], catatan: [] as Range[] };
    let worst = EXACT, total = 0;
    for (const q of words) {
      const j = rank(q, judul), c = rank(q, catatan), l = rank(q, lanes);
      const a = rank(q, alias);
      // an alias hit ranks as an alias, whether it was typed exactly or nearly
      const s = Math.max(j.score, c.score, l.score, a.score >= PREFIX ? ALIAS : a.score);
      if (!s) {
        worst = 0;
        break;
      }
      if (j.score === s && j.at) marks.judul.push(j.at);
      else if (c.score === s && c.at) marks.catatan.push(c.at);
      worst = Math.min(worst, s);
      total += s + (j.score === s ? 0.5 : 0); // same rank: a title hit beats a note or lane hit
    }
    if (worst) hits.push({ link, score: worst * 100 + total, judul: merge(marks.judul), catatan: merge(marks.catatan) });
  }
  // Array sort is stable, so equal scores stay in CONFIG order.
  return hits.sort((a, b) => b.score - a.score);
}
