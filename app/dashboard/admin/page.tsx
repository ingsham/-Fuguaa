"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type PendingSeller = {
  id: string;
  shopName: string;
  region: string | null;
  ghanaCardDocUrl: string | null;
  createdAt: string;
};

type Dispute = {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  shopName: string;
  totalGhs: string;
};

type Metrics = { verifiedSellers: number; totalOrders: number; gmvGhs: number };

type AdminProduct = {
  id: string;
  title: string;
  description: string | null;
  priceGhs: string;
  stock: number;
  photos: string[];
  sizes: string[];
  colors: string[];
  fabricType: string | null;
  occasionTags: string[];
  sizeGuide: string | null;
  isActive: boolean;
  shopName: string;
};

type ProductEditForm = {
  title: string;
  description: string;
  priceGhs: string;
  stock: string;
  photos: string;
  sizes: string;
  colors: string;
  fabricType: string;
  occasionTags: string;
  sizeGuide: string;
};

function toEditForm(p: AdminProduct): ProductEditForm {
  return {
    title: p.title,
    description: p.description ?? "",
    priceGhs: p.priceGhs,
    stock: String(p.stock),
    photos: (p.photos ?? []).join(", "),
    sizes: (p.sizes ?? []).join(", "),
    colors: (p.colors ?? []).join(", "),
    fabricType: p.fabricType ?? "",
    occasionTags: (p.occasionTags ?? []).join(", "),
    sizeGuide: p.sizeGuide ?? "",
  };
}

