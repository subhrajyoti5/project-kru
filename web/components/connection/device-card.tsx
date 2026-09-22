import type { Device } from "@/types/device";

export function DeviceCard({ device }: { device: Device | null }) {
  if (!device) return null;
  return (
    <section className="rounded-2xl border border-stone-300 bg-white px-4 py-3">
      <p className="font-medium">{device.name}</p>
      <p className="text-sm text-stone-600">{device.platform}</p>
    </section>
  );
}
