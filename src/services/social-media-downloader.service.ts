import axios from 'axios';
import { ndown, tikdown } from 'nayan-media-downloader';
import * as utilsService from './utils.service';
import LoggerService from './logger.service';
const logger = new LoggerService(module.filename);

export async function getInstagramVideo(videoUrl) {
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

export async function getTiktokAudio(videoUrl) {
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
