const { translate } = require('@vitalets/google-translate-api');

async function getTranslationToEnglish(text) {
    const result = await translate(text, { to: 'en' });
    return result.text;
}

module.exports = {
    getTranslationToEnglish,
};
