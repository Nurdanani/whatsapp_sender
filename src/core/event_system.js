const { EventEmitter } = require('events');
const { logger } = require('./logger.js');

class BotEvents extends EventEmitter {
    constructor() {
        super();
    }
    async waitBotsReady() {
        return new Promise(
            (resolve) => {
                this.once('bots_ready', () => {
                    logger.info('Bots logged in and initialized successfully');
                    resolve(true);
                });
            });
    }
}

const botEvents = new BotEvents();
module.exports = { botEvents };