import Link from "next/link";
import AuthForm from "@/components/AuthForm";
export default function SignupPage({ searchParams }: { searchParams: { role?: string } }) {
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 font-serif text-3xl italic">Join Fuguaa</h1>
      <AuthForm mode="signup" defaultRole={searchParams.role === "SELLER" ? "SELLER" : "BUYER"} />
      <p className="mt-4 text-sm">Already have an account? <Link href="/auth/login" className="text-terracotta underline">Log in</Link></p>
    </div>
  );
}
