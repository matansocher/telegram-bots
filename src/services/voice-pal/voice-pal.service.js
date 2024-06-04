const fs = require('fs');
const {
    ANALYTIC_EVENT_NAMES,
    LOCAL_FILES_PATH,
    SUMMARY_PROMPTS,
    NOT_FOUND_VIDEO_MESSAGES,
    VOICE_PAL_OPTIONS,
} = require('./voice-pal.config');
const openaiService = require('../openai/openai.service');
const userSelectionService = require('./user-selections.service');
const transcriptorService = require('./transcriptor.service');
const translatorService = require('./translator.service');
const textToSpeechService = require('./text-to-speech.service');
const youtubeTranscriptorService = require('./youtube-transcriptor.service');
const tiktokDownloaderService = require('./tiktok-downloader.service');
const mongoConfig = require('../mongo/mongo.config');
const mongoService = require('../mongo/mongo.service');
const generalBotService = require('../../telegram-bots/general-bot.service');
const utilsService = require('../utils.service');

function getKeyboardOptions() {
    return {
        reply_markup: {
            keyboard: Object.keys(VOICE_PAL_OPTIONS).map(option => {
                return [{ text: VOICE_PAL_OPTIONS[option].displayName }];
            }),
            resize_keyboard: true,
        },
    }
}

async function handleActionSelection(bot, chatId, selection) {
    userSelectionService.setCurrentUserAction(chatId, selection);
    const relevantAction = Object.keys(VOICE_PAL_OPTIONS).find(option => VOICE_PAL_OPTIONS[option].displayName === selection);
    await generalBotService.sendMessage(bot, chatId, VOICE_PAL_OPTIONS[relevantAction].selectedActionResponse, getKeyboardOptions());
}

async function handleAction(bot, message) {
    const { chatId, text, audio, video  } = generalBotService.getMessageData(message);
    await generalBotService.setBotTyping(bot, chatId);

    const userAction = userSelectionService.getCurrentUserAction(chatId);
    if (!userAction) {
        return generalBotService.sendMessage(bot, chatId, `Please select an action first.`);
    }

    const relevantActionKey = Object.keys(VOICE_PAL_OPTIONS).find(option => VOICE_PAL_OPTIONS[option].displayName === userAction);
    const relevantAction = VOICE_PAL_OPTIONS[relevantActionKey];
    await handlers[relevantAction.handler](bot, chatId, { text, audio, video });

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

    const resText = await transcriptorService.processAudioFile(audioFileLocalPath);
    await generalBotService.sendMessage(bot, chatId, resText, getKeyboardOptions());
    await utilsService.deleteFile(audioFileLocalPath);
}

async function handleTranslateAction(bot, chatId, { text, video, audio }) {
    let resText = '';
    let audioFileLocalPath = '';

    if (text) {
        resText = await translatorService.processText(text);
    } else if (video && video.file_id) {
        const videoFileLocalPath = await bot.downloadFile(video.file_id, LOCAL_FILES_PATH);
        audioFileLocalPath = await utilsService.extractAudioFromVideo(videoFileLocalPath);
        utilsService.deleteFile(videoFileLocalPath);
    } else {
        audioFileLocalPath = await bot.downloadFile(audio.file_id, LOCAL_FILES_PATH);
    }

    if (audioFileLocalPath) {
        resText = await translatorService.processAudioFile(audioFileLocalPath);
        utilsService.deleteFile(audioFileLocalPath);
    }

    await generalBotService.sendMessage(bot, chatId, resText, getKeyboardOptions());
}

async function handleTextToSpeechAction(bot, chatId, { text }) {
    const audioFilePath = await textToSpeechService.processText(text);
    await generalBotService.sendVoice(bot, chatId, audioFilePath, getKeyboardOptions());
    await utilsService.deleteFile(audioFilePath);
}

async function handleSummarizeYoutubeVideoAction(bot, chatId, { text }) {
    const videoId = utilsService.getQueryParams(text).v;
    if (!videoId) {
        await generalBotService.sendMessage(bot, chatId, NOT_FOUND_VIDEO_MESSAGES.YOUTUBE, getKeyboardOptions());
    }
    const transcription = await youtubeTranscriptorService.getYoutubeVideoTranscription(videoId);
    const summaryTranscription = await openaiService.getChatCompletion(SUMMARY_PROMPTS.YOUTUBE, transcription);
    await generalBotService.sendMessage(bot, chatId, summaryTranscription, getKeyboardOptions());
}

async function handleSummarizeTiktokVideoAction(bot, chatId, { text }) {
    const audio = await tiktokDownloaderService.getTiktokAudio(text);
    if (!audio) {
        await generalBotService.sendMessage(bot, chatId, NOT_FOUND_VIDEO_MESSAGES.TIKTOK, getKeyboardOptions());
    }

    const audioFilePath = `${LOCAL_FILES_PATH}/${new Date().getTime()}.mp3`;
    fs.writeFileSync(audioFilePath, audio)
    const transcription = await transcriptorService.processAudioFile(audioFilePath);

    const summaryTranscription = await openaiService.getChatCompletion(SUMMARY_PROMPTS.TIKTOK, transcription);
    await generalBotService.sendMessage(bot, chatId, summaryTranscription, getKeyboardOptions());
    await utilsService.deleteFile(audioFilePath);
}

const handlers = {
    handleTranscribeAction,
    handleTranslateAction,
    handleTextToSpeechAction,
    handleSummarizeYoutubeVideoAction,
    handleSummarizeTiktokVideoAction,
};

module.exports = {
    getKeyboardOptions,
    handleActionSelection,
    handleAction,
};
