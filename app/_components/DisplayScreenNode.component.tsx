"use client";

import { useCallback, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useSimulation } from "@/app/_modules/SimulationProvider.module";
import type { PeripheralSnapshot } from "@/types/peripheral.types";

function stopPropagation(e: ReactPointerEvent) {
  e.stopPropagation();
}

function hex(n: number): string {
  return `0x${n.toString(16).padStart(4, "0")}`;
}

export function DisplayScreenNode({ data }: NodeProps) {
  const { removePeripheral, setPeripheralSourceAddress, setPeripheralDisplayMode } =
    useSimulation();
  const peripheral = data.peripheral as PeripheralSnapshot | undefined;
  const [hexInput, setHexInput] = useState("");
  const [error, setError] = useState("");

  if (!peripheral) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-400">
        No display data
      </div>
    );
  }

  const sourceAddress = (peripheral.meta.sourceAddress as number) ?? 0x003A;
  const displayValue = (peripheral.meta.displayValue as number | null) ?? null;
  const displayString = (peripheral.meta.displayString as string) ?? "";
  const displayMode = (peripheral.meta.displayMode as "hex" | "ascii" | "dec" | "bin") ?? "hex";
  const errorState = (peripheral.meta.errorState as string | null) ?? null;
  const color = (peripheral.meta.color as string) ?? "#f59e0b";

  const handleHexSubmit = useCallback(() => {
    const parsed = parseInt(hexInput, 16);
    if (isNaN(parsed)) {
      setError("Invalid hex number");
      return;
    }
    if (parsed < 0 || parsed > 0xFFFF) {
      setError("Address must be 0x0000–0xFFFF");
      return;
    }
    setPeripheralSourceAddress(peripheral.id, parsed);
    setHexInput("");
    setError("");
  }, [hexInput, peripheral.id, setPeripheralSourceAddress]);

  const handleModeChange = useCallback(
    (newMode: "hex" | "ascii" | "dec" | "bin") => {
      setPeripheralDisplayMode(peripheral.id, newMode);
    },
    [peripheral.id, setPeripheralDisplayMode]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleHexSubmit();
    }
  };

  const displayValueString = displayValue !== null ? displayValue.toString() : "—";

  return (
    <div 
      className="bg-white border border-zinc-200 border-l-4 rounded-lg shadow-sm px-3 py-2 min-w-60 max-w-72 text-xs text-zinc-700"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span 
            className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" 
            style={{ backgroundColor: color }}
          />
          <span className="font-semibold text-[11px] truncate">{peripheral.name}</span>
        </div>
        <button
          onClick={() => removePeripheral(peripheral.id)}
          className="text-red-400 hover:text-red-600 text-[10px] font-bold px-0.5 rounded hover:bg-red-50 transition-colors"
          title="Remove display"
        >
          ✕
        </button>
      </div>

      <div className="text-[10px] text-zinc-500 mb-2">Memory Display • Read-only Output</div>

      <div className="nopan nodrag nowheel space-y-2" onPointerDownCapture={stopPropagation}>
        {/* Display value box */}
        <div 
          className="border rounded-md px-3 py-2.5"
          style={{
            backgroundColor: `${color}15`,
            borderColor: `${color}40`
          }}
        >
          <div className="font-medium mb-1 text-[9px]" style={{ color: `${color}CC` }}>Display Output</div>
          <div className="text-lg font-mono font-bold break-words" style={{ color: `${color}DD` }}>
            {errorState ? (
              <span className="text-red-500 text-[10px]">Error: {errorState}</span>
            ) : (
              displayString || "—"
            )}
          </div>
          <div className="text-[9px] mt-1" style={{ color: `${color}AA` }}>
            Raw: {displayValueString} ({displayValue !== null ? `0x${displayValue.toString(16).toUpperCase().padStart(2, "0")}` : "—"})
          </div>
        </div>

        {/* Display mode selector */}
        <div className="flex items-center justify-between bg-zinc-50 rounded px-2 py-1.5 border border-zinc-200">
          <span className="text-[9px] text-zinc-600 font-medium">Mode</span>
          <div className="flex gap-1">
            {(["hex", "dec", "bin", "ascii"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
                  displayMode === mode
                    ? "text-white"
                    : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
                }`}
                style={displayMode === mode ? { backgroundColor: color } : undefined}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Current address info */}
        <div className="flex items-center justify-between text-[9px] bg-zinc-50 rounded px-2 py-1">
          <span className="text-zinc-600 font-medium">Addr</span>
          <span className="font-mono text-zinc-700">{hex(sourceAddress)}</span>
        </div>

        {/* Address input (hex only) */}
        <div className="flex gap-1">
          <input
            type="text"
            placeholder="0x0000"
            value={hexInput}
            onChange={(e) => {
              setHexInput(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 px-2 py-1 rounded-md border border-zinc-200 text-xs bg-white text-zinc-700 focus:outline-none focus:ring-1 font-mono"
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 1px ${color}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "";
            }}
          />
          <button
            onClick={handleHexSubmit}
            className="px-2 py-1 rounded-md text-[10px] font-medium text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: color }}
          >
            Set
          </button>
        </div>

        {/* Error message */}
        {error && <div className="text-[9px] text-red-500 bg-red-50 rounded px-2 py-1">{error}</div>}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-blue-400 border-blue-500"
      />
    </div>
  );
}
