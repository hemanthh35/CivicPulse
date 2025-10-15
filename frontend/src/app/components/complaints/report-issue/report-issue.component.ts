import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ComplaintsService } from '../../../services/complaints.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-report-issue',
  templateUrl: './report-issue.component.html',
  styleUrls: ['./report-issue.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ReportIssueComponent implements OnInit {
  reportForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  categories = [
    'Roads & Infrastructure',
    'Water & Sanitation',
    'Electricity',
    'Public Safety',
    'Garbage & Waste',
    'Parks & Environment',
    'Noise & Disturbance',
    'Public Transport',
    'Other'
  ];
  uploadedImages: File[] = [];
  previewUrls: string[] = [];
  
  // Location-related properties
  fetchingLocation = false;
  locationError = '';
  coordinates = { lat: 0, lng: 0 };
  locationAccuracy: number | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private complaintsService: ComplaintsService,
    private authService: AuthService,
    private router: Router
  ) {
    this.reportForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      category: ['', Validators.required],
      location: this.formBuilder.group({
        address: ['', Validators.required],
        city: ['', Validators.required],
        state: ['', Validators.required],
        pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
      }),
      priority: ['medium', Validators.required]
    });
  }

  ngOnInit(): void {}

  get f() {
    return this.reportForm.controls;
  }

  get locationControls() {
    return (this.reportForm.get('location') as FormGroup).controls;
  }

  onFileSelect(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (this.uploadedImages.length >= 5) {
          this.errorMessage = 'Maximum 5 images allowed';
          break;
        }
        
        const file = files[i];
        if (!file.type.includes('image')) {
          this.errorMessage = 'Only image files are allowed';
          continue;
        }
        
        this.uploadedImages.push(file);
        
        // Create a preview URL
        const reader = new FileReader();
        reader.onload = () => {
          this.previewUrls.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeImage(index: number): void {
    this.uploadedImages.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  getCurrentLocation(): void {
    console.log('getCurrentLocation called');
    if (!navigator.geolocation) {
      this.locationError = 'Geolocation is not supported by this browser.';
      return;
    }

    this.fetchingLocation = true;
    this.locationError = '';
    console.log('Starting geolocation request...');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Position received:', position);
        this.coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.locationAccuracy = Math.round(position.coords.accuracy);
        console.log('Coordinates set:', this.coordinates);
        
        // Reverse geocode to get address
        this.reverseGeocode(this.coordinates.lat, this.coordinates.lng);
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.fetchingLocation = false;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError = 'Location access denied. Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            this.locationError = 'Location request timed out. Please try again.';
            break;
          default:
            this.locationError = 'An unknown error occurred while retrieving location.';
            break;
        }
      },
      options
    );
  }

  reverseGeocode(lat: number, lng: number): void {
    console.log('reverseGeocode called with:', lat, lng);
    console.log('Using OpenStreetMap geocoding (free service)');
    this.reverseGeocodeWithOpenStreetMap(lat, lng);
  }

  // Fallback method using OpenStreetMap Nominatim (free service)
  reverseGeocodeWithOpenStreetMap(lat: number, lng: number): void {
    console.log('Using OpenStreetMap geocoding');
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`;
    console.log('OpenStreetMap URL:', url);
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log('OpenStreetMap response:', data);
        this.fetchingLocation = false;
        
        if (data && data.address) {
          const addr = data.address;
          const locationGroup = this.reportForm.get('location') as FormGroup;
          
          // Extract street address - combine house number and road
          const streetParts = [
            addr.house_number,
            addr.road || addr.pedestrian || addr.path
          ].filter(Boolean);
          
          const streetAddress = streetParts.length > 0 ? streetParts.join(' ') : 
            (addr.neighbourhood || addr.suburb || data.display_name.split(',')[0]);
          
          // Determine city - try multiple fields
          const city = addr.city || 
                      addr.town || 
                      addr.village || 
                      addr.municipality || 
                      addr.county || 
                      addr.hamlet || '';
          
          // Determine state
          const state = addr.state || 
                       addr.state_district || 
                       addr.region || '';
          
          const addressData = {
            address: streetAddress,
            city: city,
            state: state,
            pincode: addr.postcode || ''
          };
          
          console.log('OpenStreetMap extracted data:', addressData);
          locationGroup.patchValue(addressData);

          // Clear any previous errors
          this.locationError = '';
          this.successMessage = 'Location and address information fetched successfully!';
          setTimeout(() => this.successMessage = '', 4000);
        } else {
          console.log('No address data found in OpenStreetMap response');
          this.locationError = 'Could not fetch address for this location. Please enter manually.';
        }
      })
      .catch(error => {
        console.error('OpenStreetMap fetch error:', error);
        this.fetchingLocation = false;
        this.locationError = 'Failed to fetch address. Please enter manually.';
        console.error('Geocoding error:', error);
      });
  }

  onSubmit(): void {
    if (this.reportForm.invalid) {
      Object.keys(this.reportForm.controls).forEach(key => {
        this.reportForm.get(key)?.markAsTouched();
      });
      
      // Mark all location form controls as touched
      Object.keys((this.reportForm.get('location') as FormGroup).controls).forEach(key => {
        (this.reportForm.get('location') as FormGroup).get(key)?.markAsTouched();
      });
      
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = new FormData();
    formData.append('title', this.f['title'].value);
    formData.append('description', this.f['description'].value);
    formData.append('category', this.f['category'].value);
    
    // Include coordinates if available
    const locationData = {
      ...this.reportForm.get('location')?.value,
      coordinates: this.coordinates.lat && this.coordinates.lng ? 
        [this.coordinates.lng, this.coordinates.lat] : null
    };
    
    formData.append('location', JSON.stringify(locationData));
    formData.append('priority', this.f['priority'].value);
    
    // Append images if any
    this.uploadedImages.forEach((image, index) => {
      formData.append('images', image);
    });

    this.complaintsService.createComplaint(formData)
      .subscribe({
        next: (response) => {
          this.successMessage = 'Your complaint has been reported successfully!';
          this.isSubmitting = false;
          
          // Reset form and image arrays after 2 seconds
          setTimeout(() => {
            this.reportForm.reset({
              priority: 'medium'
            });
            this.uploadedImages = [];
            this.previewUrls = [];
          }, 2000);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Failed to report your complaint. Please try again.';
          this.isSubmitting = false;
        }
      });
  }
}
