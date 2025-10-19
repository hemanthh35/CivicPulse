import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ComplaintsService } from '../../../services/complaints.service';

declare var L: any;

interface WorkLocation {
  _id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
  };
  createdBy: {
    name: string;
  };
}

@Component({
  selector: 'app-assigned-work-map',
  templateUrl: './assigned-work-map.component.html',
  styleUrls: ['./assigned-work-map.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AssignedWorkMapComponent implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  map: any;
  workLocation: WorkLocation | null = null;
  complaintId: string = '';
  workerLocation: { lat: number; lng: number } | null = null;
  fetchingLocation = false;
  navigationStarted = false;
  distance: number = 0;
  navigationUrl: string = '';
  error = '';
  success = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private complaintsService: ComplaintsService
  ) {}

  ngOnInit(): void {
    this.complaintId = this.route.snapshot.paramMap.get('id') || '';
    if (this.complaintId) {
      this.loadComplaintLocation();
    }
  }

  loadComplaintLocation(): void {
    this.complaintsService.getComplaintById(this.complaintId).subscribe({
      next: (response) => {
        if (response.complaint) {
          this.workLocation = response.complaint as any;
          console.log('📍 Work location loaded:', this.workLocation);
          setTimeout(() => this.initializeMap(), 100);
        }
      },
      error: (error) => {
        this.error = 'Failed to load work location. Please try again.';
        console.error('Error loading complaint:', error);
      }
    });
  }

  initializeMap(): void {
    if (!this.mapContainer || !this.workLocation) return;

    // Create map centered on work location
    this.map = L.map(this.mapContainer.nativeElement).setView(
      [this.workLocation.location.lat, this.workLocation.location.lng],
      14
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Add work location marker (destination)
    L.marker([this.workLocation.location.lat, this.workLocation.location.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(this.map).bindPopup(`
      <div style="width: 200px;">
        <h6>${this.workLocation!.title}</h6>
        <p style="font-size: 12px; margin: 5px 0;">${this.workLocation!.location.address}</p>
        <p style="font-size: 12px; color: #666; margin: 0;">${this.workLocation!.location.city}</p>
      </div>
    `);
  }

  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.error = 'Geolocation not supported by browser.';
      return;
    }

    this.fetchingLocation = true;
    this.error = '';

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.workerLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        console.log('📍 Worker location:', this.workerLocation);
        this.success = `✅ Your location found! Accuracy: ${Math.round(position.coords.accuracy)}m`;
        
        // Calculate distance
        this.calculateDistance();
        
        // Update map with worker location
        this.updateMapWithWorkerLocation();
        
        this.fetchingLocation = false;
      },
      (error) => {
        this.fetchingLocation = false;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.error = '❌ Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            this.error = '❌ Location information unavailable.';
            break;
          case error.TIMEOUT:
            this.error = '❌ Location request timed out. Please try again.';
            break;
          default:
            this.error = '❌ Could not get your location.';
        }
      },
      options
    );
  }

  updateMapWithWorkerLocation(): void {
    if (!this.map || !this.workerLocation) return;

    // Add worker location marker (blue)
    L.marker([this.workerLocation.lat, this.workerLocation.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(this.map).bindPopup('<div><strong>Your Location</strong></div>');

    // Draw route line from worker to work
    if (this.workLocation) {
      L.polyline(
        [
          [this.workerLocation.lat, this.workerLocation.lng],
          [this.workLocation.location.lat, this.workLocation.location.lng]
        ],
        {
          color: '#667eea',
          weight: 3,
          opacity: 0.7,
          dashArray: '5, 5'
        }
      ).addTo(this.map);
    }

    // Fit map to show both markers
    const bounds = L.latLngBounds(
      [this.workerLocation.lat, this.workerLocation.lng],
      [this.workLocation!.location.lat, this.workLocation!.location.lng]
    );
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  calculateDistance(): void {
    if (!this.workerLocation || !this.workLocation) return;

    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(this.workLocation.location.lat - this.workerLocation.lat);
    const dLng = this.toRad(this.workLocation.location.lng - this.workerLocation.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(this.workerLocation.lat)) * 
      Math.cos(this.toRad(this.workLocation.location.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    this.distance = R * c; // Distance in kilometers
  }

  toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  startNavigation(): void {
    if (!this.workerLocation || !this.workLocation) {
      this.error = 'Location information missing. Please get your location first.';
      return;
    }

    // Create navigation URL for Google Maps or Apple Maps
    // Google Maps format: https://www.google.com/maps/dir/?api=1&origin=lat,lng&destination=lat,lng
    const origin = `${this.workerLocation.lat},${this.workerLocation.lng}`;
    const destination = `${this.workLocation.location.lat},${this.workLocation.location.lng}`;
    
    this.navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    
    console.log('🗺️ Opening navigation:', this.navigationUrl);
    
    // Open in new tab
    window.open(this.navigationUrl, '_blank');
    
    this.success = '✅ Opening navigation in Google Maps...';
    this.navigationStarted = true;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'in-progress': return 'bg-info';
      case 'resolved': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'low': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'high': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'bi-clock';
      case 'in-progress': return 'bi-wrench';
      case 'resolved': return 'bi-check-circle';
      default: return 'bi-exclamation-circle';
    }
  }

  goBack(): void {
    this.router.navigate(['/worker/assigned-complaints']);
  }
}
