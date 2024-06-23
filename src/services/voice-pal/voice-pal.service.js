const fs = require('fs').promises;
const {
    ANALYTIC_EVENT_NAMES,
    ANALYTIC_EVENT_STATES,
    LOCAL_FILES_PATH,
    NOT_FOUND_VIDEO_MESSAGES,
    SUMMARY_PROMPT,
    VOICE_PAL_OPTIONS,
} = require('./voice-pal.config');
const voicePalUtils = require('./voice-pal.utils');
const imgurService = require('../imgur.service');
const googleTranslateService = require('../google-translate.service');
const openaiService = require('../openai/openai.service');
const socialMediaDownloaderService = require('../social-media-downloader.service');
const userSelectionService = require('./user-selections.service');
const youtubeTranscriptService = require('../youtube-transcript.service');
const mongoService = require('../mongo/voice-pal/mongo.service');
const generalBotService = require('../../telegram-bots/general-bot.service');
const utilsService = require('../utils.service');
const messageLoaderService = require('../../telegram-bots/message-loader.service');
const logger = new (require('../logger.service'))(module.filename);

class VoicePalService {
    constructor(bot, chatId) {
        this.bot = bot;
        this.chatId = chatId;
    }

    async handleActionSelection(selection, { telegramUserId, chatId, firstName, lastName, username }) {
        const relevantAction = Object.keys(VOICE_PAL_OPTIONS).find(option => VOICE_PAL_OPTIONS[option].displayName === selection);

        let replyText = VOICE_PAL_OPTIONS[relevantAction].selectedActionResponse;
        if (selection === VOICE_PAL_OPTIONS.START.displayName) {
            mongoService.saveUserDetails({ telegramUserId, chatId, firstName, lastName, username });
            replyText = replyText.replace('{name}', firstName || username || '');
        } else {
            userSelectionService.setCurrentUserAction(this.chatId, selection);
        }

        const analyticAction = ANALYTIC_EVENT_NAMES[selection];
        mongoService.sendAnalyticLog(`${analyticAction} - ${ANALYTIC_EVENT_STATES.SET_ACTION}`, { chatId: this.chatId });

        await generalBotService.sendMessage(this.bot, this.chatId, replyText, voicePalUtils.getKeyboardOptions());
    }

    async handleAction(message, userAction) {
        const { text, audio, video, photo  } = generalBotService.getMessageData(message);

        if (!userAction) {
            return generalBotService.sendMessage(this.bot, this.chatId, `Please select an action first.`);
        }

        const inputErrorMessage = voicePalUtils.validateActionWithMessage(userAction, { text, audio, video, photo });
        if (inputErrorMessage) {
            return generalBotService.sendMessage(this.bot, this.chatId, inputErrorMessage, voicePalUtils.getKeyboardOptions());
        }

        const analyticAction = ANALYTIC_EVENT_NAMES[userAction];
        try {
            if (userAction && userAction.showLoader) { // showLoader
                await messageLoaderService.withMessageLoader(this.bot, this.chatId, { cycleDuration: 5000, loadingAction: userAction.loaderType }, async () => {
                    await this[userAction.handler]({ text, audio, video, photo });
                });
            } else {
                await this[userAction.handler]({ text, audio, video, photo });
            }

            mongoService.sendAnalyticLog(`${analyticAction} - ${ANALYTIC_EVENT_STATES.FULFILLED}`, { chatId: this.chatId });
            // userSelectionService.removeCurrentUserAction(this.chatId);
        } catch (err) {
            const errorMessage = utilsService.getErrorMessage(err);
            logger.error(this.handleAction.name, `error: ${errorMessage}`);
            mongoService.sendAnalyticLog(`${analyticAction} - ${ANALYTIC_EVENT_STATES.ERROR}`, { chatId: this.chatId, error: errorMessage });
            throw err;
        }
    }

    async handleTranscribeAction({ video, audio }) {
        try {
            const audioFileLocalPath = await generalBotService.downloadAudioFromVideoOrAudio(this.bot, { video, audio });
            const resText = await openaiService.getTranscriptFromAudio(audioFileLocalPath);
            await generalBotService.sendMessage(this.bot, this.chatId, resText.text, voicePalUtils.getKeyboardOptions());
            await utilsService.deleteFile(audioFileLocalPath);
        } catch (err) {
            logger.error(this.handleTranscribeAction.name, `error: ${utilsService.getErrorMessage(err)}`);
            throw err;
        }
    }

    async handleTranslateAction({ text, video, audio }) {
        try {
            let resText = '';
            let audioFileLocalPath = '';

            if (text) {
                resText = await googleTranslateService.getTranslationToEnglish(text);
            } else {
                audioFileLocalPath = await generalBotService.downloadAudioFromVideoOrAudio(this.bot, { video, audio });
                resText = await openaiService.getTranslationFromAudio(audioFileLocalPath);
                utilsService.deleteFile(audioFileLocalPath);
            }

            await generalBotService.sendMessage(this.bot, this.chatId, resText, voicePalUtils.getKeyboardOptions());
        } catch (err) {
            logger.error(this.handleTranslateAction.name, `error: ${utilsService.getErrorMessage(err)}`);
            throw err;
        }
    }

