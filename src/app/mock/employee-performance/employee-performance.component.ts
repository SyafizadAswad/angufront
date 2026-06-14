import { Component, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GaugeComponent } from '../../gauge-test/gauge-test.component';
/** One day's performance score for an employee. */
export interface PerformanceRecord {
  /** ISO date string (YYYY-MM-DD); used to pick the latest row. */
  day: string;
  performancePercent: number;
}

@Component({
  selector: 'app-employee-performance',
  imports: [RouterLink, GaugeComponent],
  templateUrl: './employee-performance.component.html',
  styleUrl: './employee-performance.component.scss',
})
export class EmployeePerformanceComponent {
  readonly employeeName = 'Tanaka';

  /** Full mock history (5 days) — lives in TS, not in the template. */
  private readonly allRecords: PerformanceRecord[] = [
    { day: '2026-06-10', performancePercent: 62 },
    { day: '2026-06-11', performancePercent: 78 },
    { day: '2026-06-12', performancePercent: 41 },
    { day: '2026-06-13', performancePercent: 93 },
    { day: '2026-06-14', performancePercent: 55 },
  ];

  /** All records, newest first (for the full history table). */
  readonly allRecordsSorted = computed(() =>
    [...this.allRecords].sort((a, b) => b.day.localeCompare(a.day)),
  );

  /** Most recent day — drives the gauge and “latest” highlight in the table. */
  readonly latestRecord = computed(() => this.allRecordsSorted()[0] ?? null);

  readonly latestPerformancePercent = computed(
    () => this.latestRecord()?.performancePercent ?? 0,
  );

  isLatestDay(day: string): boolean {
    return this.latestRecord()?.day === day;
  }

  formatDay(isoDate: string): string {
    const d = new Date(isoDate + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatPerformance(value: number): string {
    return `${value}%`;
  }
}
