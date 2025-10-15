import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class LeaderboardComponent implements OnInit {
  leaderboard: any[] = [];
  isLoading = true;

  constructor() { }

  ngOnInit(): void {
    // Mock data for now
    this.leaderboard = [
      { rank: 1, name: 'John Doe', points: 1250, badges: 5 },
      { rank: 2, name: 'Jane Smith', points: 1100, badges: 4 },
      { rank: 3, name: 'Mike Johnson', points: 950, badges: 3 }
    ];
    this.isLoading = false;
  }
}
