const { Client, LocalAuth } = require('whatsapp-web.js');
const { logger } = require('../core/logger.js');
const qrcode = require('qrcode-terminal');
const { parse_existing_session_ids } = require('./misc.js');
const { botEvents } = require('../core/event_system.js');
const { cfg } = require('../core/config_manager.js');



class Bot {

    constructor(session_id) {
 
        this.ready = false;
        this.clientId = session_id;
        this.client = new Client({

            authStrategy: new LocalAuth({
                clientId: session_id,
                dataPath: './sessions/',
            }),
            puppeteer: {
                headless: 'false',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                ],
            },
        });
        this.subscribeToEvents();
    }

    subscribeToEvents() {

        this.client.on('qr', qr => {
            logger.warn("-------------Connecting to Bot №" + this.clientId + "--------------------");
            qrcode.generate(qr, { small: true });
        });

        this.client.once('ready', () => {
            this.ready = true;
            logger.info('Client №' + this.clientId + ' is ready');
        });


    }

    async sendMessage(chat_id, content) {
        try {
            this.client.sendMessage(chat_id, content);
        }
        catch (error) {
            logger.error("Bot №" + this.clientId + "can not send message. Error : " + error);
        }

    }

    async start() {
        await this.client.initialize();
    }
}

class BotManager {
    constructor() {
        this.bots = [];
        this._gen = null;
    }

    async addBot(botInstance) {
        if (this.bots.length >= 5) {
            logger.info('All bot slots are full');
            return;
        }
        await botInstance.start();
        this.bots.push(botInstance);
        
    }


    async initSessions(number_of_bots) {
        for (let i = 1; i <= number_of_bots; i++) {
            const bot = new Bot(i);
            await this.addBot(bot);
        }

        if (cfg.DEBUG === false) return await this.checkBotsReady();
    }

    async restoreSessions() {
        const ids = parse_existing_session_ids();

        const promises = ids.map(async (id) => {
            const bot = new Bot(id);
            await this.addBot(bot);
        });
        await Promise.allSettled(promises);

        if (cfg.DEBUG === false) return await this.checkBotsReady();

    }

    getBotByClientId(clientId) {
        try {
            return this.bots.find(b => b.clientId === clientId);
        }
        catch (error) {
            logger.error("Can not find bot by client id : " + clientId + "Error : " + error);
        }
    }

    *_bot_generator() {
        let i = 0;
        while (true) {
            yield this.bots[i % this.bots.length];
            i++;
        }
    }
    
    bot_iterator() {
        // infinite generator. returns bots instances, 1 by 1, looping after exhaustion of generator
    
        if (!this._gen) {
            this._gen = this._bot_generator();
        }

        return this._gen.next().value;
    }

    async checkBotsReady() {
        let timer;
        try{
        timer = setInterval(() => {
            let all_ready = true;

            for (let i = 0; i < this.bots.length; i++) {
                if (!this.bots[i].ready) {
                    all_ready = false;
                    break;
                };
            }

            if (all_ready) {
                botEvents.emit('bots_ready');
                clearInterval(timer);
            }


        }, 1500);
        const result = await botEvents.waitBotsReady();
        return result;
        } catch (error){
            logger.error('Bots can not initialize. Error : ' + error);
            clearInterval(timer);
        }
    }

}

const botManager = new BotManager();


module.exports = { botManager };