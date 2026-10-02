"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type SellerProfile = {
  id: string;
  shopName: string;
  verificationStatus: string;
};

type Product = {
  id: string;
  title: string;
  priceGhs: string;
  stock: number;
  photos: string[];
};

type SellerOrder = {
  id: string;
  status: string;
  totalGhs: string;
  createdAt: string;
  buyerName: string;
};

const emptyForm = {
  title: "",
  description: "",
  priceGhs: "",
  stock: "",
  photos: "",
  sizes: "",
  colors: "",
  fabricType: "",
  occasionTags: "",
  sizeGuide: "",
};

export default function SellerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<SellerProfile | null | undefined>(
    undefined
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"listings" | "orders">("listings");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/seller/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile));
    fetch("/api/seller/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []));
    fetch("/api/seller/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []));
  }, [status]);

  if (status === "loading" || profile === undefined) return null;

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted mb-4">Sign in to access your seller dashboard.</p>
        <button
          onClick={() => router.push("/login")}
          className="bg-terracotta text-white font-medium px-6 py-2.5 rounded-full"
        >
          Sign in
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted mb-4">
          You haven&apos;t set up a shop yet.
        </p>
        <Link
          href="/seller-onboarding"
          className="bg-terracotta text-white font-medium px-6 py-2.5 rounded-full"
        >
          Start seller onboarding
        </Link>
      </div>
    );
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    const payload = {
      title: form.title,
      description: form.description || undefined,
      priceGhs: Number(form.priceGhs),
      stock: Number(form.stock),
      photos: form.photos
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sizes: form.sizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      colors: form.colors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      fabricType: form.fabricType || undefined,
      occasionTags: form.occasionTags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sizeGuide: form.sizeGuide || undefined,
    };

    const res = await fetch("/api/seller/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFormError(data.error ?? "Could not create listing");
      return;
    }

    setProducts((prev) => [data.product, ...prev]);
    setForm(emptyForm);
  }

  async function updateOrderStatus(orderId: string, nextStatus: "confirmed" | "shipped") {
    const res = await fetch(`/api/seller/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
    }
  }

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <h1 className="text-2xl font-semibold">{profile.shopName}</h1>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            profile.verificationStatus === "approved"
              ? "bg-forest/15 text-forest"
              : profile.verificationStatus === "rejected"
              ? "bg-terracotta/15 text-terracotta"
              : "bg-ochre/20 text-ochre"
          }`}
        >
          {profile.verificationStatus === "approved"
            ? "Verified"
            : profile.verificationStatus === "rejected"
            ? "Verification rejected"
            : "Verification pending"}
        </span>
      </div>

      {profile.verificationStatus !== "approved" && (
        <p className="text-sm text-muted mb-6">
          You can list products once an admin approves your Ghana Card
          verification.
        </p>
      )}

      <div className="flex gap-2 mb-6 border-b border-charcoal/10">
        {(["listings", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t
                ? "border-terracotta text-terracotta"
                : "border-transparent text-muted"
            }`}
          >
            {t === "listings" ? "Listings" : "Orders"}
          </button>
        ))}
      </div>

      {tab === "listings" ? (
        <div className="grid sm:grid-cols-2 gap-10">
          <div>
            <h2 className="font-semibold mb-3">Your listings</h2>
            {products.length === 0 ? (
              <p className="text-sm text-muted">No listings yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {products.map((p) => (
                  <li
                    key={p.id}
                    className="border border-charcoal/10 rounded-lg p-3 text-sm flex justify-between"
                  >
                    <span>{p.title}</span>
                    <span className="text-muted">
                      GHS {Number(p.priceGhs).toFixed(2)} · {p.stock} in stock
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="font-semibold mb-3">Add a listing</h2>
            <form onSubmit={handleCreateProduct} className="flex flex-col gap-3">
              <input
                required
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
              />
              <div className="flex gap-3">
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Price (GHS)"
                  value={form.priceGhs}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priceGhs: e.target.value }))
                  }
                  className="flex-1 rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                />
                <input
                  required
                  type="number"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  className="flex-1 rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                />
              </div>
              <input
                required
                placeholder="Photo URLs, comma separated"
                value={form.photos}
                onChange={(e) => setForm((f) => ({ ...f, photos: e.target.value }))}
                className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
              />
              <input
                placeholder="Sizes, comma separated (e.g. M, L, XL)"
                value={form.sizes}
                onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
                className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
              />
              <input
                placeholder="Colors, comma separated"
                value={form.colors}
                onChange={(e) => setForm((f) => ({ ...f, colors: e.target.value }))}
                className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
              />
              <input
                placeholder="Fabric type"
                value={form.fabricType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fabricType: e.target.value }))
                }
                className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
              />
              <input
                placeholder="Occasion tags: wedding, funeral, festival, everyday"
                value={form.occasionTags}
                onChange={(e) =>
                  setForm((f) => ({ ...f, occasionTags: e.target.value }))
                }
                className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Size guide (chest/shoulder measurements)"
                value={form.sizeGuide}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sizeGuide: e.target.value }))
                }
                rows={2}
                className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
              />

              {formError && (
                <p className="text-sm text-terracotta">{formError}</p>
              )}

              <button
                type="submit"
                disabled={submitting || profile.verificationStatus !== "approved"}
                className="bg-terracotta text-white font-medium py-2.5 rounded-full hover:bg-charcoal transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Saving..." : "Publish listing"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div>
          <h2 className="font-semibold mb-3">Orders</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="border border-charcoal/10 rounded-lg p-3 text-sm flex items-center justify-between flex-wrap gap-2"
                >
                  <div>
                    <p className="font-medium">{o.buyerName}</p>
                    <p className="text-muted">
                      {new Date(o.createdAt).toLocaleDateString()} · GHS{" "}
                      {Number(o.totalGhs).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted">{o.status}</span>
                    {o.status === "paid" && (
                      <button
                        onClick={() => updateOrderStatus(o.id, "confirmed")}
                        className="text-xs bg-indigo text-cream px-3 py-1.5 rounded-full"
                      >
                        Confirm order
                      </button>
                    )}
                    {o.status === "confirmed" && (
                      <button
                        onClick={() => updateOrderStatus(o.id, "shipped")}
                        className="text-xs bg-indigo text-cream px-3 py-1.5 rounded-full"
                      >
                        Mark shipped
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
