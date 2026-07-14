import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { getCustomerUser } from "../auth";
import { AccountAuthForm } from "./AccountAuthForm";
import styles from "../account.module.css";

export const metadata: Metadata = {
  title: "Inloggen · Mijn account",
  description: "Log in op je account om je bestellingen te bekijken en snel te herbestellen.",
  robots: { index: false, follow: false },
};

export default async function AccountLoginPage() {
  // Al ingelogd → meteen naar het dashboard.
  const user = await getCustomerUser();
  if (user) redirect("/account");

  return (
    <Container as="section" className={styles.authScreen}>
      <div className={styles.authPanel}>
        <h1 className={styles.authTitle}>Mijn account</h1>
        <p className={styles.authSub}>
          Bekijk je bestellingen en bestel in één klik opnieuw.
        </p>
        <AccountAuthForm />
      </div>
    </Container>
  );
}
