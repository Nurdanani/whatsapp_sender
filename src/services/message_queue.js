const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { validateAndGetFormattedPhone } = require('./misc.js')
const { botManager } = require('./bot.js');
const { buildFormattedMessage } = require('./misc.js');
const { Config } = require('../core/config_manager.js');
const { logger } = require('../core/logger.js');

const CONFIG = new Config();
const CONFIG_JSON = CONFIG.getConfig();
const MESSAGE = CONFIG_JSON.MESSAGE;
const PHONE_KEYWORD = CONFIG_JSON.PHONE_KEYWORD;
const NAME_KEYWORD = CONFIG_JSON.NAME_KEYWORD;


class MessageQueue {
    //creates chunks, chunks are used to share messages between all the bots,
    // and create time delay between sending them.
    // each chunk is array filled with 1-5 objects (object contains msg + id of responsible bot)
    // when all the messages from chunk are sent, app waits some time before running new chunk
    constructor(csv_path) {
        this.csv_path = csv_path;
        this.records = this.#getParsedCsvData();
        //chunk queue is 2d array, that contains chunks as its elements.
        this.chunk_queue = [];
    }

    #getParsedCsvData() {
        logger.info("Reading .csv file...")
        const csvData = fs.readFileSync(this.csv_path, 'utf-8');
        const records = parse(csvData, { columns: true });
        const filtered_records = [];
        const invalid_records = [];
        for (const record of records) {
            // bots will only consider rows with valid phone,otherwise skip the entry from csv
            const formattedPhone = validateAndGetFormattedPhone(record[PHONE_KEYWORD]);

            if (formattedPhone) {
                record[PHONE_KEYWORD] = formattedPhone;
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
            const bot_id = botManager.id_iterator();
            const phone = record[PHONE_KEYWORD];
            const name = record?.[NAME_KEYWORD];
            const content = buildFormattedMessage(MESSAGE, name);
            //creates new chunk, if previous is full.
            if (!this.chunk_queue[chunk_index]) {
                this.chunk_queue[chunk_index] = [];
            }

            this.chunk_queue[chunk_index].push({
                //iterates through running bots' clientId, so all the messages are shared between the bots.
                clientId: bot_id,
                chat_id: phone + "@c.us",
                content: content,
                name: name
            });

            if (this.chunk_queue[chunk_index].length >= botManager.bots_ids.length) {
                chunk_index += 1;
            }
        }
        return this.chunk_queue;
    }

    async sendCurrentChunk() {
        const chunk = this.chunk_queue.shift();
        if (!chunk) return null;
        for (let i = 0; i < chunk.length; i++) {
            botManager.sendMessageByClientId(
                chunk[i].clientId,
                chunk[i].chat_id,
                chunk[i].content
            );
        }
        return chunk;
    }

}



module.exports = { MessageQueue }