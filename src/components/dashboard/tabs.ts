// Dashboard sections, shared by the server page (?tab= deep link) and the client shell.
export const TABS = ["ringkasan", "tautan", "kategori", "profil", "tim", "pengaturan"] as const;
export type Tab = (typeof TABS)[number];
export const isTab = (s: string): s is Tab => (TABS as readonly string[]).includes(s);
