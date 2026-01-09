const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { validateAndGetFormattedPhone } = require('./misc.js')
const { botManager } = require('./bot.js');
const { buildFormattedMessage } = require('./misc.js');
const { MESSAGE } = require('../core/config.js')

class MessageQueue {
    constructor(csv_path) {
        this.csv_path = csv_path;
        this.csv_parsed = this.getParsedCsvData();
        this.chunk_queue = [];
    }

    getParsedCsvData() {
        const csvData = fs.readFileSync(this.csv_path, 'utf-8');
        const records = parse(csvData, { columns: true });
        const records_filtered = [];
        for (const record of records) {
            const phone = validateAndGetFormattedPhone(record.Phone);
            if (phone) {
                record.Phone = phone;
                records_filtered.push(record);
            }

        }
        return records_filtered;
    }

    buildMessageChunks(number_of_bots) {
        const users = this.csv_parsed;
        const bots = ['1', '2', '3'];// !botManager.getClientIds();
        let chunk_index = 0;
        let bot_iterator = 0;
        while (users.length > 0) {
            const user = users.shift();
            const phone = user.Phone;
            const name = user?.['First Name'];
            const content = buildFormattedMessage(MESSAGE, name);
            if (!this.chunk_queue[chunk_index]) {
                this.chunk_queue[chunk_index] = [];
            }
            this.chunk_queue[chunk_index].push({
                clientId: bots[bot_iterator],
                chat_id: phone + "@c.us",
                content: content,
                name: name
            });

            bot_iterator += 1;
            if (bot_iterator >= number_of_bots) {
                bot_iterator = 0;
                chunk_index += 1;
            }
        }
    }

    async sendCurrentChunk() {
        const chunk = this.chunk_queue.shift();
        if (!chunk) return null;
        const messages_to_be_sent = [];
        console.log(chunk);
        // for (let i = 0; i < chunk.length; i++) {
        //     messages_to_be_sent.push(
        //         botManager.sendMessageByClientId(
        //         chunk[i].clientId,
        //         chunk[i].chat_id,
        //         chunk[i].content))
        // }
        await Promise.allSettled(messages_to_be_sent)
        return chunk;
    }

}

