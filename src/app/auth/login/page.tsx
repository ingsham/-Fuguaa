import Link from "next/link";
import AuthForm from "@/components/AuthForm";
export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-6 font-serif text-3xl italic">Welcome back</h1>
      <AuthForm mode="login" />
      <p className="mt-4 text-sm">New here? <Link href="/auth/signup" className="text-terracotta underline">Create an account</Link></p>
    </div>
  );
}
