import { signIn } from "@/lib/actions/auth";
import Link from "next/link";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main
      style={{ background: "#16264F", color: "#F2EFE8", minHeight: "100vh" }}
      className="mx-auto flex max-w-sm flex-col justify-center px-6 py-12"
    >
      <h1 className="mb-1 text-2xl font-bold" style={{ color: "#fff" }}>
        Sign in
      </h1>
      <p className="mb-6 text-sm" style={{ color: "#C9D2E3" }}>
        Welcome back to J.A Services.
      </p>

      {message && (
        <p
          className="mb-4 rounded px-3 py-2 text-sm"
          style={{ background: "rgba(232,200,116,0.12)", color: "#E8C874" }}
        >
          {message}
        </p>
      )}
      {error && (
        <p
          className="mb-4 rounded px-3 py-2 text-sm"
          style={{ background: "rgba(232,134,134,0.12)", color: "#E88686" }}
        >
          {error}
        </p>
      )}

      <form action={signIn} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "#C9D2E3" }}>
            Email
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded px-3 py-2 outline-none"
            style={{ background: "#0F1B38", border: "1px solid rgba(232,200,116,0.25)", color: "#F2EFE8" }}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "#C9D2E3" }}>
            Password
          </label>
          <input
            name="password"
            type="password"
            required
            className="w-full rounded px-3 py-2 outline-none"
            style={{ background: "#0F1B38", border: "1px solid rgba(232,200,116,0.25)", color: "#F2EFE8" }}
          />
        </div>
        <button
          type="submit"
          className="mt-2 rounded py-2 font-bold"
          style={{ background: "#E8C874", color: "#16264F" }}
        >
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: "#9FB0D1" }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" style={{ color: "#E8C874", fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </main>
  );
}
