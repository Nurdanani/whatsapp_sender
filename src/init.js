const prompt = require('prompt-sync')();
const { logger } = require('./core/logger.js');
const { MessageQueue } = require('./services/message_queue.js');
const { botManager } = require('./services/bot.js');
const { cfg } = require('./core/config_manager.js');
const { clearSessions } = require('./services/misc.js');

async function main() {
    const restart = askYesNo("Do you want to restart previous sessions? (if any exist) | Y/N");

    if (restart) {
        const delay = askDelay();
        await botManager.restoreSessions();
        return await startUp();
    } else {
        clearSessions();
        logger.info("Sessions are cleared. Registering new ones...");
    }

    const number_of_bots = askNumberOfBots();
    const delay = askDelay();
    await botManager.initSessions(number_of_bots);
    return await startUp();
}



function askYesNo(message) {
    logger.info(message);
    const answer = prompt()?.toLowerCase();
    return answer === 'y' || answer === 'yes';
}

function askNumber(message, min, max, errorMsg) {
    let num;
    while (true) {
        logger.info(message);
        num = Number(prompt());
        if (num >= min && num <= max) return num;
        logger.error(errorMsg);
    }
    return;
}

function askDelay() {
    const delay = askNumber(
        "Set time interval for messages, in seconds (minimal delay = 10s) :",
        10,
        Infinity,
        "You can not set interval < 10s. Please, enter correct interval."
    );
    cfg.update({ DELAY: Math.max(10, delay) });
    return delay;
}

function askNumberOfBots() {
    const number_of_bots = askNumber(
        "How many new sessions do you need? (1-5)",
        1,
        5,
        "Incorrect number of sessions entered. Please, enter in 1-5 range."
    );
    return number_of_bots;
}

async function startUp() {
    const proceed = askYesNo("Do you want to start sending messages? | Y/N");
    if (!proceed) {
        logger.info('Ok, closing ');
        process.exit(0);
    }
    logger.info('Ok, starting up');

    const q = new MessageQueue();
    q.buildMessageChunks();

    const sendLoop = async () => {
        const sendingFinished = await q.sendCurrentChunk();
        if (sendingFinished) return;
        setTimeout(sendLoop, cfg.delay);
    };

    sendLoop();

    return;
}



main();