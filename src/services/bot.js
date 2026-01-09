const { Client, LocalAuth } = require('whatsapp-web.js');
const { logger } = require('../core/logger.js');
const qrcode = require('qrcode-terminal');
const { EventEmitter } = require('events');
const { ConfigManager } = require('../core/configManager.js');

const ConfigManagerService = new ConfigManager();
const INITIAL_CONFIG = await ConfigManagerService.getConfig();
const MESSAGE_DELAY = INITIAL_CONFIG.MESSAGE_DELAY


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
    async start(){
        await this.client.initialize();
    }
}

class BotManager extends EventEmitter {
    constructor() {
        this.message_delay = ConfigManagerService.get
        this.bots = [];
        this.subscribeToEvents()
    }
    subscribeToEvents(){
        this.on('on_message_sent', setTimeout(async () => await this.sendMessagesFromQueue(), 15000))
    }

    async sendMessagesFromQueue(){
        
    }


    async addBot(botInstance) {
        if (this.bots.length >= 5){
            logger.info('All slots are full');
            return;
        }
        this.bots.push(botInstance);
        await botInstance.start();
    }
    
    async createBots(number_of_bots) {
        for(let i = 1;i <= number_of_bots;i++){
            const bot = new Bot(i);
            await this.addBot(bot);
            logger.info(`Bot initialized: ${i}`);
        }
    }
    async createBotsFromList(botsList) {
        logger.info(botsList);
        for(const id in botsList){
            const bot = new Bot(Number(id)+1);
            await this.addBot(bot);
            logger.info(`Bot initialized: ${Number(id)+1}`);
        }
    }

    async sendMessageToAll(chat_id, content) {
        for (const bot of this.bots) {
            if (bot.isOnCooldown === true) continue;
            try {
                bot.isOnCooldown = true;
                await bot.client.sendMessage(chat_id, content);
                this.emit('on_messages_sent');
            } catch (e) {
                logger.error(`Failed to send via ${bot.clientId}: ${e.message}`);
            }
        }

    }
}

const botManager = new BotManager();




module.exports = { botManager };