import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  query?: URLSearchParams; // the active filters, without page
  basePath: string;
  total?: number; // optional: shows "Showing 9-16 of 40"
  limit?: number;
};

export function ListPagination({
  page,
  totalPages,
  query,
  basePath,
  total,
  limit,
}: Props) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams(query);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const numbers = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  numbers.forEach((n, index) => {
    if (index > 0 && n - numbers[index - 1] > 1) items.push("gap");
    items.push(n);
  });

  const from = total && limit ? (page - 1) * limit + 1 : null;
  const to = total && limit ? Math.min(page * limit, total) : null;

  const nav = cn(
    buttonVariants({ variant: "outline", size: "sm" }),
    "gap-1 transition-all hover:-translate-y-px hover:border-primary/40 hover:text-primary",
  );
  const off = "pointer-events-none opacity-40";

  return (
    <div className="flex flex-col items-center gap-3 pt-6 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground tabular-nums">
        {from && to ? (
          <>
            Showing{" "}
            <span className="font-medium text-foreground">
              {from}–{to}
            </span>{" "}
            of <span className="font-medium text-foreground">{total}</span>
          </>
        ) : (
          <>
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            {totalPages}
          </>
        )}
      </p>

      <Pagination className="mx-0 w-auto">
        <PaginationContent className="gap-1.5">
          <PaginationItem>
            <Link
              href={href(page - 1)}
              aria-label="Previous page"
              aria-disabled={page <= 1}
              tabIndex={page <= 1 ? -1 : undefined}
              className={cn(nav, page <= 1 && off)}
            >
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Previous</span>
            </Link>
          </PaginationItem>

          {/* page numbers need room, so phones only get Previous / Next */}
          {items.map((item, index) =>
            item === "gap" ? (
              <PaginationItem key={`gap-${index}`} className="hidden sm:block">
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item} className="hidden sm:block">
                <Link
                  href={href(item)}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  className={cn(
                    buttonVariants({
                      variant: item === page ? "default" : "ghost",
                      size: "icon-sm",
                    }),
                    "tabular-nums transition-all",
                    item === page
                      ? "shadow-md shadow-primary/30"
                      : "hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {item}
                </Link>
              </PaginationItem>
            ),
          )}

          <PaginationItem>
            <Link
              href={href(page + 1)}
              aria-label="Next page"
              aria-disabled={page >= totalPages}
              tabIndex={page >= totalPages ? -1 : undefined}
              className={cn(nav, page >= totalPages && off)}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="size-4" />
            </Link>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
