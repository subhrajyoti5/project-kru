const roots = ["Download", "DCIM", "Pictures", "Documents", "Music", "Movies"];

export function Sidebar({ onOpen, current }: { onOpen: (path: string) => void; current: string }) {
  return (
    <nav className="flex flex-col gap-1 border-r border-stone-200 p-3">
      <button type="button" className="rounded-lg px-3 py-2 text-left" onClick={() => onOpen("/")}>
        Phone
      </button>
      {roots.map((name) => (
        <button
          key={name}
          type="button"
          className={`rounded-lg px-3 py-2 text-left ${current === `/${name}` ? "bg-stone-200" : "text-stone-700"}`}
          onClick={() => onOpen(`/${name}`)}
        >
          {name}
        </button>
      ))}
    </nav>
  );
}
