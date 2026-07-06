import { AuthSignIn } from "@/lib/identity";

export const metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="bg-base flex min-h-dvh items-center justify-center p-4">
      <AuthSignIn />
    </main>
  );
}
