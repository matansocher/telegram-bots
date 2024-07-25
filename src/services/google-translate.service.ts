import { translate } from '@vitalets/google-translate-api';

export async function getTranslationToEnglish(text) {
    const result = await translate(text, { to: 'en' });
    return result.text;
}
