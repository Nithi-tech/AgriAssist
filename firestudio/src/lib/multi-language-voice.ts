// ============================================================================
// MULTI-LANGUAGE VOICE SERVICE
// Comprehensive STT and TTS with multiple API providers and language support
// ============================================================================

import './speech-types';

export interface VoiceConfig {
  sttProvider: 'browser' | 'google-cloud' | 'whisper' | 'azure';
  ttsProvider: 'browser' | 'google-cloud' | 'azure' | 'elevenlabs';
  language: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface SpeechResult {
  transcript: string;
  confidence: number;
  language: string;
  provider: string;
}

export interface VoiceOptions {
  text: string;
  language: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

// Language configurations with STT and TTS support
export const LANGUAGE_CONFIGS = {
  'hi': {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    sttLang: 'hi-IN',
    ttsLang: 'hi-IN',
    browserVoices: ['hi-IN'],
    googleVoices: ['hi-IN-Standard-A', 'hi-IN-Wavenet-A'],
    azureVoices: ['hi-IN-MadhurNeural', 'hi-IN-SwaraNeural']
  },
  'ta': {
    name: 'Tamil',
    nativeName: 'தமிழ்',
    sttLang: 'ta-IN',
    ttsLang: 'ta-IN',
    browserVoices: ['ta-IN'],
    googleVoices: ['ta-IN-Standard-A', 'ta-IN-Wavenet-A'],
    azureVoices: ['ta-IN-PallaviNeural', 'ta-IN-ValluvarNeural']
  },
  'te': {
    name: 'Telugu',
    nativeName: 'తెలుగు',
    sttLang: 'te-IN',
    ttsLang: 'te-IN',
    browserVoices: ['te-IN'],
    googleVoices: ['te-IN-Standard-A'],
    azureVoices: ['te-IN-ShrutiNeural', 'te-IN-MohanNeural']
  },
  'en': {
    name: 'English',
    nativeName: 'English',
    sttLang: 'en-US',
    ttsLang: 'en-US',
    browserVoices: ['en-US', 'en-GB', 'en-AU'],
    googleVoices: ['en-US-Standard-A', 'en-US-Neural2-A', 'en-US-Wavenet-A'],
    azureVoices: ['en-US-JennyNeural', 'en-US-AriaNeural']
  },
  'bn': {
    name: 'Bengali',
    nativeName: 'বাংলা',
    sttLang: 'bn-IN',
    ttsLang: 'bn-IN',
    browserVoices: ['bn-IN'],
    googleVoices: ['bn-IN-Standard-A'],
    azureVoices: ['bn-IN-BashkarNeural', 'bn-IN-TanishaaNeural']
  },
  'gu': {
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    sttLang: 'gu-IN',
    ttsLang: 'gu-IN',
    browserVoices: ['gu-IN'],
    googleVoices: ['gu-IN-Standard-A'],
    azureVoices: ['gu-IN-DhwaniNeural', 'gu-IN-NiranjanNeural']
  },
  'as': {
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    sttLang: 'as-IN',
    ttsLang: 'as-IN',
    browserVoices: ['as-IN'],
    googleVoices: ['as-IN-Standard-A'],
    azureVoices: ['as-IN-DipanjalNeural']
  }
};

export class MultiLanguageVoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private currentConfig: VoiceConfig;
  private googleCloudApiKey?: string;
  private azureApiKey?: string;
  private azureRegion?: string;

  constructor(config: VoiceConfig) {
    this.currentConfig = config;
    this.initializeBrowserAPIs();
    this.loadAPIKeys();
  }

