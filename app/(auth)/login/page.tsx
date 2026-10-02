"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/shop");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm w-full px-4 py-16">
      <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
      <p className="text-muted text-sm mb-8">Sign in to your Fuguaa account.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          required
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm"
        />

        {error && <p className="text-sm text-terracotta">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-terracotta text-white font-medium py-2.5 rounded-full hover:bg-charcoal transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-terracotta font-medium">
          Create one
        </Link>
      </p>
    </div>
  );
}
