from datetime import datetime
import json
import pandas as pd

def get_weekday(date_part):
    try:
        return datetime.strptime(date_part, "%Y-%m-%d").strftime("%A")
    except:
        return None

def json_to_excel(json_file_path, excel_file_path):
    # Load the JSON data
    with open(json_file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    # Prepare a list to store the rows for the DataFrame
    rows = []
    
    # Iterate through the data and extract information
    for access_code, trips in data.items():
        for trip in trips:
            purpose_of_travel = trip.get('purpose_of_travel', '')
            mode_of_travel = trip.get('mode_of_travel', '')
            identifier = trip.get('identifier', '')
            coordinates = trip.get('coordinates', [])
            if len(coordinates) >= 2:
                start_entry = coordinates[0] 
                end_entry = coordinates[-1]
                start_date_part, start_time, start_weekday = None, None, None
               # Extract start date, time, and weekday
                start_date_part, start_time, start_weekday = None, None, None
                if len(start_entry) > 2:
                    start_full_date = start_entry[2]  # Timestamp from the first entry
                    start_full_date = str(start_full_date)
                    if "T" in start_full_date:
                        start_date_part, start_time = start_full_date.split('T')
                        start_weekday = get_weekday(start_date_part)
                    else:
                        print(access_code, start_entry)
                
                # Extract end date, time, and weekday
                end_date_part, end_time, end_weekday = None, None, None
                if len(end_entry) > 2:
                    end_full_date = end_entry[2]  # Timestamp from the last entry
                    end_full_date = str(end_full_date)
                    if "T" in end_full_date:
                        end_date_part, end_time = end_full_date.split('T')
                        end_weekday = get_weekday(end_date_part)
                    else:
                        print(access_code, end_entry)
                
                
                rows.append({
                    'accessCode': access_code,
                    'start_weekday': start_weekday,
                    'start_date': start_date_part,
                    'start_time': start_time,
                    'end_weekday': end_weekday,
                    'end_date': end_date_part,
                    'end_time': end_time,
                    'purpose_of_travel': purpose_of_travel,
                    'mode_of_travel': mode_of_travel,
                    'identifier': identifier
                })

    # Convert the list of rows into a DataFrame
    df = pd.DataFrame(rows)

    # Save DataFrame to Excel
    df.to_excel(excel_file_path, index=False)

# Define file paths
json_file_path = "output_json/app_data.json"  # Replace with your JSON file path
excel_file_path = "output_excel/app_data.xlsx"  # Replace with your desired output Excel file path

# Convert JSON to Excel
json_to_excel(json_file_path, excel_file_path)