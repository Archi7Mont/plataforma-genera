"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function StepNav({
  backHref,
  nextHref,
  nextDisabled,
  backLabel = "Volver",
  nextLabel = "Siguiente",
}: {
  backHref?: string;
  nextHref?: string;
  nextDisabled?: boolean;
  backLabel?: string;
  nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex justify-between">
      <div>
        {backHref && (
          <Link href={backHref}>
            <Button variant="outline">{backLabel}</Button>
          </Link>
        )}
      </div>
      <div>
        {nextHref && (
          <Link href={nextHref}>
            <Button className="bg-orange-600 hover:bg-orange-700" disabled={nextDisabled}>
              {nextLabel}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}



