import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComplaintsService } from '../../../services/complaints.service';
import { AuthService } from '../../../services/auth.service';
import { ComplaintTimelineComponent } from '../../shared/complaint-timeline/complaint-timeline.component';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-assigned-complaints',
  templateUrl: './assigned-complaints.component.html',
  styleUrls: ['./assigned-complaints.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ComplaintTimelineComponent]
})
export class AssignedComplaintsComponent implements OnInit {
  complaints: any[] = [];
  isLoading = true;
  selectedImageUrl = '';
  selectedComplaintTitle = '';
  selectedComplaint: any = null;
  selectedFile: File | null = null;
  isUploading = false;

  // Comments
  complaintComments: any[] = [];
  newComment: string = '';
  isLoadingComments = false;

  constructor(
    private complaintsService: ComplaintsService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadAssignedComplaints();
  }

  loadAssignedComplaints(): void {
    console.log('🔍 Loading worker complaints...');
    this.complaintsService.getWorkerComplaints()
      .subscribe({
        next: (response) => {
          console.log('✅ Worker complaints response:', response);
          this.complaints = response.complaints;
          this.isLoading = false;
          console.log('📋 Total complaints:', this.complaints.length);
        },
        error: (error) => {
          console.error('❌ Error loading assigned complaints:', error);
          console.error('Error details:', error.error);
          this.isLoading = false;
        }
      });
  }

