import Link from "next/link";
import Image from "next/image";

const occasions = [
  { label: "Wedding", query: "wedding" },
  { label: "Funeral", query: "funeral" },
  { label: "Festival", query: "festival" },
  { label: "Everyday", query: "everyday" },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-6xl w-full px-4 sm:px-6 pt-16 pb-14 flex flex-col items-center text-center gap-6">
        <Image
          src="/fuguaa_logo.svg"
          alt="Fuguaa"
          width={96}
          height={96}
        />
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight max-w-2xl">
          Smocks from the makers who weave them
        </h1>
        <p
          className="text-lg text-muted max-w-xl italic"
          style={{ fontFamily: "var(--font-voice)" }}
        >
          Three generations of craft — now direct from weaver to you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/shop"
            className="bg-terracotta text-white font-medium px-7 py-3 rounded-full hover:bg-charcoal transition-colors"
          >
            Browse smocks
          </Link>
          <Link
            href="/seller-onboarding"
            className="border border-charcoal/20 text-charcoal font-medium px-7 py-3 rounded-full hover:bg-cream transition-colors"
          >
            Sell on Fuguaa
          </Link>
        </div>
      </section>

      <div className="weave-divider" />

      {/* Occasion browsing */}
      <section className="mx-auto max-w-6xl w-full px-4 sm:px-6 py-14">
        <h2 className="text-2xl font-semibold mb-6">Shop by occasion</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {occasions.map((o) => (
            <Link
              key={o.query}
              href={`/shop?occasion=${o.query}`}
              className="rounded-2xl border border-charcoal/10 bg-cream/60 px-6 py-8 text-center font-medium hover:border-terracotta hover:bg-cream transition-colors"
            >
              {o.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Why Fuguaa */}
      <section className="bg-indigo text-cream py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 grid sm:grid-cols-3 gap-10">
          <div>
            <h3 className="font-semibold text-lg mb-2">Verified weavers</h3>
            <p className="text-cream/80 text-sm">
              Every seller is identity-verified before they can list, so
              you&apos;re always buying from a real, accountable maker.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Protected payments</h3>
            <p className="text-cream/80 text-sm">
              Pay by Mobile Money or card. Funds are held until you confirm
              your order arrived as described.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Real craft, real story</h3>
            <p className="text-cream/80 text-sm">
              Every shop tells the story of the person who made it — not just
              a product listing.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
