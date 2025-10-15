import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './components/home/home.component';
import { AboutComponent } from './components/about/about.component';

// Import the components once you create them
// For now, using placeholder paths

const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  // Citizen & Student routes
  {
    path: 'report-issue',
    loadComponent: () => import('./components/complaints/report-issue/report-issue.component').then(m => m.ReportIssueComponent),
    canActivate: [AuthGuard],
    data: { roles: ['citizen', 'student'] }
  },
  {
    path: 'my-complaints',
    loadComponent: () => import('./components/complaints/my-complaints/my-complaints.component').then(m => m.MyComplaintsComponent),
    canActivate: [AuthGuard],
    data: { roles: ['citizen', 'student'] }
  },
  // Student-only routes
  {
    path: 'rewards',
    loadComponent: () => import('./components/student/rewards-dashboard/rewards-dashboard.component').then(m => m.RewardsDashboardComponent),
    canActivate: [AuthGuard],
    data: { roles: ['student'] }
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./components/student/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
    canActivate: [AuthGuard]
  },
  // Worker routes
  {
    path: 'assigned-complaints',
    loadComponent: () => import('./components/worker/assigned-complaints/assigned-complaints.component').then(m => m.AssignedComplaintsComponent),
    canActivate: [AuthGuard],
    data: { roles: ['worker'] }
  },
  // Admin routes
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'complaint-management',
    loadComponent: () => import('./components/admin/complaint-management/complaint-management.component').then(m => m.ComplaintManagementComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'moderation',
    loadComponent: () => import('./components/admin/moderation-panel/moderation-panel.component').then(m => m.ModerationPanelComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