  updateStatus(complaintId: string, status: string): void {
    this.isUploading = true;
    
    if (status === 'resolved' && this.selectedFile) {
      // Handle file upload for resolution proof
      this.complaintsService.updateComplaintStatusWithProof(complaintId, status, this.selectedFile)
        .subscribe({
          next: () => {
            this.loadAssignedComplaints();
            this.selectedFile = null;
            this.isUploading = false;
            // Close modal if it's open
            const modal = document.getElementById('complaintModal');
            if (modal) {
              (modal as any).classList.remove('show');
              document.body.classList.remove('modal-open');
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) backdrop.remove();
            }
          },
          error: (error) => {
            console.error('Error updating status with proof:', error);
            this.isUploading = false;
          }
        });
    } else {
      // Regular status update without proof
      this.complaintsService.updateComplaintStatus(complaintId, status)
        .subscribe({
          next: () => {
            this.loadAssignedComplaints();
            this.isUploading = false;
          },
          error: (error) => {
            console.error('Error updating status:', error);
            this.isUploading = false;
          }
        });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      this.selectedFile = file;
    }
  }

  removeSelectedFile(): void {
    this.selectedFile = null;
    // Reset file input
    const fileInput = document.getElementById('resolutionProof') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  getImageUrl(photoPath: string): string {
    if (!photoPath) {
      return '';
    }
    
    // If it's already a full URL, return as is
    if (photoPath.startsWith('http')) {
      return photoPath;
    }
    
    // Remove leading slash if present to avoid double slashes
    const cleanPath = photoPath.startsWith('/') ? photoPath.substring(1) : photoPath;
    
    // Construct the full URL with the backend base URL
    return `http://localhost:5000/${cleanPath}`;
  }

  openImageModal(photoPath: string, title: string): void {
    this.selectedImageUrl = this.getImageUrl(photoPath);
    this.selectedComplaintTitle = title;
    
    // Open Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-danger';
      case 'medium':
        return 'bg-warning';
      case 'low':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }

  viewComplaintDetails(complaint: any): void {
    this.selectedComplaint = complaint;
    this.newComment = '';
    this.loadCommentsForComplaint(complaint._id);
    
    // Open Bootstrap modal
    const modal = new (window as any).bootstrap.Modal(document.getElementById('detailsModal'));
    modal.show();
  }

  onImageError(event: any): void {
    // You can add additional error handling here
    event.target.style.display = 'none';
  }

  onImageLoad(event: any): void {
    // Image loaded successfully
  }

  onModalImageError(event: any): void {
    // Hide the failed image
    event.target.style.display = 'none';
    
    // Show error message by replacing the image with a placeholder
    const parent = event.target.parentElement;
    if (parent) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'text-center p-5 bg-light rounded';
      errorDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
        <p class="text-muted">Failed to load image</p>
      `;
      parent.appendChild(errorDiv);
    }
  }

  // Comments Methods
  loadCommentsForComplaint(complaintId: string): void {
    this.isLoadingComments = true;
    this.complaintComments = [];
    
    this.complaintsService.getComments(complaintId)
      .subscribe({
        next: (response) => {
          console.log('✅ Loaded comments:', response);
          this.complaintComments = response.comments || [];
          this.isLoadingComments = false;
        },
        error: (error) => {
          console.error('❌ Error loading comments:', error);
          this.isLoadingComments = false;
        }
      });
  }

  addCommentToComplaint(): void {
    if (!this.selectedComplaint || !this.newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    const user = this.authService.getUser();
    if (!user) {
      alert('User not authenticated');
      return;
    }

    this.complaintsService.addComment(this.selectedComplaint._id, this.newComment)
      .subscribe({
        next: (response) => {
          console.log('✅ Comment added:', response);
          this.newComment = '';
          this.loadCommentsForComplaint(this.selectedComplaint!._id);
        },
        error: (error) => {
          console.error('❌ Error adding comment:', error);
          alert('Failed to add comment');
        }
      });
  }

  downloadComplaintDetails(): void {
    if (!this.selectedComplaint) {
      alert('No complaint selected');
      return;
    }

    const complaint = this.selectedComplaint;
    console.log('🔍 Selected Complaint for PDF:', complaint);
    console.log('🔍 Complaint mediaURL:', complaint.mediaURL);
    console.log('🔍 Complaint mediaURLs:', complaint.mediaURLs);
    
    alert('Generating PDF with images...');

    this.generateDirectPDF(complaint);
  }

  private generateDirectPDF(complaint: any): void {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    let yPosition = 20;
    const pageHeight = 297;
    const margin = 15;
    const maxWidth = 180;

    // Helper function to add text
    const addText = (text: string, fontSize: number, bold: boolean = false, color: string = '#000000') => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setFontSize(fontSize);
      pdf.setTextColor(parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16));
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, margin, yPosition);
      yPosition += lines.length * (fontSize / 2.8) + 2;
    };

    // Helper function to add line separator
    const addSeparator = () => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.setDrawColor(0, 123, 255);
      pdf.line(margin, yPosition, margin + maxWidth, yPosition);
      yPosition += 5;
    };

    // Title
    pdf.setFontSize(24);
    pdf.setTextColor(0, 123, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPLAINT REPORT', margin, yPosition);
    yPosition += 15;

    // Complaint ID
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`ID: ${complaint._id}`, margin, yPosition);
    yPosition += 8;

    addSeparator();

    // Complaint Information
    addText('COMPLAINT INFORMATION', 12, true, '#007bff');
    addText(`Title: ${complaint.title || 'N/A'}`, 10);
    addText(`Description: ${complaint.description || 'N/A'}`, 10);
    addText(`Category: ${complaint.category || 'N/A'}`, 10);
    addText(`Type: ${complaint.type || 'N/A'}`, 10);
    addText(`Priority: ${complaint.priority?.toUpperCase() || 'N/A'}`, 10);
    addText(`Status: ${complaint.status || 'N/A'}`, 10);
    yPosition += 5;

    addSeparator();

    // Location Information
    addText('LOCATION DETAILS', 12, true, '#007bff');
    addText(`Address: ${complaint.location?.address || 'N/A'}`, 10);
    addText(`City: ${complaint.location?.city || 'N/A'}`, 10);
    addText(`State: ${complaint.location?.state || 'N/A'}`, 10);
    addText(`Pincode: ${complaint.location?.pincode || 'N/A'}`, 10);
    addText(`GPS: ${complaint.location?.lat || 0}, ${complaint.location?.lng || 0}`, 10);
    yPosition += 5;

    addSeparator();

    // Reporter Information
    addText('REPORTER INFORMATION', 12, true, '#007bff');
    addText(`Name: ${complaint.createdBy?.name || 'Anonymous'}`, 10);
    addText(`Email: ${complaint.createdBy?.email || 'N/A'}`, 10);
    addText(`Reported: ${new Date(complaint.createdAt).toLocaleString()}`, 10);
    addText(`Updated: ${complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : 'N/A'}`, 10);
    yPosition += 5;

    addSeparator();

    // Assignment Information
    addText('ASSIGNMENT', 12, true, '#007bff');
    addText(`Assigned To: ${complaint.assignedTo?.name || 'Not Assigned'}`, 10);
    yPosition += 5;

    // Resolution Information (if resolved)
    if (complaint.status === 'Resolved') {
      addSeparator();
      addText('RESOLUTION INFORMATION', 12, true, '#007bff');
      addText(`Resolution Date: ${complaint.resolutionProof?.completedAt ? new Date(complaint.resolutionProof.completedAt).toLocaleString() : 'N/A'}`, 10);
      addText(`Description: ${complaint.resolutionProof?.description || 'N/A'}`, 10);
      yPosition += 5;
    }

    // Add Images - Wait for all to load
    if ((complaint.mediaURLs && complaint.mediaURLs.length > 0) || complaint.mediaURL) {
      addSeparator();
      addText('COMPLAINT IMAGES', 12, true, '#007bff');
      yPosition += 5;

      const imagesToAdd = complaint.mediaURLs || (complaint.mediaURL ? [complaint.mediaURL] : []);
      
      console.log('📸 Images to add to PDF:', imagesToAdd);
      console.log('📸 Total images:', imagesToAdd.length);
      
      // Load all images first, then add to PDF
      const imagePromises = imagesToAdd.map((imageUrl: string, idx: number) => {
        return new Promise<{data: string, width: number, height: number}>((resolve, reject) => {
          // Fix the image URL to point to backend server
          const fullImageUrl = imageUrl.startsWith('http') 
            ? imageUrl 
            : `http://localhost:5001${imageUrl}`;
          
          console.log(`🔄 Loading image ${idx + 1}:`, fullImageUrl);
          
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            console.log(`✅ Image ${idx + 1} loaded successfully!`, img.width, 'x', img.height);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              const base64Data = canvas.toDataURL('image/jpeg', 0.9);
              console.log(`✅ Image ${idx + 1} converted to base64`);
              resolve({
                data: base64Data,
                width: img.width,
                height: img.height
              });
            } else {
              reject('Canvas context failed');
            }
          };
          
          img.onerror = (err) => {
            console.error(`❌ Image ${idx + 1} failed to load:`, fullImageUrl, err);
            reject('Image load failed: ' + fullImageUrl);
          };
          
          img.src = fullImageUrl;
        });
      });

      // Wait for all images to load
      Promise.all(imagePromises).then((loadedImages) => {
        console.log(`✅ All ${loadedImages.length} images loaded successfully!`);
        
        // Add all images to PDF
        loadedImages.forEach((imgData, index) => {
          const imgWidth = 150;
          const imgHeight = (imgData.height / imgData.width) * imgWidth;

          if (yPosition + imgHeight > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          console.log(`📄 Adding image ${index + 1} to PDF at position Y=${yPosition}`);
          pdf.addImage(imgData.data, 'JPEG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 5;

          pdf.setFontSize(9);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`Image ${index + 1}`, margin, yPosition);
          yPosition += 10;
        });

        console.log('✅ All images added to PDF, finalizing...');
        // Now finalize PDF after all images added
        this.finalizePDF(pdf, complaint);
      }).catch((error) => {
        console.error('❌ Error loading images:', error);
        alert('Some images could not be loaded. PDF generated without images.');
        // Finalize without images if loading fails
        this.finalizePDF(pdf, complaint);
      });
    } else {
      console.log('ℹ️ No images found in complaint');
      // No images, finalize immediately
      this.finalizePDF(pdf, complaint);
    }
  }

  private finalizePDF(pdf: jsPDF, complaint: any): void {
    // Add Comments Section - only add page if there are comments
    let yPosition = 20;
    const pageHeight = 297;
    const margin = 15;
    const maxWidth = 180;

    // Check if there are comments to add
    const hasComments = this.complaintComments && this.complaintComments.length > 0;

    if (hasComments) {
      // Only add comments page if there are comments
      pdf.addPage();
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 123, 255);
      pdf.text('COMMENTS & NOTES', margin, yPosition);
      yPosition += 10;

      this.complaintComments.forEach((comment: any) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(0, 123, 255);
        const commentAuthor = `${comment.userName} (${comment.userRole})`;
        pdf.text(commentAuthor, margin, yPosition);
        yPosition += 5;

        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(new Date(comment.createdAt).toLocaleString(), margin, yPosition);
        yPosition += 4;

        pdf.setFontSize(9);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(comment.text, maxWidth - 10);
        pdf.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 4 + 5;

        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, yPosition, margin + maxWidth, yPosition);
        yPosition += 5;
      });
    }

    // Save the PDF without empty footer page
    const fileName = `Complaint_${complaint._id}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

    alert('Complaint PDF downloaded successfully with images!');
  }

  private generateComplaintDocument(complaint: any): string {
    const reportDate = new Date(complaint.createdAt).toLocaleString();
    const updatedDate = complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : 'N/A';
    const assignedWorkerName = complaint.assignedTo?.firstName ? 
      `${complaint.assignedTo.firstName} ${complaint.assignedTo.lastName}` : 'Not Assigned';
    const reporterName = complaint.createdBy?.name || 'Anonymous';
    const reporterEmail = complaint.createdBy?.email || 'N/A';
    const resolutionDate = complaint.resolutionProof?.completedAt ? 
      new Date(complaint.resolutionProof.completedAt).toLocaleString() : 'N/A';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Report - ${complaint._id}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #007bff;
            margin-bottom: 10px;
            font-size: 28px;
          }
          .header p {
            color: #666;
            font-size: 14px;
          }
          .complaint-id {
            background-color: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            font-family: monospace;
            text-align: center;
            margin-top: 10px;
            font-size: 12px;
            color: #555;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            background-color: #007bff;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: bold;
          }
          .row {
            display: flex;
            margin-bottom: 12px;
          }
          .col {
            flex: 1;
            padding-right: 20px;
          }
          .col-full {
            flex: 0 0 100%;
          }
          .label {
            font-weight: bold;
            color: #444;
            display: block;
            margin-bottom: 3px;
            font-size: 13px;
            text-transform: uppercase;
            color: #666;
          }
          .value {
            color: #333;
            padding: 8px;
            background-color: #f9f9f9;
            border-left: 3px solid #007bff;
            border-radius: 2px;
            font-size: 14px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            color: white;
          }
          .status-pending {
            background-color: #ffc107;
            color: #333;
          }
          .status-in-progress {
            background-color: #0dcaf0;
          }
          .status-resolved {
            background-color: #198754;
          }
          .status-rejected {
            background-color: #dc3545;
          }
          .priority-high {
            color: #dc3545;
            font-weight: bold;
          }
          .priority-medium {
            color: #ffc107;
            font-weight: bold;
          }
          .priority-low {
            color: #28a745;
            font-weight: bold;
          }
          .comments-section {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            margin-top: 15px;
          }
          .comment {
            background: white;
            padding: 12px;
            margin-bottom: 10px;
            border-left: 3px solid #007bff;
            border-radius: 2px;
          }
          .comment-author {
            font-weight: bold;
            color: #007bff;
            font-size: 12px;
            margin-bottom: 5px;
          }
          .comment-time {
            font-size: 11px;
            color: #999;
            margin-left: 10px;
          }
          .comment-text {
            color: #333;
            font-size: 13px;
            margin-top: 5px;
          }
          .empty-message {
            color: #999;
            font-style: italic;
            font-size: 13px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .print-timestamp {
            color: #999;
            margin-top: 10px;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .container {
              box-shadow: none;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>📋 Work Assignment Report</h1>
            <p>Complaint & Assignment Record</p>
            <div class="complaint-id">ID: ${complaint._id}</div>
          </div>

          <!-- Main Information -->
          <div class="section">
            <div class="section-title">📝 Complaint Information</div>
            <div class="row">
              <div class="col">
                <span class="label">Title</span>
                <div class="value">${complaint.title || 'N/A'}</div>
              </div>
            </div>
            <div class="row">
              <div class="col-full">
                <span class="label">Description</span>
                <div class="value" style="white-space: pre-wrap;">${complaint.description || 'N/A'}</div>
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="label">Category</span>
                <div class="value">${complaint.category || complaint.type || 'N/A'}</div>
              </div>
              <div class="col">
                <span class="label">Type</span>
                <div class="value">${complaint.type || 'N/A'}</div>
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="label">Priority</span>
                <div class="value">
                  <span class="priority-${complaint.priority || 'low'}">
                    ${(complaint.priority || 'Low').toUpperCase()}
                  </span>
                </div>
              </div>
              <div class="col">
                <span class="label">Status</span>
                <div class="value">
                  <span class="status-badge status-${complaint.status?.toLowerCase().replace(/ /g, '-') || 'pending'}">
                    ${complaint.status || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Location Information -->
          <div class="section">
            <div class="section-title">📍 Location Details</div>
            <div class="row">
              <div class="col-full">
                <span class="label">Address</span>
                <div class="value">${complaint.location?.address || 'N/A'}</div>
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="label">City/Town</span>
                <div class="value">${complaint.location?.city || 'N/A'}</div>
              </div>
              <div class="col">
                <span class="label">State</span>
                <div class="value">${complaint.location?.state || 'N/A'}</div>
              </div>
              <div class="col">
                <span class="label">Pincode</span>
                <div class="value">${complaint.location?.pincode || 'N/A'}</div>
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="label">GPS Coordinates</span>
                <div class="value">${complaint.location?.lat || 0}, ${complaint.location?.lng || 0}</div>
              </div>
            </div>
          </div>

          <!-- Reporter Information -->
          <div class="section">
            <div class="section-title">👤 Reporter Information</div>
            <div class="row">
              <div class="col">
                <span class="label">Name</span>
                <div class="value">${reporterName}</div>
              </div>
              <div class="col">
                <span class="label">Email</span>
                <div class="value">${reporterEmail}</div>
              </div>
            </div>
            <div class="row">
              <div class="col">
                <span class="label">Report Date</span>
                <div class="value">${reportDate}</div>
              </div>
              <div class="col">
                <span class="label">Last Updated</span>
                <div class="value">${updatedDate}</div>
              </div>
            </div>
          </div>

          <!-- Assignment Information -->
          <div class="section">
            <div class="section-title">👨‍💼 Assignment Information</div>
            <div class="row">
              <div class="col">
                <span class="label">Assigned To</span>
                <div class="value">${assignedWorkerName}</div>
              </div>
            </div>
          </div>

          <!-- Resolution Information (if resolved) -->
          ${complaint.status === 'resolved' ? `
          <div class="section">
            <div class="section-title">✅ Resolution Information</div>
            <div class="row">
              <div class="col">
                <span class="label">Resolution Date</span>
                <div class="value">${resolutionDate}</div>
              </div>
            </div>
            <div class="row">
              <div class="col-full">
                <span class="label">Resolution Description</span>
                <div class="value" style="white-space: pre-wrap;">${complaint.resolutionProof?.description || 'N/A'}</div>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Images Section -->
          ${(complaint.mediaURLs && complaint.mediaURLs.length > 0) || complaint.mediaURL ? `
          <div class="section">
            <div class="section-title">📸 Complaint Images</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; margin-top: 15px;">
              ${complaint.mediaURLs && complaint.mediaURLs.length > 0 ? 
                complaint.mediaURLs.map((url: string, idx: number) => `
                  <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
                    <img src="${url}" alt="Complaint Image ${idx + 1}" style="width: 100%; height: auto; display: block;" />
                    <p style="padding: 10px; margin: 0; font-size: 12px; color: #666; background: #f9f9f9;">Image ${idx + 1}</p>
                  </div>
                `).join('')
              :
                (complaint.mediaURL ? `
                  <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
                    <img src="${complaint.mediaURL}" alt="Complaint Image" style="width: 100%; height: auto; display: block;" />
                    <p style="padding: 10px; margin: 0; font-size: 12px; color: #666; background: #f9f9f9;">Image 1</p>
                  </div>
                ` : '')}
            </div>
          </div>
          ` : ''}

          <!-- Comments Section -->
          <div class="section">
            <div class="section-title">💬 Comments & Notes</div>
            <div class="comments-section">
              ${this.complaintComments && this.complaintComments.length > 0 ? `
                ${this.complaintComments.map(comment => `
                  <div class="comment">
                    <div class="comment-author">
                      ${comment.userName} 
                      <span style="color: #666;">(${comment.userRole})</span>
                      <span class="comment-time">${new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                  </div>
                `).join('')}
              ` : `
                <p class="empty-message">No comments added yet</p>
              `}
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>This is an official work assignment record from the CivicPulse system.</p>
            <p class="print-timestamp">Generated on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
