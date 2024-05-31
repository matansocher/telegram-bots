const fs = require('fs');
const { OpenAI } = require('openai');
const { OPENAI_API_KEY, SOUND_MODEL, TEXT_TO_SPEECH_MODEL, TEXT_TO_SPEECH_VOICE } = require('./openai.config');

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

async function getTranscriptFromAudio(audioFilePath, language) {
    const file = fs.createReadStream(audioFilePath);
    return openai.audio.transcriptions.create({
        file,
        language,
        model: SOUND_MODEL,
    });
}

async function getTranslationFromAudio(audioFilePath) {
    const file = fs.createReadStream(audioFilePath);
    return openai.audio.translations.create({
        file,
        model: SOUND_MODEL,
    });
}

async function getAudioFromText(text) {
    return openai.audio.speech.create({
        model: TEXT_TO_SPEECH_MODEL,
        voice: TEXT_TO_SPEECH_VOICE,
        input: text,
    });
}

module.exports = {
    getTranscriptFromAudio,
    getTranslationFromAudio,
    getAudioFromText,
};
