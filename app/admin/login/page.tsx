import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, Container } from "@/components/ui";
import { getAdminUser } from "../auth";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Inloggen · Admin",
  robots: { index: false, follow: false },
};

// This page sits OUTSIDE the (dash) route group so the gate never redirects it,
// avoiding a login → gate → login loop.
export default async function AdminLoginPage() {
  // Already signed in as an admin → skip straight to the dashboard.
  const user = await getAdminUser();
  if (user) redirect("/admin");

  return (
    <Container variant="narrow" className={styles.wrap}>
      <Card elevation="raised" className={styles.panel}>
        <p className={styles.eyebrow}>Duurzame Vlaggen</p>
        <h1 className={styles.title}>Back-office</h1>
        <p className={styles.subtitle}>Log in met je staff-account.</p>
        <LoginForm />
      </Card>
    </Container>
  );
}
