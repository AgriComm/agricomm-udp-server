const dgram = require('dgram');
const server = dgram.createSocket('udp4');
const DynamoDB = require('./utils/dynamodb_node');

const time = Date.now();
let count = 0;
let prevLocation = [];

// Functions
function hex2a(hexx) {
  var hex = hexx.toString(); //force conversion
  var str = '';
  for (var i = 0; i < hex.length && hex.substr(i, 2) !== '00'; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

function lat(t, dir) {
  // console.log(t)
  let lat = Number(t.slice(0, 2)) + Number(t.slice(2, 9)) / 60;
  if (dir == 'S') {
    lat = lat * -1;
  }
  return lat;
}

function lng(g, dir) {
  let lng = Number(g.slice(0, 3)) + Number(g.slice(3, 10)) / 60;
  if (dir == 'W') {
    lng = lng * -1;
  }
  return lng;
}

function distance(polyline_array) {
  // console.log("Function Array: ", polyline_array);
  var distanceTotal = 0;
  for (var i = 0; i < polyline_array.length - 1; i++) {
    var radlat1 = (Math.PI * polyline_array[i].lat) / 180;
    var radlat2 = (Math.PI * polyline_array[i + 1].lat) / 180;
    var theta = polyline_array[i].lng - polyline_array[i + 1].lng;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    dist = dist * 1.609344;
    // console.log("Distance: ", dist);
    if (dist >= 0.01) {
      distanceTotal += dist;
    }
  }
  return distanceTotal;
}

server.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  server.close();
});

