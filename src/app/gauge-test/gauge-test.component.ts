import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-gauge',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './gauge-test.component.html',
  styleUrls: ['./gauge-test.component.css']
})
export class GaugeComponent {
  @Input() value: number = 100; // Default value

  // Dynamic getter to determine color based on thresholds
  get barColor(): string {
    if (this.value > 80) return '#ef4444'; // Red for high danger
    if (this.value > 50) return '#f59e0b'; // Amber/Yellow for warning
    return '#10b981'; // Green for normal
  }
}