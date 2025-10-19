import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-worker-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './worker-settings.component.html',
  styleUrls: ['./worker-settings.component.scss']
})
export class WorkerSettingsComponent implements OnInit {
  worker: any = null;
  
  // Specializations
  availableSpecializations = [
    'Roads & Infrastructure',
    'Water & Sanitation',
    'Electricity & Power',
    'Waste Management',
    'Public Transport',
    'Parks & Recreation',
    'Street Lighting',
    'Drainage System',
    'Building Permits',
    'Noise Complaints',
    'Environmental Issues',
    'Public Safety'
  ];
  
  selectedSpecializations: string[] = [];
  
  // Work Area
  workArea = {
    lat: 0,
    lng: 0,
    radius: 5 // default 5 km
  };
  
  // Location detection
  locationDetected = false;
  detectingLocation = false;
  
  // Save status
  saving = false;
  saveSuccess = false;
  saveError = '';
  
  loading = true;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadWorkerProfile();
  }

  loadWorkerProfile(): void {
    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      this.worker = currentUser;
      
      // Load existing specializations
      if (this.worker.specializations && Array.isArray(this.worker.specializations)) {
        this.selectedSpecializations = [...this.worker.specializations];
      }
      
      // Load existing work area
      if (this.worker.workArea) {
        this.workArea = {
          lat: this.worker.workArea.lat || 0,
          lng: this.worker.workArea.lng || 0,
          radius: this.worker.workArea.radius || 5
        };
        
        if (this.workArea.lat !== 0 && this.workArea.lng !== 0) {
          this.locationDetected = true;
        }
      }
    }
    
    this.loading = false;
  }

  toggleSpecialization(spec: string): void {
    const index = this.selectedSpecializations.indexOf(spec);
    
    if (index > -1) {
      // Remove if already selected
      this.selectedSpecializations.splice(index, 1);
    } else {
      // Add if not selected
      this.selectedSpecializations.push(spec);
    }
  }

  isSpecializationSelected(spec: string): boolean {
    return this.selectedSpecializations.includes(spec);
  }

  detectCurrentLocation(): void {
    this.detectingLocation = true;
    this.saveError = '';
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.workArea.lat = position.coords.latitude;
          this.workArea.lng = position.coords.longitude;
          this.locationDetected = true;
          this.detectingLocation = false;
        },
        (error) => {
          console.error('Error detecting location:', error);
          this.saveError = 'Failed to detect location. Please enable location services.';
          this.detectingLocation = false;
        }
      );
    } else {
      this.saveError = 'Geolocation is not supported by your browser.';
      this.detectingLocation = false;
    }
  }

  saveSettings(): void {
    this.saving = true;
    this.saveSuccess = false;
    this.saveError = '';
    
    const settingsData = {
      specializations: this.selectedSpecializations,
      workArea: this.workArea
    };
    
    // Call auth service to update worker profile
    this.authService.updateWorkerSettings(settingsData).subscribe({
      next: (response) => {
        if (response.success) {
          this.saveSuccess = true;
          
          // Update local user data
          const updatedUser = { ...this.worker, ...settingsData };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          
          setTimeout(() => {
            this.saveSuccess = false;
          }, 3000);
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        this.saveError = error.error?.message || 'Failed to save settings. Please try again.';
        this.saving = false;
      }
    });
  }

  resetSettings(): void {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      this.selectedSpecializations = [];
      this.workArea = {
        lat: 0,
        lng: 0,
        radius: 5
      };
      this.locationDetected = false;
      this.saveSuccess = false;
      this.saveError = '';
    }
  }
}
