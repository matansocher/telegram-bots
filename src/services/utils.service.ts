import fsModule from 'fs';
const fs = fsModule.promises;
import LoggerService from './logger.service';
const logger = new LoggerService(module.filename);

let ffmpeg;
import { exec } from 'child_process';

exec('which ffmpeg', (error, stdout) => {
    if (error) {
        logger.error('which ffmpeg exec', `Error finding ffmpeg: ${getErrorMessage(error)}`);
        return;
    }
    logger.info('which ffmpeg exec', `FFmpeg path: ${stdout.trim()}`);
    import ffmpeg from 'fluent-ffmpeg';
    ffmpeg.setFfmpegPath(stdout.trim());
});

export async function deleteFile(audioFileLocalPath) {
    try {
        await fs.unlink(audioFileLocalPath);
        logger.info(deleteFile.name, `Deleted file at ${audioFileLocalPath}`);
    } catch (err) {
        logger.error(deleteFile.name, `Error deleting file at ${audioFileLocalPath}: ${getErrorMessage(err)}`);
    }
}

export async function extractAudioFromVideo(videoFilePath) {
    const audioFilePath = videoFilePath.replace(/\.[^/.]+$/, '') + '.mp3';

    return new Promise((resolve, reject) => {
        ffmpeg(videoFilePath)
            .output(audioFilePath)
            .on('end', () => resolve(audioFilePath))
            .on('error', reject)
            .run();
    });
}

export async function saveVideoBytesArray(videoBytesArray, videoFilePath) {
    try {
        const buffer = Buffer.from(videoBytesArray);
        await fs.writeFile(videoFilePath, buffer);
        return videoFilePath;
    } catch (err) {
        logger.error(saveVideoBytesArray.name, `Error saving file at ${videoFilePath}: ${getErrorMessage(err)}`);
    }
}

export function getErrorMessage(error) {
    return error instanceof Error ? error.message : JSON.stringify(error);
}

export function getQueryParams(urlString) {
    const parsedUrl = new URL(urlString);
    const queryParams = {};

    for (const [key, value] of parsedUrl.searchParams.entries()) {
        queryParams[key] = value;
    }

    return queryParams;
}

export function objectToQueryParams(obj) {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
        .join('&');
}

export function queryParamsToObject(queryString) {
    return queryString
        .split('&')
        .map(param => param.split('='))
        .reduce((acc, [key, value]) => {
            acc[decodeURIComponent(key)] = decodeURIComponent(value);
            return acc;
        }, {});
}
