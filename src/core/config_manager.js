const path = require('path')
const fs = require('fs')
const { logger } = require('./logger.js')

class Config {
    constructor() {
        this.CONFIG_PATH = path.join(__dirname, '../../config.json');
        this.message = null; // message that bots will send.
        this.phone_keyword = null // these are used for parsing csv file
        this.name_keyword = null; // these are used for parsing csv file
        this.csv_path = null;
        this.delay = null;
        this.handleConfigChanges();
    }

    getConfig() {
        try {
            const data = fs.readFileSync(this.CONFIG_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.error('Can not get/parse config data : ' + error)
            return {};
        }
    }

    update(newValues) {
        try {
            const currentConfig = this.getConfig();
            const updatedConfig = { ...currentConfig, ...newValues };
            fs.writeFileSync(this.CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
            this.handleConfigChanges();
            logger.info("Config updated successfully!");
        } catch (error) {
            logger.error("Error updating config:", error);
        }
    }

    handleConfigChanges() {
        const CONFIG = this.getConfig();
        this.message = CONFIG.MESSAGE;
        this.phone_keyword = CONFIG.PHONE_KEYWORD;
        this.name_keyword = CONFIG.NAME_KEYWORD;
        this.csv_path = CONFIG.CSV_PATH;
        this.delay = CONFIG.DELAY * 1000;
    }

    updateMessageContent(new_message) {
        this.update({ message: new_message });
    }
}

const cfg = new Config();

module.exports = { cfg };