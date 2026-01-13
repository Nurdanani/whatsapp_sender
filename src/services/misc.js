const phoneUtils = require('node-phone-utils').createInstance();
const { logger } = require('../core/logger.js');
const fs = require('fs');
const { cfg } = require('../core/config_manager.js');



function buildFormattedMessage(message, name = '') {
    const greetings = [
        'Здравствуйте',
        'Приветствую вас',
        'Рады вас приветствовать',
        'Добро пожаловать',
        'Приятного дня',
        'Счастливого дня',
        'С наилучшими пожеланиями',
        'Искренне приветствуем',
        'С уважением приветствуем',
        'С уважением',
        'Приветствуем вас',
        'С искренним уважением',
        'С наилучшими пожеланиями вам',
        'С сердечным приветом',
        'С добрыми пожеланиями',
        'С наилучшими пожеланиями дня',
        'Рады вашему обращению',
        'Приветствуем',
        'С уважением к вам',
        'Искренне рады приветствовать'
    ];
    const greet = greetings[Math.floor(Math.random() * greetings.length)];
    if (!name) name = '';
    return message
        //variables
        .replaceAll('{name}', name)
        .replaceAll('{greet}', greet);
}








function validateAndGetFormattedPhone(phone) {
    try {
        if (!phone) return false;
        if (phoneUtils.isValid(phone, 'KZ')) {
            return phoneUtils.toE164(phone, 'KZ').replace('+', '');
        }
    }
    catch (error) {
        logger.error("Error while parsing phone : " + error);
        return false;
    }
}





function parse_existing_session_ids() {
    try {
        const sessions = fs.readdirSync('./sessions');
        const result = [];
        for (const session_name of sessions) {
            const id = Number(session_name.split('-')[1]);
            result.push(id);
        }
        if (!result) {
            logger.error("No available sessions found. You need to register new bots");
            return [];
        };

        return result;
    } catch (error) {
        logger.error('Can not parse sessions. Error : ' + error);
        return [];
    }
}



function delayRandomizer(delay_in_ms) {
    if (typeof delay_in_ms !== 'number') throw Error('Invalid type passed to randomizer');
    let jitter = Math.random() * 2500;
    const sign = Math.random();
    if (sign <= 0.5) jitter = jitter * -1;

    if (cfg.DEBUG === true) return delay_in_ms;

    return Math.max(25000 + jitter, delay_in_ms + jitter);
}

function clearSessions() {
    try{
        fs.rmSync('./sessions/', { recursive: true, force: true });
        fs.mkdirSync('./sessions/');
    }
    catch (error){
        logger.error('Could not erase old sessions.  Error : ' + error);
    }

}




module.exports = {
    validateAndGetFormattedPhone,
    buildFormattedMessage,
    parse_existing_session_ids,
    clearSessions,
    delayRandomizer,
}