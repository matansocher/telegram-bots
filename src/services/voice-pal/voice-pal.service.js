const fs = require('fs');
const {
    ANALYTIC_EVENT_NAMES,
    LOCAL_FILES_PATH,
    SUMMARY_PROMPTS,
    NOT_FOUND_VIDEO_MESSAGES,
    VOICE_PAL_OPTIONS,
} = require('./voice-pal.config');
const voicePalUtils = require('./voice-pal.utils');
const imgurService = require('../imgur.service');
const openaiService = require('../openai/openai.service');
const tiktokDownloaderService = require('../tiktok-downloader.service');
const userSelectionService = require('../user-selections.service');
const youtubeTranscriptorService = require('../youtube-transcriptor.service');
const mongoConfig = require('../mongo/mongo.config');
const mongoService = require('../mongo/mongo.service');
const generalBotService = require('../../telegram-bots/general-bot.service');
const utilsService = require('../utils.service');

async function handleActionSelection(bot, chatId, selection) {
    userSelectionService.setCurrentUserAction(chatId, selection);
    const relevantAction = Object.keys(VOICE_PAL_OPTIONS).find(option => VOICE_PAL_OPTIONS[option].displayName === selection);
    await generalBotService.sendMessage(bot, chatId, VOICE_PAL_OPTIONS[relevantAction].selectedActionResponse, voicePalUtils.getKeyboardOptions());
}

async function handleAction(bot, message, userAction) {
    const { chatId, text, audio, video, photo  } = generalBotService.getMessageData(message);

    if (!userAction) {
        return generalBotService.sendMessage(bot, chatId, `Please select an action first.`);
    }

    await handlers[userAction.handler](bot, chatId, { text, audio, video, photo });

    mongoService.sendAnalyticLog(mongoConfig.VOICE_PAL.NAME, ANALYTIC_EVENT_NAMES[userAction], { chatId });
    // userSelectionService.removeCurrentUserAction(chatId);
}

async function handleTranscribeAction(bot, chatId, { video, audio }) {
    let audioFileLocalPath;
    if (video && video.file_id) {
        const videoFileLocalPath = await bot.downloadFile(video.file_id, LOCAL_FILES_PATH);
        audioFileLocalPath = await utilsService.extractAudioFromVideo(videoFileLocalPath);
        utilsService.deleteFile(videoFileLocalPath);
    } else {
        audioFileLocalPath = await bot.downloadFile(audio.file_id, LOCAL_FILES_PATH);
    }

    const resText = await voicePalUtils.transcribeAudioFile(audioFileLocalPath);
    await generalBotService.sendMessage(bot, chatId, resText, voicePalUtils.getKeyboardOptions());
    await utilsService.deleteFile(audioFileLocalPath);
}

async function handleTranslateAction(bot, chatId, { text, video, audio }) {
    let resText = '';
    let audioFileLocalPath = '';

    if (text) {
        resText = await voicePalUtils.translateText(text)
    } else if (video && video.file_id) {
        const videoFileLocalPath = await bot.downloadFile(video.file_id, LOCAL_FILES_PATH);
        audioFileLocalPath = await utilsService.extractAudioFromVideo(videoFileLocalPath);
        utilsService.deleteFile(videoFileLocalPath);
    } else {
        audioFileLocalPath = await bot.downloadFile(audio.file_id, LOCAL_FILES_PATH);
    }

    if (audioFileLocalPath) {
        resText = await voicePalUtils.translateAudioFile(audioFileLocalPath)
        utilsService.deleteFile(audioFileLocalPath);
    }

    await generalBotService.sendMessage(bot, chatId, resText, voicePalUtils.getKeyboardOptions());
}

async function handleTextToSpeechAction(bot, chatId, { text }) {
    const audioFilePath = await voicePalUtils.textToSpeech(text);
    await generalBotService.sendVoice(bot, chatId, audioFilePath, voicePalUtils.getKeyboardOptions());
    await utilsService.deleteFile(audioFilePath);
}

async function handleSummarizeTextAction(bot, chatId, { text }) {
    const textSummary = await openaiService.getChatCompletion(SUMMARY_PROMPTS.TEXT, text);
    await generalBotService.sendMessage(bot, chatId, textSummary, voicePalUtils.getKeyboardOptions());
}

async function handleSummarizeYoutubeVideoAction(bot, chatId, { text }) {
    const videoId = utilsService.getQueryParams(text).v;
    if (!videoId) {
        await generalBotService.sendMessage(bot, chatId, NOT_FOUND_VIDEO_MESSAGES.YOUTUBE, voicePalUtils.getKeyboardOptions());
    }
    const transcription = await youtubeTranscriptorService.getYoutubeVideoTranscription(videoId);
    const summaryTranscription = await openaiService.getChatCompletion(SUMMARY_PROMPTS.YOUTUBE, transcription);
    await generalBotService.sendMessage(bot, chatId, summaryTranscription, voicePalUtils.getKeyboardOptions());
}

async function handleSummarizeTiktokVideoAction(bot, chatId, { text }) {
    const tiktokVideoUrl = text.split('?')[0];
    const audio = await tiktokDownloaderService.getTiktokAudio(tiktokVideoUrl);
    if (!audio) {
        await generalBotService.sendMessage(bot, chatId, NOT_FOUND_VIDEO_MESSAGES.TIKTOK, voicePalUtils.getKeyboardOptions());
    }

    const audioFilePath = `${LOCAL_FILES_PATH}/tiktok-summary-${new Date().getTime()}.mp3`;
    fs.writeFileSync(audioFilePath, audio)
    const transcription = await voicePalUtils.transcribeAudioFile(audioFilePath);

    const summaryTranscription = await openaiService.getChatCompletion(SUMMARY_PROMPTS.TIKTOK, transcription);
    await generalBotService.sendMessage(bot, chatId, summaryTranscription, voicePalUtils.getKeyboardOptions());
    await utilsService.deleteFile(audioFilePath);
}

async function handleImageGenerationAction(bot, chatId, { text }) {
    const imageUrl = await openaiService.createImage(text);
    await generalBotService.sendPhoto(bot, chatId, imageUrl, voicePalUtils.getKeyboardOptions());
}

async function handleImageAnalyzerAction(bot, chatId, { photo }) {
    const imageLocalPath = await bot.downloadFile(photo[photo.length - 1].file_id, LOCAL_FILES_PATH);
    const imageUrl = await imgurService.uploadImage(imageLocalPath);
    const imageAnalysisText = await openaiService.analyzeImage(imageUrl);
    await generalBotService.sendMessage(bot, chatId, imageAnalysisText, voicePalUtils.getKeyboardOptions());
    utilsService.deleteFile(imageLocalPath);
}

const handlers = {
    handleTranscribeAction,
    handleTranslateAction,
    handleTextToSpeechAction,
    handleSummarizeTextAction,
    handleSummarizeYoutubeVideoAction,
    handleSummarizeTiktokVideoAction,
    handleImageGenerationAction,
    handleImageAnalyzerAction,
};

module.exports = {
    handleActionSelection,
    handleAction,
};
