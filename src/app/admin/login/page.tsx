import type { Metadata } from "next";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Masuk", robots: { index: false } };

export default function LoginPage() {
  return <LoginForm />;
}
