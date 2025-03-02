/* 
    
    This file is the first initialized when running relys on ./server/server.js
    for the backend. 

    This file is responsible for initializing the map, and printing the line of coordinates
    recieved from ./server/server.js

    run 1st command: http-server -p 3000

*/

//init for map (random values)
const map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 37.7749, lng: -122.4194 },  // Default location: San Francisco
    zoom: 15  // Zoom level
  });
  
  // instantitaing array that holds path coordinates
  let pathCoordinates = [];
  
  // connecting websocket to server.js
  const socket = new WebSocket('ws://localhost:8080');  // if we end up doing a website replace localhost w/ url (server.js url)
  
  //opens websocket
  socket.onopen = function () {
    console.log('WebSocket connection established');
  };
  
  // When WebSocket receives a message
  socket.onmessage = function (event) {
    const message = JSON.parse(event.data);  // Parse the incoming message
    const latitude = parseFloat(message.latitude);  // Get latitude from the message
    const longitude = parseFloat(message.longitude);  // Get longitude from the message
  
    console.log(`Received coordinates: Latitude = ${latitude}, Longitude = ${longitude}`);
  
    //add the new coordinates to the path
    pathCoordinates.push({ lat: latitude, lng: longitude }); //adding the new coordinates to the path
  
    // Update the polyline with the new path
    const polyline = new google.maps.Polyline({
      path: pathCoordinates,  // update path with new coordinates
      geodesic: true,  // enable geodesic
      strokeColor: '#FF0000',  //color (red)
      strokeOpacity: 1.0,  //opacity
      strokeWeight: 2  //line thickness
    });

    //set the polyline on the map
    polyline.setMap(map);

    //update the LatLngBounds with the new coordinate
    bounds.extend(new google.maps.LatLng(latitude, longitude));

    map.fitBounds(bounds); // adjust the map's view to fit the coordinates

  };
  
  


  socket.onerror = function (error) { // handle WebSocket errors
    console.log(`WebSocket error: ${error.message}`); 
  };
  

  socket.onclose = function () {   // handle WebSocket closure
    console.log('WebSocket connection closed');
  };
