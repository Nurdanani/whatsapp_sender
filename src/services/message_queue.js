
const { parse }  = require('csv-parse'); 
const fs = require('fs');

const input = fs.readFileSync('kittens.csv', 'utf8');

const records = parse(input, {
    columns: true,          
    skip_empty_lines: true,
    trim: true
});

console.log(records);


const message_queue = [];

function getMessageQueue(){

}