const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Gemini AI Service
 * Analyzes images to auto-generate complaint details
 */

class GeminiService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY not set. Image analysis will be disabled.');
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  /**
   * Analyze image and generate complaint details
   * @param {Buffer} imageBuffer - Image file buffer
   * @param {string} mimeType - Image MIME type
   * @returns {Promise<Object>} - Generated title, category, and description
   */
  async analyzeImage(imageBuffer, mimeType) {
    try {
      if (!this.genAI) {
        throw new Error('Gemini API is not configured. Please set GEMINI_API_KEY in environment variables.');
      }

      console.log('🤖 Analyzing image with Gemini AI...');

      // Get the generative model - using gemini-2.5-flash (latest stable version)
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash'
      });

      // 1️⃣ Convert buffer to base64
      const base64Image = imageBuffer.toString('base64');

      // 2️⃣ Send descriptive prompt for civic issue analysis
      const prompt = `You're helping a citizen report a problem. Look at this image and fill out their complaint form naturally.

Return ONLY JSON (no markdown):
{
  "title": "Simple 5-8 word description of the problem",
  "category": "Roads & Infrastructure OR Water & Sanitation OR Electricity OR Public Safety OR Garbage & Waste OR Parks & Environment OR Noise & Disturbance OR Public Transport OR Other",
  "description": "Write like a normal person reporting a problem. 2-3 simple sentences. What's broken? Why does it matter? Keep it under 60 words.",
  "priority": "low OR medium OR high"
}

Sound natural, not formal. No technical jargon. Just describe what's wrong.`;

      const imageParts = [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        }
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      const text = response.text();

      console.log('📝 Gemini raw response:', text);

      // 3️⃣ Parse the model's text response into JSON (remove markdown fences if any)
      let jsonText = text.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      const analysis = JSON.parse(jsonText);

      console.log('✅ Image analysis complete:', analysis);

      // 4️⃣ Return success response with structured data
      return {
        success: true,
        data: {
          title: analysis.title || '',
          category: analysis.category || 'Other',
          description: analysis.description || '',
          priority: analysis.priority || 'medium'
        }
      };

    } catch (error) {
      console.error('❌ Gemini analysis error:', error);
      
      // 5️⃣ Handle errors gracefully - missing API key or 404 model errors
      let errorMessage = error.message || 'Failed to analyze image';
      
      if (error.message && error.message.includes('404')) {
        errorMessage = 'Gemini model not accessible. Please verify your API key has access to gemini-2.5-flash model at https://aistudio.google.com/app/apikey';
      } else if (error.message && error.message.includes('API_KEY_INVALID')) {
        errorMessage = 'Invalid API key. Please generate a new key at https://aistudio.google.com/app/apikey';
      } else if (error.message && error.message.includes('not configured')) {
        errorMessage = 'Gemini API is not configured. Please set GEMINI_API_KEY in environment variables.';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check if Gemini service is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.genAI !== null;
  }
}

module.exports = new GeminiService();
