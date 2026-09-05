import { signUp } from "@/lib/actions/auth";
import Link from "next/link";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
      <p className="mb-6 text-sm text-gray-500">
        For Masterclass enrollment and J.A Products orders.
      </p>

      {error && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <form action={signUp} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Full name</label>
          <input
            name="fullName"
            required
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phone number</label>
          <input
            name="phone"
            type="tel"
            required
            placeholder="6XXXXXXXX"
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
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
            minLength={6}
            className="w-full rounded border border-gray-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded bg-black py-2 font-medium text-white hover:bg-gray-800"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/signin" className="font-medium text-black underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
