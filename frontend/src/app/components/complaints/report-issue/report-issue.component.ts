import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ComplaintsService } from '../../../services/complaints.service';
import { AuthService } from '../../../services/auth.service';
import { GeminiService } from '../../../services/gemini.service';
import { TranslateService, TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-report-issue',
  templateUrl: './report-issue.component.html',
  styleUrls: ['./report-issue.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule]
})
export class ReportIssueComponent implements OnInit {
  reportForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  categories = [
    'complaints.roadInfrastructure',
    'complaints.waterSanitation',
    'complaints.electricity',
    'complaints.publicSafety',
    'complaints.garbage',
    'complaints.parks',
    'complaints.noise',
    'complaints.transport',
    'complaints.other'
  ];
  uploadedImages: File[] = [];
  previewUrls: string[] = [];
  analyzingImage = false;
  aiSuggestion = '';

  // Voice recognition properties
  recognition: any = null;
  isListeningTitle = false;
  isListeningDescription = false;
  voiceSupported = false;

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
    private router: Router,
    private translate: TranslateService
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

  ngOnInit(): void {
    const savedLang = localStorage.getItem('language') || 'en';
    this.translate.use(savedLang);
    this.initSpeechRecognition();
  }

  initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.voiceSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      
      // Set language based on current selection
      const currentLang = localStorage.getItem('language') || 'en';
      this.recognition.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'te' ? 'te-IN' : 'en-US';
    }
  }

  startVoiceInput(field: 'title' | 'description'): void {
    if (!this.recognition) return;

    // Update language before starting
    const currentLang = localStorage.getItem('language') || 'en';
    this.recognition.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'te' ? 'te-IN' : 'en-US';

    if (field === 'title') {
      this.isListeningTitle = true;
    } else {
      this.isListeningDescription = true;
    }

    this.recognition.start();

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (field === 'title') {
        this.reportForm.patchValue({ title: transcript });
        this.isListeningTitle = false;
      } else {
        const currentDesc = this.reportForm.get('description')?.value || '';
        const newDesc = currentDesc ? `${currentDesc} ${transcript}` : transcript;
        this.reportForm.patchValue({ description: newDesc });
        this.isListeningDescription = false;
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      this.isListeningTitle = false;
      this.isListeningDescription = false;
      this.errorMessage = 'Voice input failed. Please try again.';
    };

    this.recognition.onend = () => {
      this.isListeningTitle = false;
      this.isListeningDescription = false;
    };
  }

  stopVoiceInput(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.isListeningTitle = false;
      this.isListeningDescription = false;
    }
  }

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
    if (!navigator.geolocation) {
      this.locationError = 'Geolocation is not supported by this browser.';
      return;
    }

    this.fetchingLocation = true;
    this.locationError = '';

    // Fast geolocation - accept cached position and lower timeout
    const options = {
      enableHighAccuracy: false,  // Use network location for speed
      timeout: 5000,              // 5 second timeout
      maximumAge: 60000           // Accept cached position up to 1 minute old
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.finishLocationCapture(position);
      },
      (error) => {
        // If fast method fails, try with high accuracy
        const highAccuracyOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.finishLocationCapture(position);
          },
          (err) => {
            this.fetchingLocation = false;
            switch (err.code) {
              case err.PERMISSION_DENIED:
                this.locationError = 'Location access denied. Please enable in browser settings.';
                break;
              case err.POSITION_UNAVAILABLE:
                this.locationError = 'Location unavailable. Check GPS/internet.';
                break;
              case err.TIMEOUT:
                this.locationError = 'Location timed out. Please try again.';
                break;
              default:
                this.locationError = 'Could not get location. Please try again.';
            }
          },
          highAccuracyOptions
        );
      },
      options
    );
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
