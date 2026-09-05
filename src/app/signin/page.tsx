import { signIn } from "@/lib/actions/auth";
import Link from "next/link";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="mb-1 text-2xl font-bold">Sign in</h1>
      <p className="mb-6 text-sm text-gray-500">Welcome back to J.A Services.</p>

      {message && (
        <p className="mb-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>
      )}
      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={signIn} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded bg-black py-2 font-medium text-white hover:bg-gray-800"
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-black underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
