import Image from "next/image";
import Link from "next/link";
import Weave from "./Weave";

export default function Header() {
  return (
    <header className="bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Fuguaa" width={56} height={40} className="h-10 w-auto" priority />
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/shop" className="hover:text-terracotta">Shop</Link>
          <Link href="/auth/signup?role=SELLER" className="hover:text-terracotta">Sell</Link>
          <Link href="/auth/login" className="rounded-full bg-indigo px-4 py-1.5 text-cream hover:bg-indigo/90">Log in</Link>
        </nav>
      </div>
      <Weave />
    </header>
  );
}
