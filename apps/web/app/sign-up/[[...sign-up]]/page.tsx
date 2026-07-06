import { AuthSignUp } from "@/lib/identity";

export const metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <main className="bg-base flex min-h-dvh items-center justify-center p-4">
      <AuthSignUp />
    </main>
  );
}
