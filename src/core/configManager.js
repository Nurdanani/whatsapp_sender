const path = require('path')
const fs = require('fs').promises
const { logger } = require('./logger.js')

class ConfigManager {
    constructor(config_path) {
        this.CONFIG_PATH = config_path || path.join(__dirname, 'config.json');
    }

    async updateMessageText(new_message) {
        await this.updateConfig({ message: new_message });
    }

    async getConfig() {
        try {
            const data = await fs.readFile(this.CONFIG_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.error('Can not get/parse config data : ' + error)
            return {};
        }
    }

    async updateConfig(newValues) {
        try {
            const currentConfig = await this.getConfig();
            const updatedConfig = { ...currentConfig, ...newValues };
            await fs.writeFile(this.CONFIG_PATH, JSON.stringify(updatedConfig, null, 2));
            logger.info("Config updated successfully!");
        } catch (error) {
            logger.error("Error updating config:", error);
        }
    }
}


const configManager = new ConfigManager();

module.exports = { configManager };