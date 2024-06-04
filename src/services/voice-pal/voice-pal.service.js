const { ANALYTIC_EVENT_NAMES, LOCAL_FILES_PATH, YOUTUBE_SUMMARY_PROMPT, NOT_FOUND_YOUTUBE_VIDEO_MESSAGE, VOICE_PAL_OPTIONS, SELECTED_ACTIONS_RESPONSES } = require('./voice-pal.config');
const openaiService = require('../openai/openai.service');
const userSelectionService = require('./user-selections.service');
const transcriptorService = require('./transcriptor.service');
const translatorService = require('./translator.service');
const textToSpeechService = require('./text-to-speech.service');
const youtubeTranscriptorService = require('./youtube-transcriptor.service');
const mongoConfig = require('../mongo/mongo.config');
const mongoService = require('../mongo/mongo.service');
const generalBotService = require('../../telegram-bots/general-bot.service');
const utilsService = require('../utils.service');

function getKeyboardOptions() {
    return {
        reply_markup: {
            keyboard: Object.keys(VOICE_PAL_OPTIONS).map(option => {
                return [{ text: VOICE_PAL_OPTIONS[option] }];
            }),
            resize_keyboard: true,
        },
    }
}

async function handleActionSelection(bot, chatId, selection) {
    userSelectionService.setCurrentUserAction(chatId, selection);
    await generalBotService.sendMessage(bot, chatId, SELECTED_ACTIONS_RESPONSES[selection], getKeyboardOptions());
}

async function handleAction(bot, message) {
    const { chatId, text, audio, video  } = generalBotService.getMessageData(message);
    await generalBotService.setBotTyping(bot, chatId);

    const userAction = userSelectionService.getCurrentUserAction(chatId);
    if (!userAction) {
        return generalBotService.sendMessage(bot, chatId, `Please select an action first.`);
    }

    switch (userAction) {
        case VOICE_PAL_OPTIONS.TRANSCRIBE:
            await handleTranscribeAction(bot, chatId, video, audio);
            mongoService.sendAnalyticLog(mongoConfig.VOICE_PAL.NAME, ANALYTIC_EVENT_NAMES.TRANSCRIBE, { chatId })
            break;
        case VOICE_PAL_OPTIONS.TRANSLATE:
            await handleTranslateAction(bot, chatId, text, video, audio);
            mongoService.sendAnalyticLog(mongoConfig.VOICE_PAL.NAME, ANALYTIC_EVENT_NAMES.TRANSLATE, { chatId })
            break;
        case VOICE_PAL_OPTIONS.TEXT_TO_SPEECH:
            await handleTextToSpeechAction(bot, chatId, text);
            mongoService.sendAnalyticLog(mongoConfig.VOICE_PAL.NAME, ANALYTIC_EVENT_NAMES.TEXT_TO_SPEECH, { chatId })
            break;
        case VOICE_PAL_OPTIONS.SUMMARY_YOUTUBE_VIDEO:
            await handleSummarizeYoutubeVideoAction(bot, chatId, text);
            mongoService.sendAnalyticLog(mongoConfig.VOICE_PAL.NAME, ANALYTIC_EVENT_NAMES.SUMMARY_YOUTUBE_VIDEO, { chatId })
            break;
    }
    // userSelectionService.removeCurrentUserAction(chatId);
}

async function handleTranscribeAction(bot, chatId, video, audio) {
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

async function handleTranslateAction(bot, chatId, text, video, audio) {
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

async function handleTextToSpeechAction(bot, chatId, text) {
    const audioFilePath = await textToSpeechService.processText(text);
    await generalBotService.sendVoice(bot, chatId, audioFilePath, getKeyboardOptions());
    await utilsService.deleteFile(audioFilePath);
}

async function handleSummarizeYoutubeVideoAction(bot, chatId, url) {
    const videoId = utilsService.getQueryParams(url).v;
    if (!videoId) {
        await generalBotService.sendMessage(bot, chatId, NOT_FOUND_YOUTUBE_VIDEO_MESSAGE, getKeyboardOptions());
    }
    const transcription = await youtubeTranscriptorService.getYoutubeVideoTranscription(videoId);
    const summaryTranscription = await openaiService.getChatCompletion(YOUTUBE_SUMMARY_PROMPT, transcription);
    await generalBotService.sendMessage(bot, chatId, summaryTranscription, getKeyboardOptions());
}

module.exports = {
    getKeyboardOptions,
    handleActionSelection,
    handleAction,
};