  private initializeBrowserAPIs() {
    if (typeof window !== 'undefined') {
      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.configureRecognition();
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        this.loadVoices();
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadAPIKeys() {
    // These would typically be loaded from environment variables in a production app
    this.googleCloudApiKey = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY;
    this.azureApiKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
    this.azureRegion = process.env.NEXT_PUBLIC_AZURE_REGION || 'eastus';
  }

  private configureRecognition() {
    if (!this.recognition) return;

    const langConfig = LANGUAGE_CONFIGS[this.currentConfig.language as keyof typeof LANGUAGE_CONFIGS];
    
    // Core settings for better voice catching
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = langConfig?.sttLang || 'en-US';
    this.recognition.maxAlternatives = 1; // Changed from 3 to 1 for better accuracy
    
    // Improved audio settings for better voice detection (if supported)
    try {
      if ('audioSettings' in this.recognition) {
        (this.recognition as any).audioSettings = {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        };
      }

      // Set longer timeout for better voice catching (if supported)
      if ('speechTimeouts' in this.recognition) {
        (this.recognition as any).speechTimeouts = {
          recognitionTimeout: 8000,
          endOfSpeechTimeout: 2000
        };
      }
    } catch (error) {
      console.warn('Advanced audio settings not supported:', error);
    }
  }

  private loadVoices() {
    if (this.synthesis) {
      this.availableVoices = this.synthesis.getVoices();
    }
  }

  // ============================================================================
  // SPEECH-TO-TEXT (STT) METHODS
  // ============================================================================

  async startListening(): Promise<SpeechResult> {
    return new Promise(async (resolve, reject) => {
      // Check microphone permissions first
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissionStatus.state === 'denied') {
          reject(new Error('Microphone access denied. Please allow microphone access in your browser settings.'));
          return;
        }
      } catch (error) {
        console.warn('Permission check failed:', error);
      }

      // Request microphone access
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        reject(new Error('Unable to access microphone. Please check your microphone settings and permissions.'));
        return;
      }

      let retryCount = 0;
      const maxRetries = 2;

      const attemptSTT = async (): Promise<SpeechResult> => {
        try {
          const result = await this.getSTTResult();
          return result;
        } catch (error) {
          retryCount++;
          console.warn(`STT attempt ${retryCount} failed:`, error);
          
          if (retryCount <= maxRetries) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
            return attemptSTT();
          } else {
            throw error;
          }
        }
      };

      // Try primary STT provider with retries
      try {
        const result = await attemptSTT();
        resolve(result);
      } catch (error) {
        console.warn(`Primary STT provider failed after ${maxRetries} retries, trying fallback...`, error);
        
        // Try fallback provider
        try {
          const fallbackResult = await this.getFallbackSTT();
          resolve(fallbackResult);
        } catch (fallbackError) {
          reject(new Error(`All STT providers failed: ${fallbackError}`));
        }
      }
    });
  }

  private async getSTTResult(): Promise<SpeechResult> {
    switch (this.currentConfig.sttProvider) {
      case 'browser':
        return this.browserSTT();
      case 'google-cloud':
        return this.googleCloudSTT();
      case 'azure':
        return this.azureSTT();
      case 'whisper':
        return this.whisperSTT();
      default:
        return this.browserSTT();
    }
  }

  private browserSTT(): Promise<SpeechResult> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      // Stop any previous recognition session
      this.recognition.stop();

      // Configure recognition with better settings
      this.configureRecognition();
      
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        if (this.recognition) {
          this.recognition.stop();
        }
        reject(new Error('Speech recognition timeout'));
      }, 10000); // 10 second timeout

      let hasResult = false;

      this.recognition.onresult = (event) => {
        if (hasResult) return; // Prevent multiple results
        hasResult = true;
        clearTimeout(timeout);
        
        try {
          const result = event.results[0];
          if (result && result[0]) {
            const transcript = result[0].transcript.trim();
            const confidence = result[0].confidence || 0.95;

            console.log('Speech result:', { transcript, confidence });

            if (transcript.length > 0) {
              resolve({
                transcript,
                confidence,
                language: this.currentConfig.language,
                provider: 'browser'
              });
            } else {
              reject(new Error('No speech detected'));
            }
          } else {
            reject(new Error('No speech result available'));
          }
        } catch (error) {
          reject(new Error(`Error processing speech result: ${error}`));
        }
      };

      this.recognition.onerror = (event) => {
        if (hasResult) return; // Ignore errors after successful result
        hasResult = true;
        clearTimeout(timeout);
        
        let errorMessage = 'Speech recognition error';
        
        switch(event.error) {
          case 'no-speech':
            // Handle no-speech gracefully with warning instead of error
            console.warn('No speech detected. User can try again.');
            errorMessage = 'No speech detected. Please try speaking again.';
            // Don't reject for no-speech, resolve with empty result to allow retry
            resolve({
              transcript: '',
              confidence: 0,
              language: this.currentConfig.language,
              provider: 'browser'
            });
            return;
          case 'audio-capture':
            errorMessage = 'Microphone access denied or unavailable.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please allow microphone access.';
            break;
          case 'network':
            errorMessage = 'Network error during speech recognition.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service not allowed.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        // Log different levels based on error type
        if (event.error === 'no-speech' || event.error === 'aborted') {
          console.warn('Speech recognition warning:', event.error);
        } else {
          console.error('Speech recognition error:', event.error);
        }
        reject(new Error(errorMessage));
      };

      this.recognition.onend = () => {
        clearTimeout(timeout);
        if (!hasResult) {
          // If recognition ended without result and no error was handled, resolve with empty
          console.warn('Speech recognition ended without result - possibly no speech detected');
          resolve({
            transcript: '',
            confidence: 0,
            language: this.currentConfig.language,
            provider: 'browser'
          });
        }
      };

      this.recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      // Start recognition with error handling
      try {
        console.log('Starting speech recognition...');
        this.recognition.start();
      } catch (error) {
        clearTimeout(timeout);
        reject(new Error(`Failed to start speech recognition: ${error}`));
      }
    });
  }

  private async googleCloudSTT(): Promise<SpeechResult> {
    if (!this.googleCloudApiKey) {
      throw new Error('Google Cloud API key not configured');
    }

    // This would integrate with Google Cloud Speech-to-Text API
    // Implementation would involve recording audio and sending to API
    throw new Error('Google Cloud STT not yet implemented');
  }

  private async azureSTT(): Promise<SpeechResult> {
    if (!this.azureApiKey) {
      throw new Error('Azure Speech API key not configured');
    }

    // This would integrate with Azure Speech Services
    throw new Error('Azure STT not yet implemented');
  }

  private async whisperSTT(): Promise<SpeechResult> {
    // This would integrate with OpenAI Whisper API
    throw new Error('Whisper STT not yet implemented');
  }

  private async getFallbackSTT(): Promise<SpeechResult> {
    // Always fall back to browser STT if available
    if (this.recognition) {
      return this.browserSTT();
    }
    throw new Error('No fallback STT available');
  }

  // ============================================================================
  // TEXT-TO-SPEECH (TTS) METHODS
  // ============================================================================

  async speak(options: VoiceOptions): Promise<void> {
    try {
      await this.getTTSResult(options);
    } catch (error) {
      console.warn(`Primary TTS provider failed, trying fallback...`, error);
      
      // Try fallback provider
      try {
        await this.getFallbackTTS(options);
      } catch (fallbackError) {
        throw new Error(`All TTS providers failed: ${fallbackError}`);
      }
    }
  }

  private async getTTSResult(options: VoiceOptions): Promise<void> {
    switch (this.currentConfig.ttsProvider) {
      case 'browser':
        return this.browserTTS(options);
      case 'google-cloud':
        return this.googleCloudTTS(options);
      case 'azure':
        return this.azureTTS(options);
      case 'elevenlabs':
        return this.elevenlabsTTS(options);
      default:
        return this.browserTTS(options);
    }
  }

  private async browserTTS(options: VoiceOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(options.text);
      const langConfig = LANGUAGE_CONFIGS[options.language as keyof typeof LANGUAGE_CONFIGS];

      // Find the best voice for the language
      const targetLang = langConfig?.ttsLang || options.language;
      const voice = this.findBestVoice(targetLang, options.voiceName);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = targetLang;
      }

      // Set voice parameters
      utterance.rate = options.rate || this.currentConfig.rate || 1;
      utterance.pitch = options.pitch || this.currentConfig.pitch || 1;
      utterance.volume = options.volume || this.currentConfig.volume || 1;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`TTS error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }

  private async googleCloudTTS(options: VoiceOptions): Promise<void> {
    if (!this.googleCloudApiKey) {
      throw new Error('Google Cloud API key not configured');
    }

    const langConfig = LANGUAGE_CONFIGS[options.language as keyof typeof LANGUAGE_CONFIGS];
    const voiceName = options.voiceName || langConfig?.googleVoices?.[0];

    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.googleCloudApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text: options.text },
          voice: {
            languageCode: langConfig?.ttsLang || options.language,
            name: voiceName,
            ssmlGender: 'NEUTRAL'
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: options.rate || 1,
            pitch: options.pitch || 1,
            volumeGainDb: options.volume ? (options.volume - 1) * 20 : 0
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Google Cloud TTS API error: ${response.status}`);
      }

      const data = await response.json();
      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      
      return new Promise((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Audio playback failed'));
        audio.play();
      });

    } catch (error) {
      throw new Error(`Google Cloud TTS failed: ${error}`);
    }
  }

  private async azureTTS(options: VoiceOptions): Promise<void> {
    if (!this.azureApiKey || !this.azureRegion) {
      throw new Error('Azure Speech API credentials not configured');
    }

    const langConfig = LANGUAGE_CONFIGS[options.language as keyof typeof LANGUAGE_CONFIGS];
    const voiceName = options.voiceName || langConfig?.azureVoices?.[0];

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${langConfig?.ttsLang || options.language}">
        <voice name="${voiceName}">
          <prosody rate="${(options.rate || 1) * 100}%" pitch="${options.pitch || 1}" volume="${options.volume || 1}">
            ${options.text}
          </prosody>
        </voice>
      </speak>
    `;

    try {
      const response = await fetch(`https://${this.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.azureApiKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3'
        },
        body: ssml
      });

      if (!response.ok) {
        throw new Error(`Azure TTS API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
      const audio = new Audio(URL.createObjectURL(blob));

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audio.src);
          resolve();
        };
        audio.onerror = () => reject(new Error('Audio playback failed'));
        audio.play();
      });

    } catch (error) {
      throw new Error(`Azure TTS failed: ${error}`);
    }
  }

  private async elevenlabsTTS(options: VoiceOptions): Promise<void> {
    // ElevenLabs implementation would go here
    throw new Error('ElevenLabs TTS not yet implemented');
  }

  private async getFallbackTTS(options: VoiceOptions): Promise<void> {
    // Always fall back to browser TTS if available
    if (this.synthesis) {
      return this.browserTTS(options);
    }
    throw new Error('No fallback TTS available');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private findBestVoice(targetLang: string, preferredVoiceName?: string): SpeechSynthesisVoice | null {
    if (!this.availableVoices.length) return null;

    // Try to find the exact voice name if specified
    if (preferredVoiceName) {
      const exactVoice = this.availableVoices.find(voice => 
        voice.name === preferredVoiceName
      );
      if (exactVoice) return exactVoice;
    }

    // Try to find exact language match
    const exactLangVoice = this.availableVoices.find(voice => 
      voice.lang === targetLang
    );
    if (exactLangVoice) return exactLangVoice;

    // Try to find language family match (e.g., 'hi' matches 'hi-IN')
    const langFamily = targetLang.split('-')[0];
    const familyVoice = this.availableVoices.find(voice => 
      voice.lang.startsWith(langFamily)
    );
    if (familyVoice) return familyVoice;

    // Return default voice
    const defaultVoice = this.availableVoices.find(voice => voice.default);
    return defaultVoice || this.availableVoices[0] || null;
  }

  getAvailableVoicesForLanguage(language: string): SpeechSynthesisVoice[] {
    const langConfig = LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];
    const targetLang = langConfig?.ttsLang || language;
    const langFamily = targetLang.split('-')[0];

    return this.availableVoices.filter(voice => 
      voice.lang === targetLang || voice.lang.startsWith(langFamily)
    );
  }

  updateConfig(newConfig: Partial<VoiceConfig>) {
    this.currentConfig = { ...this.currentConfig, ...newConfig };
    this.configureRecognition();
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }

  stopListening() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  isListening(): boolean {
    // This would need to be tracked in state
    return false;
  }

  isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false;
  }

  getSupportedLanguages(): string[] {
    return Object.keys(LANGUAGE_CONFIGS);
  }

  getLanguageConfig(language: string) {
    return LANGUAGE_CONFIGS[language as keyof typeof LANGUAGE_CONFIGS];
  }
}

// ============================================================================
// TRANSLATION SERVICE
// ============================================================================

export class TranslationService {
  private googleTranslateApiKey?: string;
  private azureTranslatorKey?: string;
  private azureTranslatorRegion?: string;

  constructor() {
    this.loadAPIKeys();
  }

  private loadAPIKeys() {
    this.googleTranslateApiKey = process.env.NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY;
    this.azureTranslatorKey = process.env.NEXT_PUBLIC_AZURE_TRANSLATOR_KEY;
    this.azureTranslatorRegion = process.env.NEXT_PUBLIC_AZURE_TRANSLATOR_REGION || 'global';
  }

  async translateText(text: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<string> {
    if (sourceLanguage === targetLanguage) {
      return text; // No translation needed
    }

    try {
      // Try Google Translate first
      if (this.googleTranslateApiKey) {
        return await this.googleTranslate(text, targetLanguage, sourceLanguage);
      }

      // Fall back to Azure Translator
      if (this.azureTranslatorKey) {
        return await this.azureTranslate(text, targetLanguage, sourceLanguage);
      }

      // If no translation APIs available, return original text
      console.warn('No translation API keys configured');
      return text;

    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Return original text on error
    }
  }

  private async googleTranslate(text: string, targetLanguage: string, sourceLanguage: string): Promise<string> {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${this.googleTranslateApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        source: sourceLanguage,
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  }

  private async azureTranslate(text: string, targetLanguage: string, sourceLanguage: string): Promise<string> {
    const response = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${sourceLanguage}&to=${targetLanguage}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.azureTranslatorKey!,
        'Ocp-Apim-Subscription-Region': this.azureTranslatorRegion!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ text }])
    });

    if (!response.ok) {
      throw new Error(`Azure Translator API error: ${response.status}`);
    }

    const data = await response.json();
    return data[0].translations[0].text;
  }
}
