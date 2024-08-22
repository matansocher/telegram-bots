const { get: _get } = require('lodash');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { VOICE_PAL_OPTIONS } = require('../services/voice-pal/voice-pal.config');
const { getMessageData } = require('./general-bot.service');

(async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')
    const sock = makeWASocket({ printQRInTerminal: true, auth: state });
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = _get(lastDisconnect, 'error.output.statusCode', null) !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
    });
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async m => {
        const { chatId } = getMessageData(m.messages[0]);
        const messageText = Object.keys(VOICE_PAL_OPTIONS).map((option, i) => `${i} - ${VOICE_PAL_OPTIONS[option].displayName}`).join('\n');
        await sock.sendMessage(chatId, { text: messageText })
    });
})();
