#include <aws/core/Aws.h>
#include <aws/kinesis/KinesisClient.h>
#include <aws/kinesis/model/PutRecordRequest.h>
#include <aws/core/utils/Outcome.h>
#include <aws/core/utils/json/JsonSerializer.h>
#include <iostream>
#include <thread>
#include <chrono>

using namespace Aws;
using namespace Aws::Kinesis;
using namespace Aws::Kinesis::Model;
using namespace Aws::Utils::Json;
using namespace std;

//in /build
//cmake .. -DCMAKE_PREFIX_PATH=~/Desktop/TrackGuide-App-trackguide-map/aws-sdk-install
int first = 0;
//generate fake coords
JsonValue generate_coordinates(double latitude, double longitude) {
    if(first == 0){
        double threshold = 0.00001;
        Aws:String jsonString = R"({"mode":"replay"})";
        JsonValue threshjson(jsonString);
        threshjson.WithDouble("threshold", threshold);
        first = first+1;
        return threshjson;
    }
    first += 1;

    if (first < 20){
        latitude += 0.000005;
    }
    else if(first < 40) {
        longitude -= 0.000005;
    }
    else if(first < 60){
        latitude -= 0.000005;
    }
    else{
        longitude +=0.000005;
    }

    JsonValue json;
    json.WithDouble("latitude", latitude);
    json.WithDouble("longitude", longitude);
    
    return json;
}

//message one (on event[button change])
// thresh, mode(record, play, bound reset, line reset)

//continually send message 2
//lat, long


int main() {
    JsonValue jsonPayload;

    //Aws:String jsonString = R"({"longitude":12.2554, "latitude":32.421})";
    //Aws:String jsonString = R"({"threshold": 12.3, "mode":"replay"})";

    //JsonValue json(jsonString);
    Aws::SDKOptions options;
    Aws::InitAPI(options);  //init AWS SDK

    KinesisClient kinesisClient;

    string streamName = "CoordinatesStream";
    double latitude = 42.393489;
    double longitude = -72.529097;

    while (true) {
        //convert coords to JSON
         //gen new coordinates
        JsonValue jsonResult = generate_coordinates(latitude, longitude);
        Aws::String jsonString = jsonResult.View().WriteReadable();


        if (jsonResult.WasParseSuccessful()){
            JsonView jsonView = jsonResult.View();

            if (jsonView.ValueExists("threshold")){
                jsonPayload = JsonValue(); //clear payload
                jsonPayload.WithString("threshold", to_string(jsonView.GetDouble("threshold")));
                jsonPayload.WithString("mode", jsonView.GetString("mode"));
            }
            else{
                jsonPayload = JsonValue(); //clear payload
                jsonPayload.WithString("latitude", to_string(jsonView.GetDouble("latitude")));
                jsonPayload.WithString("longitude", to_string(jsonView.GetDouble("longitude")));

                latitude = jsonView.GetDouble("latitude");
                longitude = jsonView.GetDouble("longitude");
            }

            Aws::String jsonStr = jsonPayload.View().WriteCompact();

            //prepare kinesis
            PutRecordRequest request;
            request.SetStreamName(streamName);
            request.SetData(Aws::Utils::ByteBuffer((unsigned char*)jsonStr.c_str(), jsonStr.length()));
            request.SetPartitionKey("partition-1");

            //send data to kinesis
            auto outcome = kinesisClient.PutRecord(request);


            if (outcome.IsSuccess()) {
                cout << "Sent: " << jsonStr << endl;
            }else{
                cout << "Error: " << outcome.GetError().GetMessage() << endl;
            }
        }
        this_thread::sleep_for(chrono::seconds(1));  // Wait 2 seconds
    }
    

    return 0;
}