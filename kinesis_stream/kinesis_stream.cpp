#include <aws/core/Aws.h>
#include <aws/kinesis/KinesisClient.h>
#include <aws/kinesis/model/PutRecordRequest.h>
#include <aws/core/utils/Outcome.h>
#include <aws/core/utils/json/JsonSerializer.h>
#include <iostream>
#include <thread>
#include <chrono>
#include <sstream>

using namespace Aws;
using namespace Aws::Kinesis;
using namespace Aws::Kinesis::Model;
using namespace Aws::Utils::Json;
using namespace std;

//in /build
//cmake .. -DCMAKE_PREFIX_PATH=~/Desktop/TrackGuide-App-trackguide-map/aws-sdk-install


// Function to generate fake coordinates
pair<double, double> generate_coordinates(double latitude, double longitude) {
    latitude += 0.000001;
    longitude += 0.000001;
    return {latitude, longitude};
}

int main() {
    Aws::SDKOptions options;
    Aws::InitAPI(options);  // Initialize AWS SDK

    {
        KinesisClient kinesisClient;

        string streamName = "CoordinatesStream";
        double latitude = 37.7749;
        double longitude = -122.4194;

        while (true) {
            //gen new coordinates
            auto [new_lat, new_lng] = generate_coordinates(latitude, longitude);
            latitude = new_lat;
            longitude = new_lng;

            //convert coords to JSON
            JsonValue jsonPayload;
            jsonPayload.WithString("latitude", to_string(latitude));
            jsonPayload.WithString("longitude", to_string(longitude));

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
            }
            //this_thread::sleep_for(chrono::seconds(2));  // Wait 2 seconds
        }
    }

    return 0;
}