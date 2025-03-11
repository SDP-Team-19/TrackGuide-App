/*

    This file is the first initialized when running relys on ./server/server.js
    for the backend.

    This file is responsible for initializing the map, and printing the line of coordinates
    recieved from ./server/server.js

    run 1st command: http-server -p 3000

*/
let pathCoordinates = [];
let leftCoordinates = [];
let rightCoordinates = [];
let oldCoordinates = [];


//init for map
const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 42.393489, lng: -72.529097 },  // Location: UMass Engineering Quad
    zoom: 20  // Zoom level
});


  // Update the polyline with the new path
const polyline = new google.maps.Polyline({
  path: pathCoordinates,  // update path with new coordinates
  geodesic: true,  // enable geodesic
  strokeColor: '#FF0000',  //color (red)
  strokeOpacity: 1.0,  //opacity
  strokeWeight: 2 //line thickness
});

const right_line = new google.maps.Polyline({
  path: rightCoordinates,  // update path with new coordinates
  geodesic: true,  // enable geodesic
  strokeColor: '#006400',  //color (green)
  strokeOpacity: 0.75,  //opacity
  strokeWeight: 1  //line thickness
});

const left_line = new google.maps.Polyline({
  path: leftCoordinates,  // update path with new coordinates
  geodesic: true,  // enable geodesic
  strokeColor: '#006400',  //color (green)
  strokeOpacity: 0.75,  //opacity
  strokeWeight: 1  //line thickness
});


//set the polyline on the map
polyline.setMap(map);
right_line.setMap(map);
left_line.setMap(map);

// connecting websocket to server.js
const socket = new WebSocket('ws://localhost:8080');  // if we end up doing a website replace localhost w/ url (server.js url)

//opens websocket
socket.onopen = function () {
  console.log('WebSocket connection established');
};

let threshold = 0.0001;

// When WebSocket receives a message
socket.onmessage = function (event) {
  const message = JSON.parse(event.data);  // Parse the incoming message
  console.log(message);

  if(message.hasOwnProperty("threshold")){
      threshold = message.threshold;
      mode = message.mode;

      if(mode ==  "bound_reset"){
        leftCoordinates = [];
        rightCoordinates = [];
      }
      if(mode == "line_reset"){
        oldCoordinates = pathCoordinates.slice(); 
        pathCoordinates = [];
      }

      if (mode == "replay"){
        if (oldCoordinates.length === 0){
          oldCoordinates = pathCoordinates.slice();
        }
        for(let i = 0; i < oldCoordinates.length; i++){
          pathCoordinates.push(oldCoordinates[i]);
        }
      }

      //console.log("Received from Threshold:", message.threshold);
      //console.log("Received from Threshold:", message.mode);
  } else {
      const latitude = parseFloat(message.latitude);  // Get latitude from the message
      const longitude = parseFloat(message.longitude);  // Get longitude from the message
      let newPoint = {lat: latitude, lng: longitude};
      if (mode == "record"){
        record(newPoint, threshold);
      }
      if (mode=="play"){
        pathCoordinates.push(newPoint);
      }


      //console.log(Received coordinates: Latitude = ${latitude}, Longitude = ${longitude});

      //add the new coordinates to the path
      //pathCoordinates.push({ lat: latitude, lng: longitude }); //adding the new coordinates to the path
      //Coordinates.push({lat: latitude+threshold, lng: longitude+threshold});


      polyline.setPath(pathCoordinates);
      right_line.setPath(rightCoordinates);
      left_line.setPath(leftCoordinates);
      console.log("Updated pathCoordinates:", pathCoordinates);
      console.log("Updated leftCoordinates:", leftCoordinates);
      console.log("Updated rightCoordinates:", rightCoordinates);
  }

  //update the LatLngBounds with the new coordinate
  //bounds.extend(new google.maps.LatLng(latitude, longitude));

  //map.fitBounds(bounds); // adjust the map's view to fit the coordinates

};

socket.onerror = function (error) { // handle WebSocket errors
  console.log( `WebSocket error: ${error.message}`);
};

socket.onclose = function () {   // handle WebSocket closure
  console.log('WebSocket connection closed');
};


function record(newPoint, threshold) {
  if (pathCoordinates.length > 0) {
    let lastPoint = pathCoordinates[pathCoordinates.length - 1];

    // Compute direction angle from last point to new point
    let dx = newPoint.lng - lastPoint.lng;
    let dy = newPoint.lat - lastPoint.lat;
    let angle = Math.atan2(dy, dx);

    // Compute perpendicular vector (rotate by 90 degrees counterclockwise)
    let lngOffset = threshold * Math.sin(angle);  // Swap sin and cos
    let latOffset = -threshold * Math.cos(angle); // Negate cos to keep left/right correct

    // Add new points to left and right paths (keeping left & right consistently placed)
    leftCoordinates.push({ lat: newPoint.lat + latOffset, lng: newPoint.lng + lngOffset });
    rightCoordinates.push({ lat: newPoint.lat - latOffset, lng: newPoint.lng - lngOffset });
  }

  // Add new coordinate to path
  pathCoordinates.push(newPoint);
}



