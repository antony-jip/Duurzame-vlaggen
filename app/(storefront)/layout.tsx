import { Header, Footer } from "@/components/ui";
import { CartProvider } from "@/components/cart/CartProvider";
import { getUiCatalog } from "@/lib/i18n";

/**
 * Storefront shell — everything a customer sees (Header + Footer + cart state).
 * Lives in its own route group so `app/admin/**` renders without this chrome:
 * the root layout only provides <html>/<body>/fonts/globals.
 */
export default async function StorefrontLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const catalog = await getUiCatalog();

  return (
    <CartProvider catalog={catalog}>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </CartProvider>
  );
}
