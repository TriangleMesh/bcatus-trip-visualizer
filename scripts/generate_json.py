import csv
import json
from datetime import datetime, UTC
import sys
import pytz
import pandas as pd


csv.field_size_limit(sys.maxsize)

def csv_to_json(csv_file_path, json_file_path):
    data_dict = {}

    with open(csv_file_path, encoding='utf-8') as csv_file_handler:
        csv_reader = csv.DictReader(csv_file_handler)
        for rows in csv_reader:
            access_code = rows['accessCode']
            output_value = []
            if 'userData' in rows and rows['userData']:
                try:
                    user_data_json = json.loads(rows['userData'])
                    identifier = user_data_json.get('identifier', 'Unknown')
                    identifier = identifier.split(',')[0]
                    trips = user_data_json.get('userData', {}).get('trips', [])
                    for trip in trips:
                        coordinates = [
                            [
                                point.get('latitude', None),
                                point.get('longitude', None),
                                convert_timestamp(point.get('timestamp', None))
                                # point.get('horizontalAccuracy', None),
                                # point.get('verticalAccuracy', None)
                            ]
                            for point in trip.get('route', [])
                        ]
                        purpose_of_travel = trip.get('purposeOfTravel', '')
                        mode_of_travel = trip.get('modeOfTravel', '')

                        output_value.append({
                            'coordinates': coordinates,
                            'purpose_of_travel': purpose_of_travel,
                            'mode_of_travel': mode_of_travel,
                            'identifier': identifier
                        })
                except:
                    print(f"Error decoding JSON for accessCode {access_code}")
                    output_value.append({
                        'coordinates': [],
                        'purpose_of_travel': 'None',
                        'mode_of_travel': 'None',
                        'identifier': 'Unknown'
                    })
            
            # Append to existing access_code entry if it exists, otherwise create a new list
            if access_code in data_dict:
                data_dict[access_code].extend(output_value)
            else:
                data_dict[access_code] = output_value

    with open(json_file_path, 'w', encoding='utf-8') as json_file_handler:
        json_file_handler.write(json.dumps(data_dict, indent=4))


def convert_timestamp(ts):
    try:
        # Define the Vancouver timezone
        vancouver_tz = pytz.timezone('America/Vancouver')
        if ts > 1e10:  # Millisecond-level timestamp
            dt = pd.to_datetime(ts, unit='ms')
        else:  # Second-level timestamp
            dt = pd.to_datetime(ts, unit='s')  
        # Convert UTC time to Vancouver timezone
        dt_vancouver = dt.tz_localize('UTC').tz_convert(vancouver_tz)
        # Return the time as an ISO-formatted string
        return dt_vancouver.isoformat()
    except Exception as e:
        print(f"Error converting timestamp {ts}: {e}")
        return None



csv_file_path = "raw/app_data.csv"
json_file_path = "output_json/app_data.json"
csv_to_json(csv_file_path, json_file_path)