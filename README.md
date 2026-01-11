
src\core\config.json : 
{
  "PHONE_KEYWORD": "Phone",   // put title of phone column from a csv here (CASE MATTERS -> Phone != phone)
  "NAME_KEYWORD": "First Name", // put title of name column from a csv here (if present, otherwise leave as is) (CASE MATTERS -> First Name != first name)
  "MESSAGE": "{greet}, {name}", // message to be sent. greet and name are variables
  "CSV_PATH": "./data.csv", // rename your csv file to data.csv and put your it in the root directory of the project 
  "DELAY": 10 // individual delay between messages
}