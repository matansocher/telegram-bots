import { YoutubeTranscript } from 'youtube-transcript';
import * as utilsService from './utils.service';
import LoggerService from './logger.service';
const logger = new LoggerService(module.filename);

const supportedLanguages = ['en', 'iw'];

export async function getYoutubeVideoTranscription(videoId) {
    logger.info(getYoutubeVideoTranscription.name, `start`);
    const resultArr = await Promise.allSettled(supportedLanguages.map((lang) => YoutubeTranscript.fetchTranscript(videoId, { lang })));
    const bestResult = resultArr.find((result) => result.status === 'fulfilled');
    if (!bestResult) {
        return {
            transcription: null, errorMessage: `I am sorry but I did not find the transcription for this video. I support only english and hebrew videos for now.`,
        }
    }
    const transcription = parseTranscriptResult(bestResult.value);
    logger.info(getYoutubeVideoTranscription.name, `end`);
    return { transcription, errorMessage: null };
}

export function getYoutubeVideoIdFromUrl(url) {
    // shorts
    if (url.includes('shorts')) {
        const cleanedUrl = url.split('?')[0];
        const parts = cleanedUrl.split('/');
        return parts[parts.length - 1];
    }
    // web
    return utilsService.getQueryParams(url).v;
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
