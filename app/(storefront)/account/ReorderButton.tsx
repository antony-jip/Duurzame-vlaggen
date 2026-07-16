"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { ButtonVariant, ButtonSize } from "@/components/ui";
import { useCart } from "@/components/cart/CartProvider";
import type { ReorderCartLine } from "@/lib/orders/reorder";

/**
 * Herbestel-knop. Zet de meegegeven (server-gereconstrueerde) regels via de
 * client-side mand (`addItem`) in de winkelmand en navigeert naar /winkelwagen.
 *
 * `stripDesign` = true → verwijder het aangeleverde ontwerp per regel, zodat de
 * klant in de mand een NIEUW ontwerp uploadt ("zelfde bestelling, ander ontwerp").
 * Wordt zowel voor een hele order als voor één losse regel gebruikt.
 */
export function ReorderButton({
  lines,
  stripDesign = false,
  label,
  variant = "primary",
  size = "md",
}: {
  lines: ReorderCartLine[];
  stripDesign?: boolean;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    setBusy(true);
    for (const line of lines) {
      if (stripDesign) {
        // Laat ontwerp-velden weg → klant uploadt een nieuw ontwerp in de mand.
        const { designs, fileUrl, fileName, filePath, fileWarnings, previewUrl, ...rest } =
          line;
        void designs;
        void fileUrl;
        void fileName;
        void filePath;
        void fileWarnings;
        void previewUrl;
        addItem({ ...rest, designs: [] });
      } else {
        addItem(line);
      }
    }
    router.push("/winkelwagen");
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      loading={busy}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
}
