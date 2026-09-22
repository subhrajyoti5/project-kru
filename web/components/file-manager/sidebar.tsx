const roots = ["Photos", "Videos", "Documents", "Downloads"];

export function Sidebar() {
  return (
    <nav className="flex flex-col gap-1 border-r border-stone-200 p-3">
      {roots.map((name) => (
        <span key={name} className="rounded-lg px-3 py-2 text-stone-700">
          {name}
        </span>
      ))}
    </nav>
  );
}
