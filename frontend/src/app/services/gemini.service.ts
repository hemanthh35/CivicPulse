import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GeminiAnalysisResponse {
  success: boolean;
  message: string;
  data?: {
    title: string;
    category: string;
    description: string;
    priority: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private apiUrl = `${environment.apiUrl}/gemini`;

  constructor(private http: HttpClient) {}

  /**
   * Analyze image with Gemini AI
   * @param imageFile - The image file to analyze
   * @returns Observable with AI-generated complaint details
   */
  analyzeImage(imageFile: File): Observable<GeminiAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<GeminiAnalysisResponse>(
      `${this.apiUrl}/analyze-image`,
      formData
    );
  }
}
