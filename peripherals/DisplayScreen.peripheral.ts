import {
  PeripheralStatus,
  type Peripheral,
  type Interrupt,
  type PeripheralSnapshot,
} from "@/types/peripheral.types";
import type { MemoryService } from "@/services/Memory.service";

export type DisplayMode = "hex" | "ascii" | "dec" | "bin";

export class DisplayPeripheral implements Peripheral {
  readonly id: string;
  readonly name: string;
  priority: number;
  status: PeripheralStatus;

  private handlerAddress: number;
  private readonly memory: MemoryService;
  private sourceAddress: number;
  private displayValue: number | null;
  private displayString: string;
  private lastReadAddress: number | null;
  private lastUpdatedAt: number;
  private displayMode: DisplayMode;
  private errorState: string | null;
  private color: string;

  constructor(
    id: string,
    name: string,
    memory: MemoryService,
    handlerAddress = 0,
    sourceAddress = 0x003A,
    displayMode: DisplayMode = "hex",
    color: string = "#f59e0b",
  ) {
    this.id = id;
    this.name = name;
    this.priority = 0;
    this.status = PeripheralStatus.DISCONNECTED;

    this.handlerAddress = handlerAddress;
    this.memory = memory;
    this.sourceAddress = sourceAddress;
    this.displayMode = displayMode;
    this.color = color;

    this.displayValue = null;
    this.displayString = "";
    this.lastReadAddress = null;
    this.lastUpdatedAt = Date.now();
    this.errorState = null;
  }

  connect(): void {
    if (this.status === PeripheralStatus.DISCONNECTED) {
      this.status = PeripheralStatus.IDLE;
    }
  }

  disconnect(): void {
    this.status = PeripheralStatus.DISCONNECTED;
  }

  setSourceAddress(address: number): void {
    this.sourceAddress = address;
  }

  setDisplayMode(mode: DisplayMode): void {
    this.displayMode = mode;
  }

  getDisplayString(): string {
    return this.displayString;
  }

  getDisplayValue(): number | null {
    return this.displayValue;
  }

  getErrorState(): string | null {
    return this.errorState;
  }

  getColor(): string {
    return this.color;
  }

  setColor(color: string): void {
    this.color = color;
  }

  trigger(): void {
    // Output peripheral has no external trigger behavior by default.
  }

  tick(): Interrupt | null {
    if (this.status === PeripheralStatus.DISCONNECTED) return null;

    this.status = PeripheralStatus.ACTIVE;

    try {
      const value = this.memory.read(this.sourceAddress);
      this.displayValue = value;
      this.lastReadAddress = this.sourceAddress;
      this.lastUpdatedAt = Date.now();
      this.errorState = null;

      switch (this.displayMode) {
        case "hex":
          this.displayString = `0x${value.toString(16).padStart(2, "0").toUpperCase()}`;
          break;
        case "dec":
          this.displayString = `${value}`;
          break;
        case "bin":
          this.displayString = `0b${value.toString(2).padStart(8, "0")}`;
          break;
        case "ascii":
          const char = String.fromCharCode(value);
          this.displayString = value >= 0x20 && value <= 0x7E ? char : ".";
          break;
        default:
          this.errorState = `Unsupported display mode: ${this.displayMode}`;
          this.displayString = "";
          break;
      }
    } catch (err) {
      this.errorState = (err as Error).message;
      this.displayString = "";
      this.displayValue = null;
    }

    this.status = PeripheralStatus.IDLE;
    return null;
  }

  toJSON(): PeripheralSnapshot {
    return {
      id: this.id,
      name: this.name,
      priority: this.priority,
      status: this.status,
      handlerAddress: this.handlerAddress,
      meta: {
        type: "displayscreen",
        sourceAddress: this.sourceAddress,
        displayMode: this.displayMode,
        displayValue: this.displayValue,
        displayString: this.displayString,
        lastReadAddress: this.lastReadAddress,
        lastUpdatedAt: this.lastUpdatedAt,
        errorState: this.errorState,
        color: this.color,
      },
    };
  }
}
