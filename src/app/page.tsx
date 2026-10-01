import Link from "next/link";
import Weave from "@/components/Weave";

const occasions = [
  { key: "wedding", label: "Weddings", bg: "bg-terracotta" },
  { key: "funeral", label: "Funerals", bg: "bg-indigo" },
  { key: "festival", label: "Festivals", bg: "bg-ochre text-charcoal" },
  { key: "everyday", label: "Everyday", bg: "bg-leaf" },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="font-serif text-lg italic text-terracotta">Three generations of craft</p>
        <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">Authentic smocks, straight from the makers</h1>
        <p className="mx-auto mt-4 max-w-xl text-charcoal/80">Discover handwoven Ghanaian smocks from independent sellers, paid for safely with Mobile Money or card.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/shop" className="rounded-full bg-terracotta px-6 py-3 font-medium text-white">Browse smocks</Link>
          <Link href="/auth/signup?role=SELLER" className="rounded-full border border-indigo px-6 py-3 font-medium text-indigo">Start selling</Link>
        </div>
      </section>
      <Weave />
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 font-serif text-2xl italic">Shop by occasion</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {occasions.map((o) => (
            <Link key={o.key} href={`/shop?occasion=${o.key}`} className={`${o.bg} flex h-32 items-end rounded-xl border-b-4 border-charcoal/30 p-4 text-lg font-semibold text-white`}>{o.label}</Link>
          ))}
        </div>
      </section>
    </>
  );
}
