# Bulk message sender for WhatsApp (garbage project, opened for open-source discipline practice class)

## src/core/config.json

```json
{
  "PHONE_KEYWORD": "Phone", 
  // Title of the phone column from the CSV file (case-sensitive)

  "NAME_KEYWORD": "First Name", 
  // Title of the name column from the CSV file (case-sensitive, optional)

  "MESSAGE": "{greet}, {name}", 
  // Message template to be sent
  // Available variables: {greet}, {name}

  "CSV_PATH": "./data.csv", 
  // Path to the CSV file (must be in the project root)

  "DELAY": 25,
  // Delay between individual messages (in seconds)
  "DEBUG": false
  // in DEBUG mode, bots will not send any real messages, and you wont need to register all the sessions before testing.
}


```docker
docker build . -t wp_sender:v1
docker run -it wp_sender:v1

