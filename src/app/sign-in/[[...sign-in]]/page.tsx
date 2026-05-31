import { redirect } from "next/navigation";
import { SignIn } from "@clerk/nextjs";

import { isClerkEnabled } from "@/lib/env";

export default function SignInPage() {
  // In demo mode there is no auth provider — go straight to the dashboard.
  if (!isClerkEnabled) redirect("/dashboard");

  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <SignIn
        appearance={{ variables: { colorPrimary: "#7c3aed" } }}
        signUpUrl="/sign-up"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
