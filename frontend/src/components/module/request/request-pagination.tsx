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

export function RequestPagination({
  page,
  totalPages,
  query,
}: {
  page: number;
  totalPages: number;
  query: URLSearchParams; // the active filters, without page
}) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams(query);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/requests?${qs}` : "/requests";
  };

  const numbers = [...new Set([1, page - 1, page, page + 1, totalPages])]
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  numbers.forEach((n, index) => {
    if (index > 0 && n - numbers[index - 1] > 1) items.push("gap");
    items.push(n);
  });

  const off = "pointer-events-none opacity-50";

  return (
    <Pagination className="pt-4">
      <PaginationContent>
        <PaginationItem>
          <Link
            href={href(page - 1)}
            aria-label="Previous page"
            aria-disabled={page <= 1}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "gap-1 pl-2.5",
              page <= 1 && off,
            )}
          >
            <ChevronLeft className="size-4" />
            <span className="hidden sm:block">Previous</span>
          </Link>
        </PaginationItem>

        {items.map((item, index) =>
          item === "gap" ? (
            <PaginationItem key={`gap-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <Link
                href={href(item)}
                aria-current={item === page ? "page" : undefined}
                className={buttonVariants({
                  variant: item === page ? "outline" : "ghost",
                  size: "icon",
                })}
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
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "gap-1 pr-2.5",
              page >= totalPages && off,
            )}
          >
            <span className="hidden sm:block">Next</span>
            <ChevronRight className="size-4" />
          </Link>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
