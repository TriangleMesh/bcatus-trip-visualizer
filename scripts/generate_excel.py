import json
import pandas as pd

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
            
            for coordinate in trip.get('coordinates', []):
                full_date = coordinate[2] if len(coordinate) > 2 else None  # Extract full datetime from coordinates
                
                # Split full_date into date and time if it's not None
                if full_date:
                    date_part, time_part = full_date.split('T')
                else:
                    date_part, time_part = None, None
                
                rows.append({
                    'accessCode': access_code,
                    'date': date_part,
                    'time': time_part,
                    'purpose_of_travel': purpose_of_travel,
                    'mode_of_travel': mode_of_travel,
                    'identifier': identifier
                })

    # Convert the list of rows into a DataFrame
    df = pd.DataFrame(rows)

    # Save DataFrame to Excel
    df.to_excel(excel_file_path, index=False)

# Define file paths
json_file_path = "output_json/app_data_cezy-cdy-ic.json"  # Replace with your JSON file path
excel_file_path = "output_excel/app_data_cezy-cdy-ic_new.xlsx"  # Replace with your desired output Excel file path

# Convert JSON to Excel
json_to_excel(json_file_path, excel_file_path)