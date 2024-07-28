const fs = require('fs');
const { chunk: _chunk } = require('lodash');
const { OpenAI } = require('openai');
const {
    OPENAI_API_KEY,
    CHAT_COMPLETIONS_MODEL,
    SOUND_MODEL,
    IMAGE_GENERATION_MODEL,
    TEXT_TO_SPEECH_MODEL,
    TEXT_TO_SPEECH_VOICE,
} = require('./openai.config');

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

async function getTranscriptFromAudio(audioFilePath, language) {
    const file = fs.createReadStream(audioFilePath);
    return openai.audio.transcriptions.create({
        file,
        model: SOUND_MODEL,
        ...(!!language && { language }),
    });
}

async function getTranslationFromAudio(audioFilePath) {
    const file = fs.createReadStream(audioFilePath);
    const result = await openai.audio.translations.create({
        file,
        model: SOUND_MODEL,
    });
    return result.text;
}

async function getAudioFromText(text) {
    return openai.audio.speech.create({
        model: TEXT_TO_SPEECH_MODEL,
        voice: TEXT_TO_SPEECH_VOICE,
        input: text,
    });
}

async function getChatCompletion(prompt, userText) {
    let userMessages;
    if (typeof userText === 'string') {
        userMessages = [userText];
    } else { // array
        userMessages = _chunk(userText, 100);
    }
    const result = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: prompt,
            },
            ...userMessages.map((message) => ({
                role: 'user',
                content: typeof message === 'string' ? message : JSON.stringify(message),
            })),
        ],
        model: CHAT_COMPLETIONS_MODEL,
    });
    return result.choices[0].message.content;
}

async function createImage(prompt) {
    const response = await openai.images.generate({
        model: IMAGE_GENERATION_MODEL,
        prompt,
        n: 1,
        size: '1024x1024',
    });
    return response.data[0].url;
}

async function analyzeImage(imageUrl) {
    const response = await openai.chat.completions.create({
        model: CHAT_COMPLETIONS_MODEL,
        messages: [
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'What’s in this image? What text do you see in the image?' },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl,
                        },
                    },
                ],
            },
        ],
    });
    return response.choices[0].message.content;
}

module.exports = {
    getTranscriptFromAudio,
    getTranslationFromAudio,
    getAudioFromText,
    getChatCompletion,
    createImage,
    analyzeImage,
};
