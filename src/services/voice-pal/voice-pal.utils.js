const fs = require('fs');
const { LOCAL_FILES_PATH, VOICE_PAL_OPTIONS} = require('./voice-pal.config');
const openaiService = require('../openai/openai.service');
const utilsService = require('../utils.service');
const googleTranslateService = require('../google-translate.service');
const logger = new (require('../../services/logger.service'))(module.filename);

function getKeyboardOptions() {
    return {
        reply_markup: {
            keyboard: Object.keys(VOICE_PAL_OPTIONS).map(option => {
                return [{ text: VOICE_PAL_OPTIONS[option].displayName }];
            }),
            resize_keyboard: true,
        },
    }
}

async function translateAudioFile(audioFileLocalPath) {
    try {
        logger.info(translateAudioFile.name, `start`);
        const result = await openaiService.getTranslationFromAudio(audioFileLocalPath);
        logger.info(translateAudioFile.name, `end`);
        return result.text;
    } catch (err) {
        logger.error(translateAudioFile.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

async function translateText(text) {
    try {
        logger.info(translateText.name, `start`);
        const result = await googleTranslateService.getTranslationToEnglish(text);
        logger.info(translateText.name, `end`);
        return result.text;
    } catch (err) {
        logger.error(translateText.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

async function transcribeAudioFile(audioFileLocalPath) {
    try {
        logger.info(transcribeAudioFile.name, `start`);
        const result = await openaiService.getTranscriptFromAudio(audioFileLocalPath);
        logger.info(transcribeAudioFile.name, `end`);
        return `${result.text}`
    } catch (err) {
        logger.error(transcribeAudioFile.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

async function textToSpeech(text) {
    try {
        logger.info(textToSpeech.name, `start`);

        const result = await openaiService.getAudioFromText(text);

        const fileToSavePath = `${LOCAL_FILES_PATH}/text-to-speech-${new Date().getTime()}.mp3`;
        const buffer = Buffer.from(await result.arrayBuffer());
        await fs.writeFile(fileToSavePath, buffer);

        logger.info(textToSpeech.name, `end`);
        return fileToSavePath;
    } catch (err) {
        logger.error(textToSpeech.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

module.exports = {
    getKeyboardOptions,

    translateAudioFile,
    translateText,

    transcribeAudioFile,

    textToSpeech,
};
