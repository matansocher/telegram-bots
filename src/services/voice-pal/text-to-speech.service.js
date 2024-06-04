const fs = require('fs').promises;
const { LOCAL_FILES_PATH } = require('./voice-pal.config');
const openaiService = require('../openai/openai.service');
const utilsService = require('../utils.service');
const logger = new (require('../logger.service.js'))(module.filename);

async function processText(text) {
    try {
        logger.info(processText.name, `start`);

        const result = await openaiService.getAudioFromText(text);

        const fileToSavePath = `${LOCAL_FILES_PATH}/text-to-speech-${new Date().getTime()}.mp3`;
        const buffer = Buffer.from(await result.arrayBuffer());
        await fs.writeFile(fileToSavePath, buffer);

        logger.info(processText.name, `end`);
        return fileToSavePath;
    } catch (err) {
        logger.error(processText.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

module.exports = {
    processText,
};
