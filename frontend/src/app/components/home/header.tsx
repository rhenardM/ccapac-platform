import { getUser } from "@/lib/auth-server";
import Header from "./header/Header";

export default async function HeaderWrapper() {
  const user = await getUser();
  return <Header user={user} />;
}