    async handleTextToSpeechAction({ text }) {
        try {
            const result = await openaiService.getAudioFromText(text);

            const audioFilePath = `${LOCAL_FILES_PATH}/text-to-speech-${new Date().getTime()}.mp3`;
            const buffer = Buffer.from(await result.arrayBuffer());
            await fs.writeFile(audioFilePath, buffer);

            await generalBotService.sendVoice(this.bot, this.chatId, audioFilePath, voicePalUtils.getKeyboardOptions());
            await utilsService.deleteFile(audioFilePath);
        } catch (err) {
            logger.error(this.handleTextToSpeechAction.name, `error: ${utilsService.getErrorMessage(err)}`);
            throw err;
        }
    }

    async handleSummarizeTextAction({ text }) {
        try {
            const textSummary = await openaiService.getChatCompletion(SUMMARY_PROMPT, text);
            await generalBotService.sendMessage(this.bot, this.chatId, textSummary, voicePalUtils.getKeyboardOptions());
        } catch (err) {
            logger.error(this.handleSummarizeTextAction.name, `error: ${utilsService.getErrorMessage(err)}`);
            throw err;
        }
    }

    async handleSummarizeYoutubeVideoAction({ text }) {
        try {
            const videoId = youtubeTranscriptService.getYoutubeVideoIdFromUrl(text);
            if (!videoId) {
                await generalBotService.sendMessage(this.bot, this.chatId, NOT_FOUND_VIDEO_MESSAGES.YOUTUBE, voicePalUtils.getKeyboardOptions());
            }
            const { transcription, errorMessage } = await youtubeTranscriptService.getYoutubeVideoTranscription(videoId);
            if (errorMessage) {
                await generalBotService.sendMessage(this.bot, this.chatId, errorMessage, voicePalUtils.getKeyboardOptions());
            }
            const summaryTranscription = await openaiService.getChatCompletion(SUMMARY_PROMPT, transcription);
            await generalBotService.sendMessage(this.bot, this.chatId, summaryTranscription, voicePalUtils.getKeyboardOptions());
        } catch (err) {
            logger.error(this.handleSummarizeYoutubeVideoAction.name, `error: ${utilsService.getErrorMessage(err)}`);
            throw err;
        }
    }

    async handleSummarizeTiktokVideoAction({ text }) {
        try {
            const audioBuffer = await socialMediaDownloaderService.getTiktokAudio(text);
            if (!audioBuffer) {
                await generalBotService.sendMessage(this.bot, this.chatId, NOT_FOUND_VIDEO_MESSAGES.TIKTOK, voicePalUtils.getKeyboardOptions());
            }
            const audioFilePath = `${LOCAL_FILES_PATH}/tiktok-audio-${new Date().getTime()}.mp3`;
            await fs.writeFile(audioFilePath, audioBuffer)

            const transcription = await openaiService.getTranscriptFromAudio(audioFilePath);

            const summaryTranscription = await openaiService.getChatCompletion(SUMMARY_PROMPT, transcription.text);
            await generalBotService.sendMessage(this.bot, this.chatId, summaryTranscription, voicePalUtils.getKeyboardOptions());
            await utilsService.deleteFile(audioFilePath);
        } catch (err) {
            logger.error(this.handleSummarizeTiktokVideoAction.name, `error: ${utilsService.getErrorMessage(err)}`);
            throw err;
        }
    }

    async handleSummarizeMetaVideoAction({ text }) {
        try {
            const videoBuffer = await socialMediaDownloaderService.getInstagramVideo(text);
            const videoFilePath = `${LOCAL_FILES_PATH}/meta-video-${new Date().getTime()}.mp4`;
            await utilsService.saveVideoBytesArray(videoBuffer, videoFilePath);
            const audioFilePath = await utilsService.extractAudioFromVideo(videoFilePath);
            const transcription = await openaiService.getTranscriptFromAudio(audioFilePath);

            const summaryTranscription = await openaiService.getChatCompletion(SUMMARY_PROMPT, transcription.text);
            await generalBotService.sendMessage(this.bot, this.chatId, summaryTranscription, voicePalUtils.getKeyboardOptions());
            await utilsService.deleteFile(videoFilePath);
            await utilsService.deleteFile(audioFilePath);
        } catch (err) {
            logger.error(this.handleSummarizeMetaVideoAction.name, `error: ${utilsService.getErrorMessage(err)}`);
            throw err;
        }
    }

    async handleImageGenerationAction({ text }) {
        try {
            const imageUrl = await openaiService.createImage(text);
            await generalBotService.sendPhoto(this.bot, this.chatId, imageUrl, voicePalUtils.getKeyboardOptions());
        } catch (err) {
            logger.error(this.handleImageGenerationAction.name, `error: ${utilsService.getErrorMessage(err)}`);
            throw err;
        }
    }

    async handleImageAnalyzerAction({ photo }) {
        try {
            const imageLocalPath = await generalBotService.downloadFile(this.bot, photo[photo.length - 1].file_id, LOCAL_FILES_PATH);
            const imageUrl = await imgurService.uploadImage(imageLocalPath);
            const imageAnalysisText = await openaiService.analyzeImage(imageUrl);
            await generalBotService.sendMessage(this.bot, this.chatId, imageAnalysisText, voicePalUtils.getKeyboardOptions());
            utilsService.deleteFile(imageLocalPath);
        } catch (err) {
            logger.error(this.handleImageAnalyzerAction.name, `error: ${utilsService.getErrorMessage(err)}`);
            throw err;
        }
    }
}

module.exports = VoicePalService;
