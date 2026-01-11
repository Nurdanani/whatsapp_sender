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

  "DELAY": 10 
  // Delay between individual messages (in seconds)
}
