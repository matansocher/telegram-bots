const axios = require('axios');
const { ndown, tikdown } = require("nayan-media-downloader")
const utilsService = require('./utils.service');
const logger = new (require('./logger.service.js'))(module.filename);

async function getInstagramVideo(videoUrl) {
    try {
        logger.info(getInstagramVideo.name, `start`);
        let { data } = await ndown(videoUrl);
        const videoDownloadLink = data[0].url;
        const video = await axios.get(videoDownloadLink, { responseType: 'arraybuffer' });
        return video.data;
    } catch (err) {
        logger.error(getInstagramVideo.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

async function getTiktokAudio(videoUrl) {
    try {
        logger.info(getTiktokAudio.name, `start`);
        let { data } = await tikdown(videoUrl);
        const videoDownloadLink = data.audio;
        const audio = await axios.get(videoDownloadLink, { responseType: 'arraybuffer' });
        return audio.data;
    } catch (err) {
        logger.error(getTiktokAudio.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

module.exports = {
    getInstagramVideo,
    getTiktokAudio,
};
