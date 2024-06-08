const { YoutubeTranscript } = require('youtube-transcript');
const utilsService = require('../utils.service');
const logger = new (require('../logger.service.js'))(module.filename);

async function getYoutubeVideoTranscription(videoId) {
    try {
        logger.info(getYoutubeVideoTranscription.name, `start`);
        const result = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        const parsedResult = parseTranscriptResult(result);
        logger.info(getYoutubeVideoTranscription.name, `end`);
        return parsedResult;
    } catch (err) {
        logger.error(getYoutubeVideoTranscription.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

function parseTranscriptResult(result) {
    return result.map((item) => {
        const { text, duration, offset } = item;
        const start = getTimestampInMinutesFromSeconds(offset);
        const end = getTimestampInMinutesFromSeconds(offset + duration);
        return { text, start, end };
    });
}

function getTimestampInMinutesFromSeconds(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60 * 100) / 100;
    return `${minutes}:${remainingSeconds}`;
}

module.exports = {
    getYoutubeVideoTranscription,
};
