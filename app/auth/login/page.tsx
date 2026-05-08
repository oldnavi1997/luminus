import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
