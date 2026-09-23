const roots = ["Download", "DCIM", "Pictures", "Documents", "Music", "Movies"];

export function Sidebar({ onOpen, current }: { onOpen: (path: string) => void; current: string }) {
  return (
    <nav className="flex flex-col gap-1 border-r border-stone-200 p-3">
      <button
        type="button"
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
          current === "/" || current === "" ? "bg-stone-200 text-stone-900" : "text-stone-700 hover:bg-stone-100"
        }`}
        onClick={() => onOpen("/")}
      >
        <span>📱</span>
        <span>Storage Root</span>
      </button>
      {roots.map((name) => {
        const isActive = current === `/${name}` || current.startsWith(`/${name}/`);
        return (
          <button
            key={name}
            type="button"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
              isActive ? "bg-stone-200 text-stone-900" : "text-stone-700 hover:bg-stone-100"
            }`}
            onClick={() => onOpen(`/${name}`)}
          >
            <span>📁</span>
            <span>{name}</span>
          </button>
        );
      })}
    </nav>
  );
}
