import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { CsvService } from '../../../services/csv.service';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  mobile?: string;
  location?: string;
  points?: number;
  badges?: string[];
  isActive?: boolean;
  suspendedAt?: Date;
  suspensionReason?: string;
  createdAt: Date;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = true;
  error = '';
  success = '';
  
  // Filters
  searchTerm = '';
  roleFilter = '';
  statusFilter = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  limit = 10;
  total = 0;
  
  // Modals
  showEditModal = false;
  showDeleteModal = false;
  showSuspendModal = false;
  selectedUser: User | null = null;
  suspensionReason = '';
  
  // Expose Math to template
  Math = Math;
  
  editForm = {
    name: '',
    email: '',
    role: '',
    mobile: '',
    location: '',
    points: 0
  };

  constructor(private adminService: AdminService, private csvService: CsvService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.error = '';
    
    const params: any = {
      page: this.currentPage,
      limit: this.limit
    };
    
    if (this.roleFilter) params.role = this.roleFilter;
    if (this.searchTerm) params.search = this.searchTerm;
    
    this.adminService.getAllUsers(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.users = response.users;
          this.filteredUsers = response.users;
          this.total = response.pagination.total;
          this.totalPages = response.pagination.pages;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onRoleFilter(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  openEditModal(user: User): void {
    this.selectedUser = user;
    this.editForm = {
      name: user.name,
      email: user.email,
      role: user.role,
      mobile: user.mobile || '',
      location: user.location || '',
      points: user.points || 0
    };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedUser = null;
  }

  saveUser(): void {
    if (!this.selectedUser) return;
    
    this.adminService.updateUser(this.selectedUser._id, this.editForm).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadUsers();
          this.closeEditModal();
          alert('User updated successfully!');
        }
      },
      error: (error) => {
        console.error('Error updating user:', error);
        alert('Failed to update user: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  openDeleteModal(user: User): void {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedUser = null;
  }

  confirmDelete(): void {
    if (!this.selectedUser) return;
    
    this.adminService.deleteUser(this.selectedUser._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'User deleted successfully!';
          this.loadUsers();
          this.closeDeleteModal();
        }
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.error = 'Failed to delete user: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  openSuspendModal(user: User): void {
    this.selectedUser = user;
    this.suspensionReason = '';
    this.showSuspendModal = true;
  }

  closeSuspendModal(): void {
    this.showSuspendModal = false;
    this.selectedUser = null;
    this.suspensionReason = '';
  }

  confirmSuspend(): void {
    if (!this.selectedUser || !this.suspensionReason) return;
    
    this.adminService.suspendUser(this.selectedUser._id, this.suspensionReason).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'User suspended successfully!';
          this.loadUsers();
          this.closeSuspendModal();
        }
      },
      error: (error) => {
        console.error('Error suspending user:', error);
        this.error = 'Failed to suspend user: ' + (error.error?.message || 'Unknown error');
        this.closeSuspendModal();
      }
    });
  }

  activateUser(user: User): void {
    if (!confirm(`Are you sure you want to activate ${user.name}?`)) return;
    
    this.adminService.activateUser(user._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.success = 'User activated successfully!';
          this.loadUsers();
        }
      },
      error: (error) => {
        console.error('Error activating user:', error);
        this.error = 'Failed to activate user: ' + (error.error?.message || 'Unknown error');
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    const classes: any = {
      'admin': 'bg-danger',
      'worker': 'bg-warning text-dark',
      'student': 'bg-info',
      'citizen': 'bg-primary'
    };
    return classes[role] || 'bg-secondary';
  }

  getRoleIcon(role: string): string {
    const icons: any = {
      'admin': 'bi-shield-fill-check',
      'worker': 'bi-tools',
      'student': 'bi-mortarboard-fill',
      'citizen': 'bi-person-fill'
    };
    return icons[role] || 'bi-person';
  }

  getRoleAvatarClass(role: string): string {
    const classes: any = {
      'admin': 'avatar-admin',
      'worker': 'avatar-worker',
      'student': 'avatar-student',
      'citizen': 'avatar-citizen'
    };
    return classes[role] || 'avatar-default';
  }

  exportToCSV(): void {
    if (this.users.length === 0) {
      this.error = 'No users to export';
      return;
    }
    this.csvService.exportUsers(this.users);
    this.success = 'Users exported successfully!';
    setTimeout(() => this.success = '', 3000);
  }
}
