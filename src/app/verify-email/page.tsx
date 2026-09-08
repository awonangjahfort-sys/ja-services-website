import { verifyEmailOtp, resendEmailOtp } from "@/lib/actions/auth";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; message?: string }>;
}) {
  const { email, error, message } = await searchParams;
  const navy = "#16264F";
  const gold = "#E8C874";
  const cream = "#F2EFE8";

  return (
    <main
      style={{ background: navy, color: cream, minHeight: "100vh", width: "100%" }}
      className="flex flex-col justify-center px-6 py-12"
    >
      <div className="mx-auto w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold" style={{ color: "#fff" }}>
          Check your email
        </h1>
        <p className="mb-6 text-sm" style={{ color: "#C9D2E3" }}>
          We sent a code to <strong>{email}</strong>. Enter it below to finish creating
          your account.
        </p>

        {message && (
          <p
            className="mb-4 rounded px-3 py-2 text-sm"
            style={{ background: "rgba(232,200,116,0.12)", color: gold }}
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

        <form action={verifyEmailOtp} className="flex flex-col gap-4">
          <input type="hidden" name="email" value={email} />
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "#C9D2E3" }}>
              Verification code
            </label>
            <input
              name="token"
              required
              maxLength={10}
              inputMode="numeric"
              autoFocus
              placeholder="Enter code"
              className="w-full rounded px-3 py-3 text-center text-2xl tracking-[0.3em] outline-none"
              style={{
                background: "#0F1B38",
                border: "1px solid rgba(232,200,116,0.25)",
                color: cream,
              }}
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded py-2 font-bold"
            style={{ background: gold, color: navy }}
          >
            Verify and continue
          </button>
        </form>

        <form action={resendEmailOtp} className="mt-4 text-center">
          <input type="hidden" name="email" value={email} />
          <button type="submit" className="text-sm underline" style={{ color: "#9FB0D1" }}>
            Didn&apos;t get a code? Resend
          </button>
        </form>
      </div>
    </main>
  );
}
