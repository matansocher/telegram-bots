const { translate } = require('@vitalets/google-translate-api');

async function getTranslationToEnglish(text) {
    return translate(text, { to: 'en' });
}

module.exports = {
    getTranslationToEnglish,
};
