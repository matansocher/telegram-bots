const openaiService = require('../openai/openai.service');
const googleTranslateService = require('../google-translate/google-translate.service');
const utilsService = require('../utils.service');
const logger = new (require('../logger.service.js'))(module.filename);

async function processAudioFile(audioFileLocalPath) {
    try {
        logger.info(processAudioFile.name, `start`);
        const result = await openaiService.getTranslationFromAudio(audioFileLocalPath);
        logger.info(processAudioFile.name, `end`);
        return result.text;
    } catch (err) {
        logger.error(processAudioFile.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

async function processText(text) {
    try {
        logger.info(processText.name, `start`);
        const result = await googleTranslateService.getTranslationToEnglish(text);
        logger.info(processText.name, `end`);
        return result.text;
    } catch (err) {
        logger.error(processText.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

module.exports = {
    processAudioFile,
    processText,
};
