"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SellerOnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    shopName: "",
    bio: "",
    region: "",
    ghanaCardNumber: "",
    ghanaCardDocUrl: "",
  });
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (status === "loading") return null;

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted">Please sign in first to become a seller.</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-4 bg-terracotta text-white font-medium px-6 py-2.5 rounded-full"
        >
          Sign in
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/seller/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-2">Application submitted</h1>
        <p className="text-muted">
          Thanks! Your shop details and Ghana Card are now pending review. You
          can list products as soon as an admin approves your verification —
          usually within a day or two.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg w-full px-4 py-16">
      <h1 className="text-2xl font-semibold mb-1">Become a Fuguaa seller</h1>
      <p className="text-muted text-sm mb-8">
        Tell us about your shop and verify your identity with your Ghana Card.
        This keeps buyers confident they&apos;re buying from a real person.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">Shop name</label>
          <input
            required
            value={form.shopName}
            onChange={(e) => setForm((f) => ({ ...f, shopName: e.target.value }))}
            className="w-full rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Your story (shown on your storefront)
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            rows={3}
            placeholder="e.g. Three generations of weaving in Tamale..."
            className="w-full rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Region</label>
          <input
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            placeholder="e.g. Northern Region"
            className="w-full rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Ghana Card number
          </label>
          <input
            required
            value={form.ghanaCardNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, ghanaCardNumber: e.target.value }))
            }
            placeholder="GHA-123456789-0"
            className="w-full rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">
            Photo of your Ghana Card (URL)
          </label>
          <input
            required
            type="url"
            value={form.ghanaCardDocUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, ghanaCardDocUrl: e.target.value }))
            }
            placeholder="https://..."
            className="w-full rounded-lg border border-charcoal/20 px-4 py-2.5 text-sm"
          />
          <p className="text-xs text-muted mt-1">
            MVP note: this expects an already-hosted image URL. Wire up a real
            upload widget (Vercel Blob or Cloudinary) before launch — see
            README.
          </p>
        </div>

        {error && <p className="text-sm text-terracotta">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-terracotta text-white font-medium py-2.5 rounded-full hover:bg-charcoal transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? "Submitting..." : "Submit for verification"}
        </button>
      </form>
    </div>
  );
}
