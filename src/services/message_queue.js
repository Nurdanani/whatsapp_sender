const fs = require('fs');
const { parse } = require('csv-parse/sync');

const { logger } = require('../core/logger.js');
const { buildFormattedMessage, delayRandomizer } = require('./misc.js');
const { validateAndGetFormattedPhone } = require('./misc.js')


const { cfg } = require('../core/config_manager.js');
const { botManager } = require('./bot.js');

class MessageQueue {
    //creates chunks, chunks are used to share messages between all the bots,
    // and create time delay between sending them.
    // each chunk is array filled with 1-5 objects (object contains msg + id of responsible bot)
    // when all the messages from chunk are sent, app waits some time before running new chunk
    constructor() {
        this.csv_path = cfg.csv_path;
        this.records = this.#getParsedCsvData();
        //chunk queue is a queue of chunks, each time single chunk messages are sent, app sets time delay.
        this.chunk_queue = [];
        this.unsent_messages = [];
        this.sent_messages = [];
    }

    #getParsedCsvData() {
        logger.info("Reading .csv file...")
        const csvData = fs.readFileSync(this.csv_path, 'utf-8');
        const records = parse(csvData, { columns: true });
        const filtered_records = [];
        const invalid_records = [];
        for (const record of records) {
            // bots will only consider rows with valid phone,otherwise skip the entry from csv
            const formattedPhone = validateAndGetFormattedPhone(record[cfg.phone_keyword]);

            if (formattedPhone) {
                record[cfg.phone_keyword] = formattedPhone;
                filtered_records.push(record);
            } else {
                invalid_records.push(record);
            }

        }
        logger.info('Number of skipped records from csv (w/o valid phone number) : ' + invalid_records.length);
        return filtered_records;
    }

    buildMessageChunks() {
        const records = this.records;
        let chunk_index = 0;
        while (records.length > 0) {
            const record = records.shift();
            const botInstance = botManager.bot_iterator();
            const phone = record[cfg.phone_keyword];
            const name = record?.[cfg.name_keyword];
            const content = buildFormattedMessage(cfg.message, name);
            //creates new chunk, if previous is full.
            if (!this.chunk_queue[chunk_index]) {
                this.chunk_queue[chunk_index] = [];
            }

            this.chunk_queue[chunk_index].push({
                //iterates through running bots' clientId, so all the messages are shared between the bots.
                bot: botInstance,
                chat_id: phone + "@c.us",
                content: content,
                name: name
            });

            if (this.chunk_queue[chunk_index].length >= botManager.bots.length) {
                chunk_index += 1;

            }
        }
        return this.chunk_queue;
    }

    async sendCurrentChunk() {
        const chunk = this.chunk_queue.shift();
        if (!chunk) {
            logger.warn("Bots have sent all the messages");
            logger.warn("-----------Summary-----------");
            logger.warn("Total messages sent : " + (this.sent_messages.length));
            logger.warn("Invalid rows from csv : " + invalid_records);
            return true;
        };
        for (let i = 0; i < chunk.length; i++) {
            const receiver_chat_id = chunk[i].chat_id;
            const name = chunk[i]?.name || ' ';

            const bot = chunk[i].bot;
            const content = chunk[i].content;

            try {
                if (cfg.DEBUG === true) {
                    logger.debug(chunk[i]);
                    continue;
                }
                await bot.sendMessage(receiver_chat_id, content);
                this.sent_messages.push(chunk[i]);
            }
            catch (error) {
                this.unsent_messages.push(chunk[i]);
                logger.error("Bot №" + bot.clientId + " colud not send message to " + receiver_chat_id + ", " + name + " Error : " + error);
            }
        }
        return false;
    }

}

module.exports = { MessageQueue }