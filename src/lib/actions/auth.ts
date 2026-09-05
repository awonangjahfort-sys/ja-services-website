"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const fullName = String(formData.get("fullName"));
  const phone = String(formData.get("phone"));

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone }, // read by the handle_new_user() trigger
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/signin?message=Check your email to confirm your account");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/signin?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/account");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
