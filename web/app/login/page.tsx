import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getTeacher } from "@/lib/auth";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <Link href="/" className="font-mono text-sm font-semibold tracking-widest text-accent">
          APEX
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Öğretmen girişi</h1>
      </div>
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>
      <AuthForm />
    </main>
  );
}

// Zaten giriş yapmışsa panele gönder. Oturum okuma istek zamanında olduğu için Suspense içinde.
async function RedirectIfSignedIn() {
  if (await getTeacher()) redirect("/dashboard");
  return null;
}
