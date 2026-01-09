const { Client, LocalAuth } = require('whatsapp-web.js');
const { logger } = require('../core/logger.js');
const qrcode = require('qrcode-terminal');
const { EventEmitter } = require('events');



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
    async start() {
        await this.client.initialize();
    }
}

class BotManager extends EventEmitter {
    constructor() {
        super()
        this.bots = {};
        this.subscribeToEvents()
    }
    subscribeToEvents() {
        this.on('on_message_sent', () => setTimeout(async () => await this.sendMessagesFromQueue(), 15000))
    }



    async addBot(botInstance) {
        if (this.bots.length >= 5) {
            logger.info('All slots are full');
            return;
        }
        this.bots[botInstance.clientId] = botInstance;
        await botInstance.start();
    }

    async createBots(number_of_bots) {
        for (let i = 1; i <= number_of_bots; i++) {
            const bot = new Bot(i);
            await this.addBot(bot);
            logger.info(`Bot initialized: ${i}`);
        }
    }

    async createBotsFromList(botsList) {
        logger.info(botsList);
        for (const id in botsList) {
            const bot = new Bot(Number(id) + 1);
            await this.addBot(bot);
            logger.info(`Bot initialized: ${Number(id) + 1}`);
        }
    }

    async sendMessageByClientId(clientId, chat_id, content) {
        const bot = this.bots[clientId];
        if (!bot) throw Error('Can not find bot with such name : ' + this.bots[clientId]);
        // ! ------------------------------------------

    }
    getClientIds() {
        const clientIds = [];
        Object.entries(this.bots).forEach((key, value) => {
            clientIds.push(key);
        });
        return clientIds;
    }
}

const botManager = new BotManager();




module.exports = { botManager };