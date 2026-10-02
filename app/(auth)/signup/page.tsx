"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer" as "buyer" | "seller",
  });
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
        body: JSON.stringify(form),
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

      router.push(form.role === "seller" ? "/seller-onboarding" : "/shop");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm w-full px-4 py-16">
      <h1 className="text-2xl font-semibold mb-1">Create your account</h1>
      <p className="text-muted text-sm mb-8">Join Fuguaa as a buyer or seller.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-2">
          {(["buyer", "seller"] as const).map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setForm((f) => ({ ...f, role: r }))}
              className={`flex-1 py-2 rounded-full text-sm font-medium border ${
                form.role === r
                  ? "bg-indigo text-cream border-indigo"
                  : "border-charcoal/20"
              }`}
            >
              {r === "buyer" ? "I want to buy" : "I want to sell"}
            </button>
          ))}
        </div>

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
          className="bg-terracotta text-white font-medium py-2.5 rounded-full hover:bg-charcoal transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-terracotta font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
