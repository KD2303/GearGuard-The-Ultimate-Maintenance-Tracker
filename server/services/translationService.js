/**
 * Mock Translation Service
 * In a real production environment, this would integrate with Google Cloud Translation API,
 * AWS Translate, or OpenAI Whisper.
 */
class TranslationService {
  static async translateToEnglish(text, sourceLanguage) {
    if (!text) return text;
    if (!sourceLanguage || sourceLanguage === 'en-US' || sourceLanguage === 'en') {
      return text;
    }

    // Mock translation processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const langNames = {
      'es-ES': 'Spanish',
      'fr-FR': 'French',
      'de-DE': 'German',
      'zh-CN': 'Chinese',
      'hi-IN': 'Hindi',
      'ar-SA': 'Arabic'
    };

    const langName = langNames[sourceLanguage] || sourceLanguage;

    // We simulate the translation by appending a tag.
    // In a real app: return await googleTranslateApi(text, { to: 'en' });
    return `${text}\n\n*[Translated from ${langName} to English by GearGuard AI]*`;
  }
}

module.exports = TranslationService;
