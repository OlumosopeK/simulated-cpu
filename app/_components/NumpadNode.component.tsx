"use client";

import { useCallback, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useSimulation } from "@/app/_modules/SimulationProvider.module";
import type { PeripheralSnapshot } from "@/types/peripheral.types";

function stopPropagation(e: ReactPointerEvent) {
  e.stopPropagation();
}

export function NumpadNode({ data }: NodeProps) {
  const { removePeripheral, enterNumpadValue } = useSimulation();
  const peripheral = data.peripheral as PeripheralSnapshot | undefined;
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  if (!peripheral) {
    return (
      <div className="bg-white border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-400">
        No numpad data
      </div>
    );
  }

  const storageAddress = (peripheral.meta.storageAddress as number) ?? 0x003A;
  const lastValue = (peripheral.meta.lastValue as number) ?? 0;
  const asHex = (peripheral.meta.asHex as string) ?? "0x00";
  const color = (peripheral.meta.color as string) ?? "#06b6d4";

  const handleSubmit = useCallback(() => {
    const value = parseInt(inputValue);

    if (isNaN(value)) {
      setError("Invalid number");
      return;
    }

    if (value < 0 || value > 255) {
      setError("Must be 0-255");
      return;
    }

    enterNumpadValue(peripheral.id, value);
    setInputValue("");
    setError("");
  }, [inputValue, peripheral.id, enterNumpadValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div 
      className="bg-white border border-zinc-200 border-l-4 rounded-lg shadow-sm px-3 py-2 min-w-52 max-w-56 text-xs text-zinc-700"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-1">
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
          title="Remove numpad"
        >
          ✕
        </button>
      </div>

      <div className="text-[10px] text-zinc-500 mb-1.5">Input • 0-255 decimal</div>

      <div className="nopan nodrag nowheel space-y-1.5" onPointerDownCapture={stopPropagation}>
        {/* Display last value */}
        <div className="flex items-center justify-between bg-zinc-50 rounded px-2 py-1">
          <span className="text-[9px] text-zinc-500">Last value</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[11px] text-zinc-700 tabular-nums">{lastValue}</span>
            <span className="text-[9px] text-zinc-400 font-mono">{asHex}</span>
          </div>
        </div>

        {/* Storage address info */}
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-zinc-500">Storage</span>
          <span className="font-mono text-zinc-600">0x{storageAddress.toString(16).padStart(4, "0")}</span>
        </div>

        {/* Input field */}
        <div className="space-y-0.5">
          <input
            type="number"
            min={0}
            max={255}
            placeholder="Enter value"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1.5 rounded border border-zinc-200 text-xs bg-white text-zinc-700 focus:outline-none focus:ring-1 placeholder:text-zinc-400"
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `0 0 0 1px ${color}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "";
            }}
          />
          {error && <div className="text-[9px] text-red-500">{error}</div>}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          className="w-full px-2 py-1 rounded text-[10px] font-medium text-white transition-opacity hover:opacity-90 active:opacity-80"
          style={{ backgroundColor: color }}
        >
          Enter
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-cyan-400 border-cyan-500"
      />
    </div>
  );
}
