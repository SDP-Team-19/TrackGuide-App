import boto3
import json
import time

def generate_coordinates(latitude, longitude):
    '''Fake coordinate function used to test''' # replace GNSS digits here
    latitude += .000001
    longitude += .000001

    lat_str = str(latitude)
    lng_str = str(longitude)
    return {"latitude": lat_str, "longitude": lng_str}

# kinesis stream name
STREAM_NAME = "CoordinatesStream"

# initializing kinesis and region
kinesis_client = boto3.client("kinesis", region_name="us-east-1")

latitude = 37.7749 # default coords
longitude = -122.4194 

while True:
    #generate fake coordinates
    coordinates = generate_coordinates(float(latitude), float(longitude)) #
    latitude = coordinates["latitude"] #only needed to increment fake coordinates but useful for output 
    longitude = coordinates["longitude"] # ^^^
    
    #send to Kinesis
    kinesis_client.put_record(
        StreamName=STREAM_NAME,
        Data=json.dumps(coordinates),
        PartitionKey="partition-1"
    )

    print(f"Sent: {coordinates}")
    time.sleep(2)  #wait 2 seconds before going again