function splitList(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<"verification" | "disputes" | "listings">(
    "listings"
  );
  const [sellers, setSellers] = useState<PendingSeller[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [allProducts, setAllProducts] = useState<AdminProduct[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductEditForm | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  function loadAll() {
    fetch("/api/admin/sellers")
      .then((r) => r.json())
      .then((d) => setSellers(d.sellers ?? []));
    fetch("/api/admin/disputes")
      .then((r) => r.json())
      .then((d) => setDisputes(d.disputes ?? []));
    fetch("/api/admin/metrics")
      .then((r) => r.json())
      .then(setMetrics);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setAllProducts(d.products ?? []));
  }

  useEffect(() => {
    if (session?.user?.role !== "admin") return;
    loadAll();
  }, [session]);

  if (status === "loading") return null;

  if (session?.user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted mb-4">Admin access only.</p>
        <button
          onClick={() => router.push("/")}
          className="bg-terracotta text-white font-medium px-6 py-2.5 rounded-full"
        >
          Go home
        </button>
      </div>
    );
  }

  async function verifySeller(id: string, decision: "approved" | "rejected") {
    const res = await fetch(`/api/admin/sellers/${id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    if (res.ok) {
      setSellers((prev) => prev.filter((s) => s.id !== id));
    }
  }

  async function resolveDispute(
    id: string,
    resolution: "resolved" | "rejected",
    refundBuyer: boolean
  ) {
    const res = await fetch(`/api/admin/disputes/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: resolution, refundBuyer }),
    });
    if (res.ok) {
      setDisputes((prev) => prev.filter((d) => d.id !== id));
    }
  }

  function startEdit(p: AdminProduct) {
    setEditingId(p.id);
    setEditForm(toEditForm(p));
  }

  async function saveEdit(id: string) {
    if (!editForm) return;
    setSavingId(id);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editForm.title,
        description: editForm.description || undefined,
        priceGhs: Number(editForm.priceGhs),
        stock: Number(editForm.stock),
        photos: splitList(editForm.photos),
        sizes: splitList(editForm.sizes),
        colors: splitList(editForm.colors),
        fabricType: editForm.fabricType || undefined,
        occasionTags: splitList(editForm.occasionTags),
        sizeGuide: editForm.sizeGuide || undefined,
      }),
    });
    const data = await res.json();
    setSavingId(null);
    if (res.ok) {
      setAllProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data.product } : p))
      );
      setEditingId(null);
      setEditForm(null);
    }
  }

  async function toggleActive(p: AdminProduct) {
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    if (res.ok) {
      setAllProducts((prev) =>
        prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x))
      );
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this listing permanently?")) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAllProducts((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Admin</h1>

      {metrics && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="border border-charcoal/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold">{metrics.verifiedSellers}</p>
            <p className="text-xs text-muted">Verified sellers</p>
          </div>
          <div className="border border-charcoal/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold">{metrics.totalOrders}</p>
            <p className="text-xs text-muted">Total orders</p>
          </div>
          <div className="border border-charcoal/10 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold">
              GHS {metrics.gmvGhs.toFixed(0)}
            </p>
            <p className="text-xs text-muted">Gross volume</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-charcoal/10">
        {(
          [
            ["listings", `Listings (${allProducts.length})`],
            ["verification", `Verification (${sellers.length})`],
            ["disputes", `Disputes (${disputes.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === key
                ? "border-terracotta text-terracotta"
                : "border-transparent text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <div>
          {allProducts.length === 0 ? (
            <p className="text-sm text-muted">No listings yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {allProducts.map((p) => (
                <li key={p.id} className="border border-charcoal/10 rounded-xl p-4">
                  {editingId === p.id && editForm ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm((f) => f && { ...f, title: e.target.value })
                        }
                        placeholder="Title"
                        className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm(
                            (f) => f && { ...f, description: e.target.value }
                          )
                        }
                        placeholder="Description"
                        rows={2}
                        className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <input
                          value={editForm.priceGhs}
                          onChange={(e) =>
                            setEditForm(
                              (f) => f && { ...f, priceGhs: e.target.value }
                            )
                          }
                          type="number"
                          step="0.01"
                          placeholder="Price (GHS)"
                          className="flex-1 rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                        />
                        <input
                          value={editForm.stock}
                          onChange={(e) =>
                            setEditForm((f) => f && { ...f, stock: e.target.value })
                          }
                          type="number"
                          placeholder="Stock"
                          className="flex-1 rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                        />
                      </div>
                      <input
                        value={editForm.photos}
                        onChange={(e) =>
                          setEditForm((f) => f && { ...f, photos: e.target.value })
                        }
                        placeholder="Photo URLs, comma separated"
                        className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                      />
                      <input
                        value={editForm.sizes}
                        onChange={(e) =>
                          setEditForm((f) => f && { ...f, sizes: e.target.value })
                        }
                        placeholder="Sizes, comma separated"
                        className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                      />
                      <input
                        value={editForm.colors}
                        onChange={(e) =>
                          setEditForm((f) => f && { ...f, colors: e.target.value })
                        }
                        placeholder="Colors, comma separated"
                        className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                      />
                      <input
                        value={editForm.fabricType}
                        onChange={(e) =>
                          setEditForm(
                            (f) => f && { ...f, fabricType: e.target.value }
                          )
                        }
                        placeholder="Fabric / material"
                        className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                      />
                      <input
                        value={editForm.occasionTags}
                        onChange={(e) =>
                          setEditForm(
                            (f) => f && { ...f, occasionTags: e.target.value }
                          )
                        }
                        placeholder="Occasion tags, comma separated"
                        className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                      />
                      <textarea
                        value={editForm.sizeGuide}
                        onChange={(e) =>
                          setEditForm(
                            (f) => f && { ...f, sizeGuide: e.target.value }
                          )
                        }
                        placeholder="Size guide"
                        rows={2}
                        className="rounded-lg border border-charcoal/20 px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => saveEdit(p.id)}
                          disabled={savingId === p.id}
                          className="text-sm bg-forest text-white px-4 py-2 rounded-full disabled:opacity-50"
                        >
                          {savingId === p.id ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditForm(null);
                          }}
                          className="text-sm border border-charcoal/20 px-4 py-2 rounded-full"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-medium">
                          {p.title}{" "}
                          {!p.isActive && (
                            <span className="text-xs text-muted">(hidden)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted">
                          {p.shopName} · GHS {Number(p.priceGhs).toFixed(2)} ·{" "}
                          {p.stock} in stock
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-xs bg-indigo text-cream px-3 py-1.5 rounded-full"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleActive(p)}
                          className="text-xs border border-charcoal/20 px-3 py-1.5 rounded-full"
                        >
                          {p.isActive ? "Hide" : "Unhide"}
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="text-xs text-terracotta px-3 py-1.5 rounded-full"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "verification" && (
        <div>
          {sellers.length === 0 ? (
            <p className="text-sm text-muted">Nothing pending.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {sellers.map((s) => (
                <li
                  key={s.id}
                  className="border border-charcoal/10 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
                >
                  <div>
                    <p className="font-medium">{s.shopName}</p>
                    <p className="text-sm text-muted">{s.region}</p>
                    {s.ghanaCardDocUrl && (
                      <a
                        href={s.ghanaCardDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-terracotta underline"
                      >
                        View ID document
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => verifySeller(s.id, "approved")}
                      className="text-sm bg-forest text-white px-4 py-2 rounded-full"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => verifySeller(s.id, "rejected")}
                      className="text-sm border border-charcoal/20 px-4 py-2 rounded-full"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "disputes" && (
        <div>
          {disputes.length === 0 ? (
            <p className="text-sm text-muted">No open disputes.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {disputes.map((d) => (
                <li key={d.id} className="border border-charcoal/10 rounded-xl p-4">
                  <p className="font-medium">
                    {d.shopName} · GHS {Number(d.totalGhs).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted mt-1">{d.reason}</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => resolveDispute(d.id, "resolved", true)}
                      className="text-sm bg-terracotta text-white px-4 py-2 rounded-full"
                    >
                      Refund buyer
                    </button>
                    <button
                      onClick={() => resolveDispute(d.id, "rejected", false)}
                      className="text-sm border border-charcoal/20 px-4 py-2 rounded-full"
                    >
                      Release to seller
                    </button>
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
