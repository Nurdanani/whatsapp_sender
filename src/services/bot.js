const { Client, LocalAuth } = require('whatsapp-web.js');
const { logger } = require('../core/logger.js');
const qrcode = require('qrcode-terminal');
const { parse_existing_session_ids } = require('./misc.js');



class Bot {
    constructor(session_id) {
        this.clientId = session_id;
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: session_id,
                dataPath: './sessions/',
            }),
            puppeteer: {
                headless: 'shell',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
            }
        });

        this.subscribeToEvents();
    }


    subscribeToEvents() {

        this.client.on('qr', qr => {
            logger.info("Connecting to : " + this.clientId);
            qrcode.generate(qr, { small: true });
        });

        this.client.once('ready', () => logger.info('Client ' + this.clientId + ' is ready'));

    }
    async sendMessage(chat_id, content) {
        try {
            this.client.sendMessage(chat_id, content);
        }
        catch (error) {
            logger.error("BOT" + this.clientId + "can not send message. Error : " + error);
        }

    }
    async start() {
        await this.client.initialize();
    }
}

class BotManager {
    constructor() {
        this.bots = [];
        this.bots_ids = [];
        this._gen = null;
    }

    async addBot(botInstance) {
        if (this.bots.length >= 5) {
            logger.info('All bot slots are full');
            return;
        }
        this.bots.push(botInstance);
        this.bots_ids.push(botInstance.clientId);
        await botInstance.start();
    }


    async createBots(number_of_bots) {
        for (let i = 1; i <= number_of_bots; i++) {
            const bot = new Bot(i);
            await this.addBot(bot);
        }
    }

    async restoreSessions() {
        const ids = parse_existing_session_ids();

        const promises = ids.map(async (id) => {
            const bot = new Bot(id);
            await this.addBot(bot);
        });

        await Promise.allSettled(promises);
    }

    getBotByClientId(clientId) {
        try {
            return this.bots.find(b => b.clientId === clientId);
        }
        catch (error) {
            logger.error("Can not find bot by client id : " + clientId + "Error : " + error);
        }
    }
    *_id_generator() {
        let i = 0;
        while (true) {
            yield this.bots_ids[i % this.bots_ids.length];
            i++;
        }
    }
    id_iterator() {
        if (!this._gen) {
            this._gen = this._id_generator();
        }
        return this._gen.next().value;
    }

    async sendMessageByClientId(clientId, chat_id, content) {
        let bot = this.bots.find(b => b.clientId === clientId);
        console.log(clientId, chat_id, content);
        if (!bot) throw Error('Can not find bot with such name : ' + clientId);
        // ! TEST ME await bot.client.sendMessage(chat_id, content);
    }

}

const botManager = new BotManager();


module.exports = { botManager };