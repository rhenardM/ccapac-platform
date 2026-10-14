export const dynamic = "force-dynamic";

import { z } from "zod";
import { RegisterPageClient } from "./RegisterPageClient";

const emailSchema = z.string().trim().email().max(254);

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const result = emailSchema.safeParse(email);

  return (
    <RegisterPageClient
      initialEmail={result.success ? result.data.toLowerCase() : ""}
    />
  );
}
