"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

// Dedicated seller signup — separate from the buyer signup page so
// sellers always land in the Ghana Card verification flow next, and
// buyers never see a "sell" option by accident.
export default function SellerSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "seller" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created — please sign in.");
        router.push("/login");
        return;
      }

      router.push("/seller-onboarding");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm w-full px-4 py-16">
      <h1 className="text-2xl font-semibold mb-1">Sell on Fuguaa</h1>
      <p className="text-muted text-sm mb-8">
        Create a seller account, then verify your identity with your Ghana
        Card to start listing.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm"
        />
        <input
          required
          type="password"
          minLength={8}
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm"
        />

        {error && <p className="text-sm text-terracotta">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo text-cream font-medium py-2.5 rounded-full hover:bg-charcoal transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create seller account"}
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        Already have a seller account?{" "}
        <Link href="/login" className="text-terracotta font-medium">
          Sign in
        </Link>
      </p>
      <p className="text-sm text-muted mt-2">
        Just here to shop?{" "}
        <Link href="/signup" className="text-terracotta font-medium">
          Create a buyer account
        </Link>
      </p>
    </div>
  );
}
