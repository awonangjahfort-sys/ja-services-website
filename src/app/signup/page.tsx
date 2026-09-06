import { signUp } from "@/lib/actions/auth";
import Link from "next/link";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main
      style={{ background: "#16264F", color: "#F2EFE8", minHeight: "100vh", width: "100%" }}
      className="flex flex-col justify-center px-6 py-12"
    >
    <div className="mx-auto w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-bold" style={{ color: "#fff" }}>
        Create your account
      </h1>
      <p className="mb-6 text-sm" style={{ color: "#C9D2E3" }}>
        For Masterclass enrollment and J.A Products orders.
      </p>

      {error && (
        <p
          className="mb-4 rounded px-3 py-2 text-sm"
          style={{ background: "rgba(232,134,134,0.12)", color: "#E88686" }}
        >
          {error}
        </p>
      )}

      <form action={signUp} className="flex flex-col gap-4">
        <Field label="Full name" name="fullName" required />
        <Field label="Phone number" name="phone" type="tel" placeholder="6XXXXXXXX" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Password" name="password" type="password" minLength={6} required />

        <button
          type="submit"
          className="mt-2 rounded py-2 font-bold"
          style={{ background: "#E8C874", color: "#16264F" }}
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: "#9FB0D1" }}>
        Already have an account?{" "}
        <Link href="/signin" style={{ color: "#E8C874", fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium" style={{ color: "#C9D2E3" }}>
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        className="w-full rounded px-3 py-2 outline-none"
        style={{
          background: "#0F1B38",
          border: "1px solid rgba(232,200,116,0.25)",
          color: "#F2EFE8",
        }}
      />
    </div>
  );
}
