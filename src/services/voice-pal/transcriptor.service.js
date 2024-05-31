const openaiService = require('../openai/openai.service');
const utilsService = require('../utils.service');
const logger = new (require('../logger.service.js'))(module.filename);

async function processAudioFile(chatId, audioFileLocalPath) {
    try {
        logger.info(processAudioFile.name, `start`);
        const result = await openaiService.getTranscriptFromAudio(audioFileLocalPath);
        logger.info(processAudioFile.name, `end`);
        return `${result.text}`
    } catch (err) {
        logger.error(processAudioFile.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

module.exports = {
    processAudioFile,
};
