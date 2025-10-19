import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComplaintsService } from '../../../services/complaints.service';

declare var L: any;

interface ComplaintLocation {
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
  assignedTo?: {
    name: string;
  };
}

@Component({
  selector: 'app-complaint-maps',
  templateUrl: './complaint-maps.component.html',
  styleUrls: ['./complaint-maps.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ComplaintMapsComponent implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  map: any;
  complaints: ComplaintLocation[] = [];
  filteredComplaints: ComplaintLocation[] = [];
  markers: any[] = [];
  markerClusterGroup: any;
  loading = true;
  error = '';
  
  // Filters
  statusFilter = '';
  priorityFilter = '';
  typeFilter = '';
  selectedMarker: ComplaintLocation | null = null;
  
  constructor(private complaintsService: ComplaintsService) {}
  
  ngOnInit(): void {
    this.loadComplaints();
  }
  
  loadComplaints(): void {
    this.complaintsService.getAllComplaints()
      .subscribe({
        next: (response) => {
          this.complaints = (response.complaints as any[]).filter(c => c.location && c.location.lat && c.location.lng) as ComplaintLocation[];
          this.filteredComplaints = this.complaints;
          this.loading = false;
          setTimeout(() => this.initializeMap(), 100);
        },
        error: (error) => {
          console.error('Error loading complaints:', error);
          this.error = 'Failed to load complaints for map';
          this.loading = false;
        }
      });
  }
  
  initializeMap(): void {
    if (!this.mapContainer) return;
    
    // Default center (Hyderabad, India)
    const defaultCenter = [17.3850, 78.4867];
    
    // Create map
    this.map = L.map(this.mapContainer.nativeElement).setView(defaultCenter, 12);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    
    this.addMarkers();
  }
  
  addMarkers(): void {
    // Clear existing markers
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];
    
    this.filteredComplaints.forEach(complaint => {
      const color = this.getStatusColor(complaint.status);
      
      // Create custom icon HTML
      const iconHtml = `
        <div style="
          background-color: ${color};
          border: 3px solid white;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <i class="bi ${this.getStatusIcon(complaint.status)}"></i>
        </div>
      `;
      
      const customIcon = L.divIcon({
        html: iconHtml,
        iconSize: [30, 30],
        className: 'complaint-marker'
      });
      
      const marker = L.marker([complaint.location.lat, complaint.location.lng], {
        icon: customIcon
      }).addTo(this.map);
      
      // Popup with complaint details
      const popupContent = `
        <div style="width: 280px; font-family: Arial, sans-serif;">
          <h6 style="margin: 0 0 8px 0; color: #333; font-weight: bold;">${complaint.title}</h6>
          <hr style="margin: 4px 0;">
          <p style="margin: 4px 0; font-size: 13px;"><strong>Status:</strong> 
            <span style="
              background: ${this.getStatusColor(complaint.status)};
              color: white;
              padding: 2px 8px;
              border-radius: 3px;
              font-size: 11px;
            ">${complaint.status.toUpperCase()}</span>
          </p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Priority:</strong> 
            <span style="
              background: ${this.getPriorityColor(complaint.priority)};
              color: white;
              padding: 2px 8px;
              border-radius: 3px;
              font-size: 11px;
            ">${complaint.priority.toUpperCase()}</span>
          </p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Type:</strong> ${complaint.type}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Location:</strong> ${complaint.location.address}</p>
          <p style="margin: 4px 0; font-size: 13px;"><strong>Reported by:</strong> ${complaint.createdBy.name}</p>
          ${complaint.assignedTo ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Assigned to:</strong> ${complaint.assignedTo.name}</p>` : '<p style="margin: 4px 0; font-size: 13px; color: #999;"><strong>Status:</strong> Not assigned</p>'}
        </div>
      `;
      
      marker.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'complaint-popup'
      });
      
      marker.on('click', () => {
        this.selectedMarker = complaint;
      });
      
      this.markers.push(marker);
    });
    
    // Auto-fit map bounds to show all markers
    if (this.filteredComplaints.length > 0) {
      this.fitMapBounds();
    }
  }
  
  fitMapBounds(): void {
    if (this.markers.length === 0) return;
    
    const group = L.featureGroup(this.markers);
    this.map.fitBounds(group.getBounds(), { padding: [50, 50] });
  }
  
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#FFC107';
      case 'in-progress': return '#17A2B8';
      case 'resolved': return '#28A745';
      default: return '#DC3545';
    }
  }
  
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low': return '#28A745';
      case 'medium': return '#FFC107';
      case 'high': return '#DC3545';
      default: return '#6C757D';
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
  
  applyFilters(): void {
    this.filteredComplaints = this.complaints.filter(complaint => {
      const statusMatch = !this.statusFilter || complaint.status === this.statusFilter;
      const priorityMatch = !this.priorityFilter || complaint.priority === this.priorityFilter;
      const typeMatch = !this.typeFilter || complaint.type === this.typeFilter;
      return statusMatch && priorityMatch && typeMatch;
    });
    
    this.addMarkers();
  }
  
  clearFilters(): void {
    this.statusFilter = '';
    this.priorityFilter = '';
    this.typeFilter = '';
    this.filteredComplaints = this.complaints;
    this.addMarkers();
  }
  
  resetMap(): void {
    if (this.map && this.filteredComplaints.length > 0) {
      this.fitMapBounds();
    }
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
}
