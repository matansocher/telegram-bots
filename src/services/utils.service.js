const fs = require('fs').promises;
const utilsService = require('./utils.service');
const logger = new (require('../services/logger.service.js'))(module.filename);

let ffmpeg;
const { exec } = require('child_process');

exec('which ffmpeg', (error, stdout) => {
    if (error) {
        logger.error('which ffmpeg exec', `Error finding ffmpeg: ${getErrorMessage(error)}`);
        return;
    }
    logger.info('which ffmpeg exec', `FFmpeg path: ${stdout.trim()}`);
    ffmpeg = require('fluent-ffmpeg');
    ffmpeg.setFfmpegPath(stdout.trim());
});

async function deleteFile(audioFileLocalPath) {
    try {
        await fs.unlink(audioFileLocalPath);
        logger.info(deleteFile.name, `Deleted file at ${audioFileLocalPath}`);
    } catch (err) {
        logger.error(deleteFile.name, `Error deleting file at ${audioFileLocalPath}: ${utilsService.getErrorMessage(err)}`);
    }
}

async function extractAudioFromVideo(videoFilePath) {
    const audioFilePath = videoFilePath.replace(/\.[^/.]+$/, '') + '.mp3';

    return new Promise((resolve, reject) => {
        ffmpeg(videoFilePath)
            .output(audioFilePath)
            .on('end', () => resolve(audioFilePath))
            .on('error', reject)
            .run();
    });
}

function getErrorMessage(error) {
    return error instanceof Error ? error.message : JSON.stringify(error);
}

function getQueryParams(urlString) {
    const parsedUrl = new URL(urlString);
    const queryParams = {};

    for (const [key, value] of parsedUrl.searchParams.entries()) {
        queryParams[key] = value;
    }

    return queryParams;
}

function objectToQueryParams(obj) {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
        .join('&');
}

function queryParamsToObject(queryString) {
    return queryString
        .split('&')
        .map(param => param.split('='))
        .reduce((acc, [key, value]) => {
            acc[decodeURIComponent(key)] = decodeURIComponent(value);
            return acc;
        }, {});
}

module.exports = {
    getErrorMessage,
    deleteFile,
    extractAudioFromVideo,
    getQueryParams,
    objectToQueryParams,
    queryParamsToObject,
};
