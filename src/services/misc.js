const phoneUtils = require('node-phone-utils').createInstance();



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

function buildFormattedMessage(message, name) {
    const greetings = ['Здравствуйте', 'Добрый день', 'Доброго времени суток'];
    const hello = greetings[Math.floor(Math.random() * greetings.length)];
    if (!name) {
        return message
            .replace('{name}', '')
            .replace({ hello }, hello);
    }

    if (name) {
        return message
            .replace('{name}', name)
            .replace('{hello}', hello);
    }



}


module.exports = { validateAndGetFormattedPhone, buildFormattedMessage }