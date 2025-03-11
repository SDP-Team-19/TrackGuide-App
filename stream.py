import boto3
import json
import time
count = 0
def generate_coordinates(latitude, longitude, count):
    '''Fake coordinate function used to test''' 
    if count < 20:
        latitude += .000007
    elif count < 40:
        longitude -= .000007
    elif count <60:
        latitude -= 0.000007
    else:
        longitude += 0.000007
    


    return {"latitude": latitude, "longitude": longitude}

# kinesis stream name
STREAM_NAME = "CoordinatesStream"

# initializing kinesis and region
kinesis_client = boto3.client("kinesis", region_name="us-east-1")

latitude = 42.393429 # default coords
longitude = -72.529197 

first = 1
test = {"threshold": 0.00001, "mode": "record"}
while True:
    #generate fake coordinates
    count += 1
    coordinates = generate_coordinates(float(latitude), float(longitude),count) #
    latitude = coordinates["latitude"] #only needed to increment fake coordinates but useful for output 
    longitude = coordinates["longitude"] # ^^^
    
    #send to Kinesis
    if first == 1:
        kinesis_client.put_record(
            StreamName=STREAM_NAME,
            Data=json.dumps(test),
            PartitionKey="partition-1"
        )
        first = 2
    else:
        kinesis_client.put_record(
            StreamName=STREAM_NAME,
            Data=json.dumps(coordinates),
            PartitionKey="partition-1"
        )

    if count == 80:
        test ={"threshold": 0.00001, "mode": "line_reset"}
        kinesis_client.put_record(
            StreamName=STREAM_NAME,
            Data=json.dumps(test),
            PartitionKey="partition-1"
        )

    if count == 80:
        test ={"threshold": 0.00001, "mode": "play"}
        kinesis_client.put_record(
            StreamName=STREAM_NAME,
            Data=json.dumps(test),
            PartitionKey="partition-1"
        )
        count = 0

    Data=json.dumps(coordinates)
    print(Data)

    #print(f"Sent: {coordinates}")
    time.sleep(0.5)  #wait 1/2 seconds before going again