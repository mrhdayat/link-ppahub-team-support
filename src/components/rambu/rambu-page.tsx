import type { Site } from "@/lib/site";

/** Rambu Navigasi public page. `preview` = rendered inside the admin editor (no sticky/fixed chrome, no storage). */
export function RambuPage({ site }: { site: Site; preview?: boolean }) {
  return <main>{site.profil.nama}</main>;
}
