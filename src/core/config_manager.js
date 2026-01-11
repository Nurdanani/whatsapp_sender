const path = require('path')
const fs = require('fs')
const { logger } = require('./logger.js')

class Config {
    constructor() {
        this.CONFIG_PATH = path.join(__dirname, 'config.json');
        this.message = null; // message that bots will send.
        this.phone_keyword = null // these are used for parsing csv file
        this.name_keyword = null; // these are used for parsing csv file
        this.handleConfigChanges();
    }

    handleConfigChanges() {
        const CONFIG = this.getConfig();
        this.message = CONFIG.MESSAGE;
        this.phone_keyword = CONFIG.CSV_PHONE_COLUMN;
        this.name_keyword = CONFIG.CSV_NAME_COLUMN;
    }

    updateMessageContent(new_message) {
        this.updateConfig({ message: new_message });
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

    updateConfig(newValues) {
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
}




module.exports = { Config };