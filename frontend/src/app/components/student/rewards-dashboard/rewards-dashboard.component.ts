import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-rewards-dashboard',
  templateUrl: './rewards-dashboard.component.html',
  styleUrls: ['./rewards-dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class RewardsDashboardComponent implements OnInit {
  user: any;
  isLoading = true;

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    this.user = this.authService.getUser();
    this.isLoading = false;
  }
}
