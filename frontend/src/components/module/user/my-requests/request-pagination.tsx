export function RequestPagination({
  page,
  totalPages,
  query,
  basePath = "/all-requests",
}: {
  page: number;
  totalPages: number;
  query: URLSearchParams;
  basePath?: string;
}) {
  // ...unchanged, except the href helper:
  const href = (target: number) => {
    const params = new URLSearchParams(query);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;