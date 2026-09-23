export function Breadcrumb({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate?: (path: string) => void;
}) {
  const parts = path.split("/").filter(Boolean);

  return (
    <div className="flex items-center gap-1.5 border-b border-stone-200 bg-stone-50/70 px-4 py-2 text-sm text-stone-600">
      <button
        type="button"
        onClick={() => onNavigate?.("/")}
        className="font-medium hover:text-stone-900 hover:underline"
      >
        Root
      </button>
      {parts.map((part, index) => {
        const subpath = "/" + parts.slice(0, index + 1).join("/");
        const isLast = index === parts.length - 1;
        return (
          <span key={subpath} className="flex items-center gap-1.5">
            <span className="text-stone-400">/</span>
            {isLast ? (
              <span className="font-semibold text-stone-900">{part}</span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate?.(subpath)}
                className="hover:text-stone-900 hover:underline"
              >
                {part}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}

