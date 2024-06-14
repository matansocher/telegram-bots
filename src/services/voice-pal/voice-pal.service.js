const fs = require('fs').promises;
const {
    ANALYTIC_EVENT_NAMES,
    LOCAL_FILES_PATH,
    SUMMARY_PROMPTS,
    NOT_FOUND_VIDEO_MESSAGES,
    VOICE_PAL_OPTIONS,
} = require('./voice-pal.config');
const voicePalUtils = require('./voice-pal.utils');
const imgurService = require('../imgur.service');
const googleTranslateService = require('../google-translate.service');
const openaiService = require('../openai/openai.service');
const tiktokDownloaderService = require('../tiktok-downloader.service');
const userSelectionService = require('../user-selections.service');
const youtubeTranscriptService = require('../youtube-transcript.service');
const mongoService = require('../mongo/voice-pal/mongo.service');
const generalBotService = require('../../telegram-bots/general-bot.service');
const utilsService = require('../utils.service');
const messageLoaderService = require('../../telegram-bots/message-loader.service');

class VoicePalService {
    constructor(bot, chatId) {
        this.bot = bot;
        this.chatId = chatId;
    }

    async handleActionSelection(selection) {
        userSelectionService.setCurrentUserAction(this.chatId, selection);
        const relevantAction = Object.keys(VOICE_PAL_OPTIONS).find(option => VOICE_PAL_OPTIONS[option].displayName === selection);
        await generalBotService.sendMessage(this.bot, this.chatId, VOICE_PAL_OPTIONS[relevantAction].selectedActionResponse, voicePalUtils.getKeyboardOptions());
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

        if (userAction && userAction.showLoader) { // showLoader
            await messageLoaderService.withMessageLoader(this.bot, this.chatId, { cycleDuration: 5000 }, async () => {
                await this[userAction.handler]({ text, audio, video, photo });
            });
        } else {
            await this[userAction.handler]({ text, audio, video, photo });
        }

        mongoService.sendAnalyticLog(ANALYTIC_EVENT_NAMES[userAction], { chatId: this.chatId });
        // userSelectionService.removeCurrentUserAction(this.chatId);
    }

    async handleTranscribeAction({ video, audio }) {
        const audioFileLocalPath = await generalBotService.downloadAudioFromVideoOrAudio(this.bot, { video, audio });
        const resText = await openaiService.getTranscriptFromAudio(audioFileLocalPath);
        await generalBotService.sendMessage(this.bot, this.chatId, resText.text, voicePalUtils.getKeyboardOptions());
        await utilsService.deleteFile(audioFileLocalPath);
    }

    async handleTranslateAction({ text, video, audio }) {
        let resText = '';
        let audioFileLocalPath = '';

        if (text) {
            resText = await googleTranslateService.getTranslationToEnglish(text);
        } else {
            audioFileLocalPath = await generalBotService.downloadAudioFromVideoOrAudio(this.bot, { video, audio });
        }

        if (audioFileLocalPath) {
            resText = await openaiService.getTranslationFromAudio(audioFileLocalPath);
            utilsService.deleteFile(audioFileLocalPath);
        }

        await generalBotService.sendMessage(this.bot, this.chatId, resText, voicePalUtils.getKeyboardOptions());
    }

    async handleTextToSpeechAction({ text }) {
        const result = await openaiService.getAudioFromText(text);

        const audioFilePath = `${LOCAL_FILES_PATH}/text-to-speech-${new Date().getTime()}.mp3`;
        const buffer = Buffer.from(await result.arrayBuffer());
        await fs.writeFile(audioFilePath, buffer);

        await generalBotService.sendVoice(this.bot, this.chatId, audioFilePath, voicePalUtils.getKeyboardOptions());
        await utilsService.deleteFile(audioFilePath);
    }

    async handleSummarizeTextAction({ text }) {
        const textSummary = await openaiService.getChatCompletion(SUMMARY_PROMPTS.TEXT, text);
        await generalBotService.sendMessage(this.bot, this.chatId, textSummary, voicePalUtils.getKeyboardOptions());
    }

    async handleSummarizeYoutubeVideoAction({ text }) {
        const videoId = utilsService.getQueryParams(text).v;
        if (!videoId) {
            await generalBotService.sendMessage(this.bot, this.chatId, NOT_FOUND_VIDEO_MESSAGES.YOUTUBE, voicePalUtils.getKeyboardOptions());
        }
        const { transcription, errorMessage } = await youtubeTranscriptService.getYoutubeVideoTranscription(videoId);
        if (errorMessage) {
            await generalBotService.sendMessage(this.bot, this.chatId, errorMessage, voicePalUtils.getKeyboardOptions());
        }
        const summaryTranscription = await openaiService.getChatCompletion(SUMMARY_PROMPTS.YOUTUBE, transcription);
        await generalBotService.sendMessage(this.bot, this.chatId, summaryTranscription, voicePalUtils.getKeyboardOptions());
    }

    async handleSummarizeTiktokVideoAction({ text }) {
        const tiktokVideoUrl = text.split('?')[0];
        const audio = await tiktokDownloaderService.getTiktokAudio(tiktokVideoUrl);
        if (!audio) {
            await generalBotService.sendMessage(this.bot, this.chatId, NOT_FOUND_VIDEO_MESSAGES.TIKTOK, voicePalUtils.getKeyboardOptions());
        }

        const audioFilePath = `${LOCAL_FILES_PATH}/tiktok-summary-${new Date().getTime()}.mp3`;
        fs.writeFileSync(audioFilePath, audio)
        const transcription = await openaiService.getTranscriptFromAudio(audioFilePath);

        const summaryTranscription = await openaiService.getChatCompletion(SUMMARY_PROMPTS.TIKTOK, transcription);
        await generalBotService.sendMessage(this.bot, this.chatId, summaryTranscription, voicePalUtils.getKeyboardOptions());
        await utilsService.deleteFile(audioFilePath);
    }

    async handleImageGenerationAction({ text }) {
        const imageUrl = await openaiService.createImage(text);
        await generalBotService.sendPhoto(this.bot, this.chatId, imageUrl, voicePalUtils.getKeyboardOptions());
    }

    async handleImageAnalyzerAction({ photo }) {
        const imageLocalPath = await generalBotService.downloadFile(this.bot, photo[photo.length - 1].file_id, LOCAL_FILES_PATH);
        const imageUrl = await imgurService.uploadImage(imageLocalPath);
        const imageAnalysisText = await openaiService.analyzeImage(imageUrl);
        await generalBotService.sendMessage(this.bot, this.chatId, imageAnalysisText, voicePalUtils.getKeyboardOptions());
        utilsService.deleteFile(imageLocalPath);
    }
}

module.exports = VoicePalService;
