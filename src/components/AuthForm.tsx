"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode, defaultRole = "BUYER" }: { mode: "login" | "signup"; defaultRole?: "BUYER" | "SELLER" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [role, setRole] = useState(defaultRole);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError("");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")), password = String(f.get("password"));
    if (mode === "signup") {
      const res = await fetch("/api/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.get("name"), email, password, role }),
      });
      if (!res.ok) { setError((await res.json()).error ?? "Something went wrong."); setBusy(false); return; }
    }
    const r = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (r?.error) { setError("Incorrect email or password."); return; }
    router.push("/"); router.refresh();
  }

  const input = "w-full rounded-lg border border-charcoal/20 bg-white px-3 py-2 focus:border-terracotta focus:outline-none";
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <>
          <div className="grid grid-cols-2 gap-2 text-sm font-medium">
            {(["BUYER", "SELLER"] as const).map((r) => (
              <button type="button" key={r} onClick={() => setRole(r)}
                className={`rounded-lg border px-3 py-2 ${role === r ? "border-terracotta bg-terracotta text-white" : "border-charcoal/20 bg-white"}`}>
                {r === "BUYER" ? "I want to buy" : "I want to sell"}
              </button>
            ))}
          </div>
          <input name="name" required placeholder="Full name" className={input} />
        </>
      )}
      <input name="email" type="email" required placeholder="Email" className={input} />
      <input name="password" type="password" required minLength={8} placeholder="Password (8+ characters)" className={input} />
      {error && <p className="text-sm text-terracotta">{error}</p>}
      <button disabled={busy} className="w-full rounded-lg bg-indigo py-2.5 font-medium text-cream disabled:opacity-60">
        {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
      </button>
    </form>
  );
}
