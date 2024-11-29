import csv
import json

def process_coordinates(coordinate_raw, start, end):
    coordinates = []
    filtered_values = [v.strip() for v in coordinate_raw if v and v.strip()]
    current_pair = []
    for value in filtered_values:
        try:
            parts = value.split(";")
            for part in parts:
                cleaned_part = part.strip()
                if cleaned_part:
                    try:
                        num = float(cleaned_part)
                        current_pair.append(num)
                        if len(current_pair) == 2:
                            current_pair.append(start)
                            coordinates.append(current_pair)
                            current_pair = []
                    except ValueError:
                        continue
        except Exception as e:
            print(f"Error processing value {value}: {e}")
            continue
    if coordinates and len(coordinates) > 0:
        coordinates[-1][-1] = end
    return coordinates

def csv_to_json_from_email(csv_file_path, json_file_path, accessCode):
    output_value = {accessCode: []}
    
    try:
        with open(csv_file_path, encoding='utf-8') as csv_file:
            csv_reader = csv.reader(csv_file)
            next(csv_reader)
            for row in csv_reader:
                mode = row[3]
                purpose = row[4]
                identifer = None
                start = row[1]
                end = row[2]
                coordinate_raw = row[9:]
                coordinates = process_coordinates(coordinate_raw, start, end)
                route = {
                    "coordinates": coordinates,
                    "purpose_of_travel": purpose,
                    "mode_of_travel": mode,
                    "identifier": identifer
                }
                output_value[accessCode].append(route)
        with open(json_file_path, 'w', encoding='utf-8') as json_file:
            json.dump(output_value, json_file, indent=2, ensure_ascii=False)
    except FileNotFoundError:
        print(f"Error: File not found {csv_file_path}")
    except KeyError as e:
        print(f"Error: Missing key in row: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")

# Configuration the following values
accessCode = ""
csv_file_path = "raw/" + accessCode + ".csv"
json_file_path = "output_json_from_email/" + accessCode + ".json"
csv_to_json_from_email(csv_file_path, json_file_path, accessCode)
