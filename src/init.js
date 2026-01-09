const fs = require('fs').promises;
const prompt = require('prompt-sync')();
const { logger } = require('./core/logger.js');
const csv = require('csv-parser');
const crypto = require('crypto');


const { botManager } = require('./services/bot.js')

const { ConfigManager } = require('./core/configManager.js')
const configManagerService = new ConfigManager();


async function init() {
    logger.info("Do you want to restart previous sessions? (if any exist) | Y/N");
    const restart = prompt()?.toLowerCase();
    
    if (restart === 'y' || restart === 'yes') {
        const ids = await parse_existing_session_ids();
        if (ids.length > 0) {
            await adjust_settings();
            await botManager.createBotsFromList(ids);
            return;
        }else{
            await clear_sessions();
            logger.info("Sessions are cleared. Initializing new ones");
        }
    }else{
        await clear_sessions();
        logger.info("Sessions are cleared. Initializing new ones");
    }

    
    let number_of_bots;

    while (true) {
        logger.info("How many new sessions do you need? (1-5)");
        number_of_bots = Number(prompt());
        
        if (number_of_bots > 0 && number_of_bots <= 5) break;
        logger.error("Incorrect number of sessions entered. Please enter 1-5.");
    }
    


    await adjust_settings();
    await botManager.createBots(number_of_bots);
}



async function parse_existing_session_ids() {
    try {
        const ids = await fs.readdir('./sessions');
        if (ids.length > 0) {
            logger.info("Available sessions:");
            ids.forEach(id => logger.info(id));
            ids.forEach(id => {
                id = id.replace('session_', '');
            });
            logger.info("Recovering sessions...");
            return ids;
        }
    } catch (e) {
        logger.error('cant parse sessions');
    }
    logger.info("No available sessions found. You need to register new bots");
    return [];
}

async function adjust_settings() {
    const config = await configManagerService.getConfig();
    logger.info("Current message: " + (config.message || "None"));
    logger.info("Do you want to continue with that message? | Y/N");
    
    if (prompt()?.toLowerCase() !== 'y') {
        logger.info("Enter new message: ");
        const new_message = prompt();
        await configManagerService.updateMessage(new_message);
    }
}


async function clear_sessions() {
    await fs.rm('./sessions/', {recursive : true, force : true});
    await fs.mkdir('./sessions/');
}




init();

