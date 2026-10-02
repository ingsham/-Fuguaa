import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-charcoal/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
        <p>Fuguaa — three generations of craft.</p>
        <Link
          href="/signup/seller"
          className="font-medium text-charcoal hover:text-terracotta transition-colors"
        >
          Sell on Fuguaa →
        </Link>
        <p>&copy; {new Date().getFullYear()} Fuguaa. Made in Ghana.</p>
      </div>
    </footer>
  );
}
