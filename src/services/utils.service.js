const fs = require('fs').promises;
const utilsService = require('./utils.service');
const logger = new (require('../services/logger.service.js'))(module.filename);

let ffmpeg;
const { exec } = require('child_process');

exec('which ffmpeg', (error, stdout) => {
    if (error) {
        logger.error('which ffmpeg exec', `Error finding ffmpeg: ${utilsService.getErrorMessage(error)}`);
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

module.exports = {
    getErrorMessage,
    deleteFile,
    extractAudioFromVideo,
};
