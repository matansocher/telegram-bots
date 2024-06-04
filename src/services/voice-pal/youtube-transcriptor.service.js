const { YoutubeTranscript } = require('youtube-transcript');
const utilsService = require('../utils.service');
const logger = new (require('../logger.service.js'))(module.filename);

async function getYoutubeVideoTranscription(videoId) {
    try {
        logger.info(getYoutubeVideoTranscription.name, `start`);
        const result = await YoutubeTranscript.fetchTranscript(videoId);
        const parsedResult = parseTranscriptResult(result);
        logger.info(getYoutubeVideoTranscription.name, `start`);
        return parsedResult;
    } catch (err) {
        logger.error(getYoutubeVideoTranscription.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}

function parseTranscriptResult(result) {
    return result.map((item) => item.text).join('\n');
}

module.exports = {
    getYoutubeVideoTranscription,
};
