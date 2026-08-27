import { Button } from "@/components/ui/button";

interface ContactPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ContactPagination({ page, totalPages, onPageChange }: ContactPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex w-full items-center justify-between pt-2">
      <span className="text-sm text-foreground-muted">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
