import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ComplaintsService } from '../../../services/complaints.service';
import { AuthService } from '../../../services/auth.service';
import { GeminiService } from '../../../services/gemini.service';

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
  analyzingImage = false;
  aiSuggestion = '';
  
  // Location-related properties
  fetchingLocation = false;
  locationError = '';
  coordinates = { lat: 0, lng: 0 };
  locationAccuracy: number | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private complaintsService: ComplaintsService,
    private authService: AuthService,
    private geminiService: GeminiService,
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
        pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
        lat: [null],
        lng: [null]
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

        // Auto-analyze first image with Gemini AI
        if (this.uploadedImages.length === 1) {
          this.analyzeImageWithAI(file);
        }
      }
    }
  }

  analyzeImageWithAI(file: File): void {
    this.analyzingImage = true;
    this.aiSuggestion = '';
    this.errorMessage = '';

    console.log('🤖 Sending image to Gemini AI for analysis...');

    this.geminiService.analyzeImage(file).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('✅ AI Analysis received:', response.data);
          
          // Auto-fill the form with AI suggestions
          this.reportForm.patchValue({
            title: response.data.title,
            category: response.data.category,
            description: response.data.description,
            priority: response.data.priority
          });

          this.aiSuggestion = 'Form auto-filled from image. Please review and edit if needed.';
          this.successMessage = 'Image analyzed successfully. Form fields updated.';
          
          setTimeout(() => {
            this.successMessage = '';
            this.aiSuggestion = '';
          }, 5000);
        }
        this.analyzingImage = false;
      },
      error: (error) => {
        console.error('❌ AI Analysis failed:', error);
        this.analyzingImage = false;
        
        if (error.status === 503) {
          this.errorMessage = 'AI service not configured. Please fill the form manually.';
        } else {
          this.errorMessage = 'AI analysis failed. Please fill the form manually.';
        }
        
        setTimeout(() => this.errorMessage = '', 4000);
      }
    });
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
    console.log('Starting geolocation request with HIGH ACCURACY...');

    const options = {
      enableHighAccuracy: true,  // Request GPS satellite fix (not WiFi)
      timeout: 30000,            // Wait up to 30 seconds for accurate position
      maximumAge: 0              // Always get fresh position, don't use cached
    };

    let attemptCount = 0;
    const MAX_ATTEMPTS = 3;
    let bestPosition: any = null;
    let bestAccuracy = Infinity;

    const successCallback = (position: any) => {
      attemptCount++;
      const accuracy = position.coords.accuracy;
      console.log(`� Attempt ${attemptCount}: Accuracy = ${accuracy}m`);

      // Keep track of best position so far
      if (accuracy < bestAccuracy) {
        bestAccuracy = accuracy;
        bestPosition = position;
      }

      // If accuracy is excellent (< 50m), use it immediately
      if (accuracy < 50) {
        console.log('✅ Excellent accuracy! Using position.');
        this.finishLocationCapture(bestPosition);
        return;
      }

      // If accuracy is good (< 100m), accept it
      if (accuracy < 100) {
        console.log('✅ Good accuracy! Using position.');
        this.finishLocationCapture(bestPosition);
        return;
      }

      // If we have more attempts, try again to get better accuracy
      if (attemptCount < MAX_ATTEMPTS) {
        console.log(`⏳ Accuracy ${accuracy}m is acceptable but trying again for better fix...`);
        // Continue - the watch will try again
        return;
      }

      // Use best position we got
      console.log(`✅ Using best position with ${bestAccuracy}m accuracy after ${MAX_ATTEMPTS} attempts`);
      this.finishLocationCapture(bestPosition);
    };

    const errorCallback = (error: any) => {
      console.error('Geolocation error:', error);
      this.fetchingLocation = false;
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          this.locationError = '❌ Location access denied. Please enable location access in browser settings and try again.';
          break;
        case error.POSITION_UNAVAILABLE:
          this.locationError = '❌ Location information is unavailable. Please check your GPS or internet connection and try again.';
          break;
        case error.TIMEOUT:
          this.locationError = '❌ Location request timed out (30 seconds). Please ensure GPS is enabled and try again outdoors.';
          break;
        default:
          this.locationError = '❌ Could not retrieve location. Please try again.';
          break;
      }
    };

    // Use watchPosition to get multiple attempts for best accuracy
    const watchId = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );

    // Stop watching after max attempts or 35 seconds
    setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      
      if (bestPosition) {
        // Already captured, finishLocationCapture was called
      } else if (this.fetchingLocation) {
        // Never got a position
        this.fetchingLocation = false;
        this.locationError = '❌ Could not get accurate location. Please try again outdoors or in an area with clear sky view.';
      }
    }, 35000);
  }

  finishLocationCapture(position: any): void {
    if (!position) return;

    const accuracy = Math.round(position.coords.accuracy);
    console.log('📍 Location captured successfully!');
    console.log('Accuracy:', accuracy, 'meters');

    this.coordinates = {
      lat: parseFloat(position.coords.latitude.toFixed(8)),
      lng: parseFloat(position.coords.longitude.toFixed(8))
    };
    this.locationAccuracy = accuracy;

    console.log('Coordinates:', this.coordinates);
    console.log('Accuracy:', this.locationAccuracy, 'm');
    console.log('DEBUG: Raw GPS - Lat:', position.coords.latitude, 'Lng:', position.coords.longitude);

    // Update form fields with coordinates
    const locationFormGroup = this.reportForm.get('location') as FormGroup;
    if (locationFormGroup) {
      locationFormGroup.patchValue({
        lat: this.coordinates.lat,
        lng: this.coordinates.lng
      });
      console.log('✅ Form coordinates updated - Lat:', locationFormGroup.get('lat')?.value, 'Lng:', locationFormGroup.get('lng')?.value);
    }

    // Show accuracy indicator
    if (accuracy <= 50) {
      this.successMessage = `✅ Excellent accuracy: ${accuracy}m (Very precise!)`;
    } else if (accuracy <= 100) {
      this.successMessage = `✅ Good accuracy: ${accuracy}m (Acceptable)`;
    } else if (accuracy <= 300) {
      this.successMessage = `⚠️ Moderate accuracy: ${accuracy}m (Acceptable)`;
    } else {
      this.successMessage = `⚠️ Accuracy ${accuracy}m - Please get location in open area or try again`;
    }

    // Reverse geocode to get address
    this.reverseGeocode(this.coordinates.lat, this.coordinates.lng);
    this.fetchingLocation = false;
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
            pincode: addr.postcode || '',
            lat: lat,
            lng: lng
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

  // Forward geocoding: Convert address to coordinates
  geocodeAddress(): void {
    const locationForm = this.reportForm.get('location') as FormGroup;
    const address = locationForm.get('address')?.value;
    const city = locationForm.get('city')?.value;
    const state = locationForm.get('state')?.value;
    
    if (!address || !city) {
      this.locationError = 'Please enter address and city to geocode';
      return;
    }

    this.fetchingLocation = true;
    this.locationError = '';
    
    // Format full address for geocoding
    const fullAddress = `${address}, ${city}${state ? ', ' + state : ''}`;
    console.log('🔍 Forward geocoding address:', fullAddress);
    
    // Use OpenStreetMap Nominatim forward geocoding
    const encodedAddress = encodeURIComponent(fullAddress);
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodedAddress}&limit=1`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        console.log('Geocoding response:', data);
        this.fetchingLocation = false;
        
        if (data && data.length > 0) {
          const result = data[0];
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          
          console.log('✅ Geocoded to:', { lat, lng });
          
          // Update form with coordinates
          locationForm.patchValue({
            lat: lat,
            lng: lng
          });
          
          this.coordinates = { lat, lng };
          this.successMessage = `✅ Address geocoded successfully! (${address}, ${city})`;
          setTimeout(() => this.successMessage = '', 4000);
        } else {
          console.warn('No results for address:', fullAddress);
          this.locationError = `⚠️ Could not find coordinates for "${fullAddress}". Please try a different address or use "Use My Current Location" button.`;
        }
      })
      .catch(error => {
        console.error('Geocoding error:', error);
        this.fetchingLocation = false;
        this.locationError = 'Failed to geocode address. Please try again or use current location.';
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
    
    // Include location with coordinates if available
    const locationValue = this.reportForm.get('location')?.value;
    const locationData = {
      address: locationValue.address,
      city: locationValue.city,
      state: locationValue.state,
      pincode: locationValue.pincode,
      lat: locationValue.lat || this.coordinates.lat,
      lng: locationValue.lng || this.coordinates.lng
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
