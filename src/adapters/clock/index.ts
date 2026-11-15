export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class VirtualClock implements Clock {
  private currentTime: Date;

  constructor(startTime: Date = new Date()) {
    this.currentTime = new Date(startTime);
  }

  now(): Date {
    return new Date(this.currentTime);
  }

  advance(minutes: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + minutes * 60 * 1000);
  }

  set(time: Date): void {
    this.currentTime = new Date(time);
  }

  getTime(): Date {
    return new Date(this.currentTime);
  }
}

// Global clock singleton for demo time-skip
let globalClock: Clock = new SystemClock();

export function getClock(): Clock {
  return globalClock;
}

export function setGlobalClock(clock: Clock): void {
  globalClock = clock;
}
