import { addMinutes, isAfter, isBefore, isEqual, max, min } from 'date-fns';

export interface TimeInterval {
  start: Date;
  end: Date;
}

/**
 * Check if two intervals overlap
 */
export function doIntervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  return isBefore(a.start, b.end) && isAfter(a.end, b.start);
}

/**
 * Merge overlapping intervals into consolidated blocks
 */
export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];
  
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: TimeInterval[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    
    if (isBefore(current.start, last.end) || isEqual(current.start, last.end)) {
      last.end = max([last.end, current.end]);
    } else {
      merged.push({ start: current.start, end: current.end });
    }
  }
  
  return merged;
}

/**
 * Removes busy intervals from open intervals, returns remaining free time blocks
 */
export function subtractIntervals(openings: TimeInterval[], busy: TimeInterval[]): TimeInterval[] {
  if (busy.length === 0) return openings;
  
  const mergedBusy = mergeIntervals(busy);
  const result: TimeInterval[] = [];
  
  for (const open of openings) {
    let currentOpen = { ...open };
    let hasAdded = false;
    
    for (const b of mergedBusy) {
      if (doIntervalsOverlap(currentOpen, b)) {
        if (isAfter(b.start, currentOpen.start)) {
          result.push({ start: currentOpen.start, end: b.start });
        }
        if (isBefore(b.end, currentOpen.end)) {
          currentOpen.start = b.end;
        } else {
          hasAdded = true;
          break;
        }
      }
    }
    if (!hasAdded && isBefore(currentOpen.start, currentOpen.end)) {
      result.push(currentOpen);
    }
  }
  
  return result;
}

/**
 * Given available intervals, generates possible start times for a service of given duration+buffer.
 */
export function generateTimeSlots(
  available: TimeInterval[],
  durationMinutes: number,
  bufferMinutes: number,
  stepMinutes: number = 15
): Date[] {
  const slots: Date[] = [];
  const totalNeeded = durationMinutes + bufferMinutes;
  
  for (const interval of available) {
    let currentSlot = interval.start;
    
    while (true) {
      const slotEnd = addMinutes(currentSlot, totalNeeded);
      
      if (isAfter(slotEnd, interval.end)) {
        break;
      }
      
      slots.push(currentSlot);
      currentSlot = addMinutes(currentSlot, stepMinutes);
    }
  }
  
  return slots;
}
