// This file takes the kinesis coordinate stream and sends it to the front-end through websockets

// Need AWS CLI to create stream
// to create client use:

// aws kinesis create-stream --stream-name CoordinatesStream --shard-count 1 --region us-east-1
// might need to run:     aws configure if aws cli is not set up yet

// #### modules I needed to install for it work ####
//          npm install aws-sdk
//          npm install @aws-sdk/client-kinesis-node 
//          npm install ws
//          pip install boto3, for python file stream.py

//  To run project do these commands in different terminals
//  http-server -p 3000
//  node server.js
//  python stream.py

const { KinesisClient, GetShardIteratorCommand, GetRecordsCommand } = require("@aws-sdk/client-kinesis-node");
const WebSocket = require("ws");

// set needed data for kinesis stream
const STREAM_NAME = "CoordinatesStream";
const REGION = "us-east-1";
const SHARD_ID = "shardId-000000000000"; // only need one shard

// init kinesis
const kinesisClient = new KinesisClient({ region: REGION });

//init websockets
const wsServer = new WebSocket.Server({ port: 8080 });
console.log("WebSocket server running on ws://localhost:8080");

const clients = [];

// connect web socket
wsServer.on("connection", (ws) => {
    clients.push(ws);
    console.log("New WebSocket client connected");

    ws.on("close", () => {
        clients.splice(clients.indexOf(ws), 1);
    });
});

function forwardToFront(latitude, longitude) {
    //function sends coordinates to front end

    const message = JSON.stringify({ latitude, longitude });
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}


async function getShardIterator() {
    //connects to kinesis stream
    const params = {
        StreamName: STREAM_NAME,
        ShardId: SHARD_ID,
        ShardIteratorType: "LATEST",
    };

    const command = new GetShardIteratorCommand(params);
    const response = await kinesisClient.send(command);
    return response.ShardIterator;
}

async function readFromStream() {
    // function pulls coordinates from kinesis stream

    let shardIterator = await getShardIterator();

    while (true) {
        const recordsParams = { ShardIterator: shardIterator };
        const command = new GetRecordsCommand(recordsParams);
        const response = await kinesisClient.send(command);

        //reads data, prints data, then sends to front-end
        response.Records.forEach((record) => {
            const data = JSON.parse(Buffer.from(record.Data, "base64").toString());
            console.log("Received from Kinesis:", data);
            forwardToFront(data.latitude, data.longitude);
        });

        //update to next datapoint
        shardIterator = response.NextShardIterator;

        //wait one second then accept next coord
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
}

// start reading stream
readFromStream().catch(console.error);