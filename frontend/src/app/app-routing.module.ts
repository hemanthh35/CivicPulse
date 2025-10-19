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
    path: 'verify-otp',
    loadComponent: () => import('./components/auth/otp-verification/otp-verification.component').then(m => m.OtpVerificationComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  // Citizen & Student routes
  {
    path: 'leaderboard',
    loadComponent: () => import('./components/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
  },
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
    path: 'worker/dashboard',
    loadComponent: () => import('./components/worker/worker-dashboard/worker-dashboard.component').then(m => m.WorkerDashboardComponent),
    canActivate: [AuthGuard],
    data: { roles: ['worker'] }
  },
  {
    path: 'worker/assigned-complaints',
    loadComponent: () => import('./components/worker/assigned-complaints/assigned-complaints.component').then(m => m.AssignedComplaintsComponent),
    canActivate: [AuthGuard],
    data: { roles: ['worker'] }
  },
  {
    path: 'worker/settings',
    loadComponent: () => import('./components/worker/worker-settings/worker-settings.component').then(m => m.WorkerSettingsComponent),
    canActivate: [AuthGuard],
    data: { roles: ['worker'] }
  },
  {
    path: 'worker/work-map/:id',
    loadComponent: () => import('./components/worker/assigned-work-map/assigned-work-map.component').then(m => m.AssignedWorkMapComponent),
    canActivate: [AuthGuard],
    data: { roles: ['worker'] }
  },
  // Admin routes
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./components/admin/user-management/user-management.component').then(m => m.UserManagementComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/complaints',
    loadComponent: () => import('./components/admin/complaint-management/complaint-management.component').then(m => m.ComplaintManagementComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/performance',
    loadComponent: () => import('./components/admin/admin-performance-panel/admin-performance-panel.component').then(m => m.AdminPerformancePanelComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/moderation',
    loadComponent: () => import('./components/admin/moderation-panel/moderation-panel.component').then(m => m.ModerationPanelComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/maps',
    loadComponent: () => import('./components/admin/complaint-maps/complaint-maps.component').then(m => m.ComplaintMapsComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'admin/rewards',
    loadComponent: () => import('./components/admin/rewards-management/rewards-management.component').then(m => m.RewardsManagementComponent),
    canActivate: [AuthGuard],
    data: { roles: ['admin'] }
  },
  // Legacy admin routes (redirect to new paths)
  {
    path: 'admin-dashboard',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'complaint-management',
    redirectTo: 'admin/complaints',
    pathMatch: 'full'
  },
  {
    path: 'moderation',
    redirectTo: 'admin/moderation',
    pathMatch: 'full'
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
