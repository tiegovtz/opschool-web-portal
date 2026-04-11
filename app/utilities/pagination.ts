export type PaginationItem =
  | { type: "page"; value: number }
  | { type: "ellipsis"; key: string };

export const buildPaginationItems = (
  totalPages: number,
  currentPage: number,
): PaginationItem[] => {
  if (totalPages <= 0) return [];

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      type: "page" as const,
      value: index + 1,
    }));
  }

  const pages = new Set<number>([1, totalPages]);
  const windowStart = Math.max(2, currentPage - 1);
  const windowEnd = Math.min(totalPages - 1, currentPage + 1);

  for (let page = windowStart; page <= windowEnd; page += 1) {
    pages.add(page);
  }

  const sortedPages = [...pages].sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  sortedPages.forEach((page, index) => {
    if (index > 0) {
      const previousPage = sortedPages[index - 1]!;
      if (page - previousPage > 1) {
        items.push({
          type: "ellipsis",
          key: `ellipsis-${previousPage}-${page}`,
        });
      }
    }

    items.push({ type: "page", value: page });
  });

  return items;
};
