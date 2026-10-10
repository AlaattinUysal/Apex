import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getTeacher } from "@/lib/auth";
import { authDestination } from "@/lib/auth-destination";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div>
        <Link href="/" className="font-mono text-sm font-semibold tracking-widest text-accent">
          APEX
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Öğretmen girişi</h1>
      </div>
      <Suspense fallback={null}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const next = authDestination((await searchParams).next);
  if (await getTeacher()) redirect(next);
  return <AuthForm next={next} />;
}
