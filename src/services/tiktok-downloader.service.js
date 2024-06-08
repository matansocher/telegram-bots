const axios = require('axios');
const Tiktok = require('tiktokapi-src');
const utilsService = require('../utils.service');
const logger = new (require('../logger.service.js'))(module.filename);

async function getTiktokAudio(videoUrl) {
    try {
        logger.info(getTiktokAudio.name, `start`);
        const tiktokRes = await Tiktok.Downloader(videoUrl, { version: 'v2' });
        const audioUrl = tiktokRes.result.music;
        const audio = await axios.get(audioUrl, { responseType: 'arraybuffer' });
        logger.info(getTiktokAudio.name, `end`);
        return audio.data;
    } catch (err) {
        logger.error(getTiktokAudio.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

module.exports = {
    getTiktokAudio,
};
