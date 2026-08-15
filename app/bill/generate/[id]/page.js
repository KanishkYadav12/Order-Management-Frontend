"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Legacy route. `/bill/generate/:tableId` and `/bill/table/:tableId` were two
 * screens doing the same job with different code; this one now forwards to the
 * other, which resolves the table to a bill and opens the single bill page.
 */
export default function GenerateBillPage() {
  const { id } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (id) router.replace(`/bill/table/${id}`);
  }, [id, router]);

  return null;
}
