import type { Device } from "@/types/device";

const networks: Record<string, string> = {
  home: "Home Wi-Fi",
  hotspot: "Phone hotspot",
  campus: "College network",
};

function rows(device: Device): Array<[string, string]> {
  const network = networks[device.network] ?? device.network;
  return [
    ["Manufacturer", device.manufacturer],
    ["Model", device.model],
    ["Brand", device.brand],
    ["Android", device.androidVersion ? `${device.androidVersion} (SDK ${device.sdkInt})` : ""],
    ["Network", network],
    ["Address", device.ipAddress],
    ["Platform", device.platform],
  ].filter((entry): entry is [string, string] => entry[1].length > 0);
}

export function DeviceCard({ device }: { device: Device | null }) {
  if (!device) return null;
  return (
    <section
      className="w-full rounded-2xl border border-stone-300 bg-white p-4 shadow-sm"
      style={{ maxWidth: "384px" }}
    >
      <p className="text-xs uppercase tracking-wide text-stone-500">Phone</p>
      <h2 className="mt-1 text-xl font-semibold">{device.name}</h2>
      <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-y-1 text-sm">
        {rows(device).map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-stone-500">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
