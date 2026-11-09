import { redirect } from "next/navigation";

/**
 * The root URL is reserved for the future patient marketplace.
 * Until it exists, send visitors to the doctor dashboard.
 */
export default function Home() {
  redirect("/dashboard");
}