server.on('message', (msg, senderInfo) => {
  try {
    //Define body
    count++;
    let time_now = Date.now();
    let diff = (time_now - time) / 60000;
    let avg_occ = count / diff;
    let body = '' + msg;
    //Split sting into the nodes/readings
    console.log("Body: ", body);
    let readings = body.split('AA');
    // console.log(readings);

    for (let i = 1; i < readings.length; i++) {
      let payload = readings[i].split('00FF00FF');
      // console.log("Payload: ", payload);
      //Get the node_id from
      let node_id = parseInt(payload[0], 16);
      // console.log("node ID: ", node_id)
      // Get function_id:

      const now = new Date();
      now.setHours(now.getHours() + 2);

      let data = {
        date_time: now.toISOString(),
        node_id: node_id,
        avg_calls: avg_occ,
      };

      for (let k = 1; k < payload.length; k++) {
        let function_id = parseInt(payload[k].slice(0, 2), 8);
        // console.log("function ID: ", function_id);
        let sensor_reading = payload[k].slice(2, payload[k].length);
        // console.log("sensor reding: ", sensor_reading);

        switch (function_id) {
          case 1: // Node batt
            let x = parseInt(`${sensor_reading}`, 16);
            // const max_dec = 1024;
            let voltage = ((8 / Math.pow(2, 10)) * x).toFixed(2);
            // console.log("Node Batt Voltage: ", voltage, " V");

            var dt = new Date();
            dt.setTime(dt.getTime() + 2 * 60 * 60 * 1000);

            var data_batt = {
              date_time: dt.toISOString(),
              value: voltage,
            };

            DynamoDB.appendNodeBatt(`${node_id}`, data_batt);
            break;

          case 2: // Solar Panel voltage
            let a = parseInt(`${sensor_reading}`, 16);
            let solar_vol = ((8 / Math.pow(2, 10)) * a).toFixed(2);
            break;

          case 4: // GPS
            let gps = '';

            for (let l = 0; l < sensor_reading.length; l = l + 2) {
              let acii = hex2a(`${sensor_reading.slice(l, l + 2)}`);
              gps = gps + acii;
            }

            if (gps != '') {
              gps_data = gps.split(',');

              // History of location for node
              let nodePrevLocation = {};
              let index = 0;
              let needIt = true;
              for (let l = 0; l < prevLocation.length; l++) {
                if (prevLocation[l].nodeId === node_id) {
                  index = l;
                  nodePrevLocation.lat = prevLocation[l].lat;
                  nodePrevLocation.lng = prevLocation[l].lng;
                  nodePrevLocation.dateTime = prevLocation[l].dateTime;
                  needIt = false;
                }
              }

              if (needIt) {
                prevLocation.push({
                  nodeId: node_id,
                  lat: parseFloat(lat(gps_data[3], gps_data[4]).toFixed(6)),
                  lng: parseFloat(lng(gps_data[5], gps_data[6]).toFixed(6)),
                  dateTime: now,
                });
                nodePrevLocation.lat = parseFloat(
                  lat(gps_data[3], gps_data[4]).toFixed(6)
                );
                nodePrevLocation.lng = parseFloat(
                  lng(gps_data[5], gps_data[6]).toFixed(6)
                );
                nodePrevLocation.dateTime = now;
              }

              var dt = new Date();
              dt.setTime(dt.getTime() + 2 * 60 * 60 * 1000);

              var heatWeight = 0;
              var speed = parseFloat((1.85 * gps_data[7]).toFixed(2));

              // console.log("Speed: ", speed);

              if (speed === 10) {
                heatWeight = 0;
              } else if (speed >= 30) {
                heatWeight = 1;
              } else if (speed >= 20) {
                heatWeight = 2;
              } else if (speed >= 30) {
                heatWeight = 3;
              }

              let test = parseFloat(lat(gps_data[3], gps_data[4]).toFixed(6));

              let arr = [
                nodePrevLocation,
                {
                  lat: parseFloat(lat(gps_data[3], gps_data[4]).toFixed(6)),
                  lng: parseFloat(lng(gps_data[5], gps_data[6]).toFixed(6)),
                },
              ];
              // console.log("Array: ", arr)
              dist = distance(arr);
              // console.log("Distance: ", dist);
              // console.log("prevLocation before: ", prevLocation)
              let timeDiff = (now - nodePrevLocation.dateTime) / 3600000;
              let calcSpeed = 0;
              if (timeDiff != 0) {
                calcSpeed = dist / timeDiff;
                // console.log("Calculated Speed: ", calcSpeed);
              }
              let diffSpeed = calcSpeed - speed;

              console.log(
                'Diff in speed: ',
                diffSpeed,
                ' | Distance: ',
                dist,
                ' | Speed GPS: ',
                speed
              );

              if (dist != 0 && test != 0.0) {
                prevLocation[index].lat = parseFloat(
                  lat(gps_data[3], gps_data[4]).toFixed(6)
                );
                prevLocation[index].lng = parseFloat(
                  lng(gps_data[5], gps_data[6]).toFixed(6)
                );
                prevLocation[index].dateTime = now;
                var data1 = {
                  location: {
                    location: {
                      lat: parseFloat(lat(gps_data[3], gps_data[4]).toFixed(6)),
                      lng: parseFloat(lng(gps_data[5], gps_data[6]).toFixed(6)),
                    },
                    date_time: dt.toISOString(),
                  },
                  locationPoints: {
                    lat: parseFloat(lat(gps_data[3], gps_data[4]).toFixed(6)),
                    lng: parseFloat(lng(gps_data[5], gps_data[6]).toFixed(6)),
                  },
                  speed: parseFloat((1.85 * gps_data[7]).toFixed(2)),
                  heatmap: {
                    location: {
                      lat: parseFloat(lat(gps_data[3], gps_data[4]).toFixed(6)),
                      lng: parseFloat(lng(gps_data[5], gps_data[6]).toFixed(6)),
                    },
                    weight: heatWeight,
                  },
                  heading: parseFloat(gps_data[8]),
                };

                DynamoDB.appendLocation(`${node_id}`, data1);
                break;
              }
            }

          // case 3: // Node Temp

          //   break;
        }
      }
    }

    server.send(msg, senderInfo.port, senderInfo.address, () => {
      console.log(`Message sent to ${senderInfo.address}:${senderInfo.port}`);
    });
  } catch (err) {
    console.error(err);
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening on ${address.address}:${address.port}`);
});

server.bind(5500);
