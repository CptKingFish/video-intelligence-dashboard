import { redirect } from "next/navigation";
import { SignUp } from "@clerk/nextjs";

import { isClerkEnabled } from "@/lib/env";

export default function SignUpPage() {
  if (!isClerkEnabled) redirect("/dashboard");

  return (
    <div className="grid min-h-screen place-items-center px-6 py-12">
      <SignUp
        appearance={{ variables: { colorPrimary: "#7c3aed" } }}
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
