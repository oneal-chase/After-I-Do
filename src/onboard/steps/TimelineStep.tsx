import { useCallback } from "react";
import { useDesignSystem } from "../../context/DesignSystemContext";

export default function TimelineStep() {
  const { config, updateConfig } = useDesignSystem();

  const updatePhase = useCallback(
    (index: number, field: "start" | "end", value: string) => {
      const timeline = [...config.timeline];
      timeline[index] = { ...timeline[index], [field]: value };
      updateConfig({ timeline });
    },
    [config.timeline, updateConfig],
  );

  const totalMinutes = config.timeline.reduce((acc, phase) => {
    const [sh, sm] = phase.start.split(":").map(Number);
    const [eh, em] = phase.end.split(":").map(Number);
    return acc + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);

  return (
    <div className="max-w-sm mx-auto space-y-6">
      <div>
        <h3 className="font-display text-sm text-navy mb-1">Wedding Day Timeline</h3>
        <p className="font-body text-[10px] text-parchment mb-4">
          Define the time ranges for each phase. Photos are automatically sorted into Google Drive folders based on the current time.
        </p>
      </div>

      {/* Visual timeline bar */}
      <div className="relative h-8 rounded-full overflow-hidden border border-parchment">
        {config.timeline.map((phase, i) => {
          const [sh, sm] = phase.start.split(":").map(Number);
          const [eh, em] = phase.end.split(":").map(Number);
          const startMin = sh * 60 + sm;
          const endMin = eh * 60 + em;
          const width = ((endMin - startMin) / 1440) * 100;
          const left = (startMin / 1440) * 100;

          const colors = [
            "bg-navy/20",
            "bg-gold/40",
            "bg-mauve/30",
            "bg-floral-slate/30",
          ];

          return (
            <div
              key={phase.id}
              className={`absolute top-0 h-full ${colors[i % colors.length]} border-r border-parchment/50 flex items-center justify-center`}
              style={{ left: `${left}%`, width: `${width}%` }}
            >
              <span className="font-body text-[9px] text-navy/70 font-medium truncate px-1">
                {phase.name}
              </span>
            </div>
          );
        })}
      </div>

      <p className="font-body text-[10px] text-parchment text-center">
        Total: {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
      </p>

      {/* Phase editors */}
      <div className="space-y-3">
        {config.timeline.map((phase, i) => (
          <div key={phase.id} className="flex items-center gap-3 p-3 rounded-xl border border-parchment bg-cream/50">
            <div className="flex-1 min-w-0">
              <p className="font-body text-xs font-medium text-navy">{phase.name}</p>
              <p className="font-body text-[10px] text-parchment">{phase.folderName}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={phase.start}
                onChange={(e) => updatePhase(i, "start", e.target.value)}
                className="w-24 px-2 py-1.5 rounded-lg border border-parchment/60 font-body text-[11px] text-navy bg-cream/50 focus:outline-none focus:border-gold"
              />
              <span className="font-body text-[10px] text-parchment">to</span>
              <input
                type="time"
                value={phase.end}
                onChange={(e) => updatePhase(i, "end", e.target.value)}
                className="w-24 px-2 py-1.5 rounded-lg border border-parchment/60 font-body text-[11px] text-navy bg-cream/50 focus:outline-none focus:border-gold"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
