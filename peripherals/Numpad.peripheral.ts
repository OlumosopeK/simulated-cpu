/**
 * @module NumpadPeripheral
 *
 * Input peripheral that accepts decimal numbers (0-255) and stores them
 * as hexadecimal values to a specific memory address. Fires an interrupt
 * each time a valid number is entered.
 */

import {
  PeripheralStatus,
  type Peripheral,
  type Interrupt,
  type PeripheralSnapshot,
} from "@/types/peripheral.types";
import type { MemoryService } from "@/services/Memory.service";

export class NumpadPeripheral implements Peripheral {
  readonly id: string;
  readonly name: string;
  priority: number;
  status: PeripheralStatus;

  private handlerAddress: number;
  private readonly memory: MemoryService;
  private storageAddress: number;
  private lastValue: number;
  private pendingInterrupt: boolean;
  private color: string;

  constructor(
    id: string,
    name: string,
    handlerAddress: number,
    storageAddress: number = 0x003A,
    priority: number = 1,
    memory: MemoryService,
    color: string = "#06b6d4",
  ) {
    if (storageAddress < 0 || storageAddress >= 0x10000) {
      throw new RangeError("Storage address must be within memory range");
    }
    this.id = id;
    this.name = name;
    this.handlerAddress = handlerAddress;
    this.storageAddress = storageAddress;
    this.priority = priority;
    this.memory = memory;
    this.color = color;
    this.status = PeripheralStatus.DISCONNECTED;
    this.lastValue = 0;
    this.pendingInterrupt = false;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  connect(): void {
    if (this.status === PeripheralStatus.DISCONNECTED) {
      this.status = PeripheralStatus.IDLE;
    }
  }

  disconnect(): void {
    this.status = PeripheralStatus.DISCONNECTED;
    this.pendingInterrupt = false;
  }

  // ── Input Entry (decimal number input) ────────────────────────────────

  /**
   * Accept a decimal number (0-255) and store it as hex to memory.
   * Fires an interrupt on the next tick.
   *
   * @throws RangeError if value is not in range 0-255
   */
  enterValue(decimalValue: number): void {
    if (this.status === PeripheralStatus.DISCONNECTED) return;

    if (!Number.isInteger(decimalValue) || decimalValue < 0 || decimalValue > 255) {
      throw new RangeError("Numpad input must be an integer between 0 and 255");
    }

    this.lastValue = decimalValue;
    this.memory.write(this.storageAddress, decimalValue);
    this.pendingInterrupt = true;
    this.status = PeripheralStatus.ACTIVE;
  }

  // ── Trigger (manual input for testing) ────────────────────────────────

  /**
   * Trigger is not used for this peripheral (input comes via enterValue).
   * Can be overridden for testing purposes.
   */
  trigger(): void {
    if (this.status === PeripheralStatus.DISCONNECTED) return;
    // For testing: enter value 42
    this.enterValue(42);
  }

  // ── Tick ───────────────────────────────────────────────────────────────

  tick(): Interrupt | null {
    if (this.status === PeripheralStatus.DISCONNECTED) return null;

    if (this.pendingInterrupt) {
      this.pendingInterrupt = false;
      this.status = PeripheralStatus.IDLE;

      const interrupt: Interrupt = {
        source: this.id,
        priority: this.priority,
        handlerAddress: this.handlerAddress,
        timestamp: Date.now(),
      };

      return interrupt;
    }

    this.status = PeripheralStatus.IDLE;
    return null;
  }

  // ── Configuration ─────────────────────────────────────────────────────

  getStorageAddress(): number {
    return this.storageAddress;
  }

  setStorageAddress(address: number): void {
    if (address < 0 || address >= 0x10000) {
      throw new RangeError("Storage address must be within memory range");
    }
    this.storageAddress = address;
  }

  getLastValue(): number {
    return this.lastValue;
  }

  getColor(): string {
    return this.color;
  }

  setColor(color: string): void {
    this.color = color;
  }

  // ── Serialization ─────────────────────────────────────────────────────

  toJSON(): PeripheralSnapshot {
    return {
      id: this.id,
      name: this.name,
      priority: this.priority,
      status: this.status,
      handlerAddress: this.handlerAddress,
      meta: {
        type: "numpad",
        storageAddress: this.storageAddress,
        lastValue: this.lastValue,
        asHex: `0x${this.lastValue.toString(16).padStart(2, "0")}`,
        pendingInterrupt: this.pendingInterrupt,
        color: this.color,
      },
    };
  }
}
