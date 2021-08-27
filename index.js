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
    let time_new = new Date();
    // let time_format = time_now.format("dd mmm yyyy hh:MMtt")
    let diff = (time_now - time) / 60000;
    let avg_occ = count / diff;
    let body = '' + msg;
    //Split sting into the nodes/readings
    // console.log('Body: ', body);
    let readings = body.split('AA');
    // console.log(readings);

    let incomeData = {}

    for (let i = 1; i < readings.length; i++) {
      let readingTime = Date.now();
      let payload = readings[i].split('00FF00FF');
      let uploadData = {};
      // console.log("Payload: ", payload);
      //Get the node_id from
      let node_id = parseInt(payload[0], 16);
      // console.log(`${node_id}:${time_new.getUTCFullYear()}:${time_new.getMonth()+1}:${time_new.getDate()}`)

      // let id = ;
      // console.log("ID: ", id)

      // console.log("node ID: ", node_id)
      // Get function_id:

      const now = new Date();
      now.setHours(now.getHours() + 2);
      uploadData.id = `${node_id}:${time_new.getUTCFullYear()}:${
        time_new.getMonth() + 1
      }:${time_new.getDate()}`;
      uploadData.nodeId = node_id;
      // uploadData.dateTime = now.toISOString();
      // uploadData.updatedAt = now.toISOString();
      // uploadData.createdAt = now.toISOString();
      uploadData.__typename = 'Node';

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

            // var data_batt = {
            //   value: voltage
            // };
            uploadData.nodeBattery = {
              value: parseFloat(voltage),
              dateTime: now.toISOString(),
            };

            // DynamoDB.appendNodeBatt(`${node_id}`, data_batt);
            break;

          case 2: // Solar Panel voltage
            let a = parseInt(`${sensor_reading}`, 16);
            let solar_vol = ((8 / Math.pow(2, 10)) * a).toFixed(2);
            uploadData.solarVoltage = {
              value: parseFloat(solar_vol),
              dateTime: now.toISOString(),
            };
            break;

          case 4: // GPS
            // Documentation: http://aprs.gids.nl/nmea/
            let gps = '';
            console.log('GPS Sensor Reading:', sensor_reading);

            for (let l = 0; l < sensor_reading.length; l = l + 2) {
              let acii = hex2a(`${sensor_reading.slice(l, l + 2)}`);
              gps = gps + acii;
            }

            if (gps != '') {
              gps_data = gps.split(',');
              // console.log('Gps Data: ', gps_data);
              // console.log("Validity: ", gps_data[2])

              // Only push when the validity of the GPS is "A"
              // console.log('GPS Data:', gps);
              // console.log('GPS Precision Value: ', gps_data[2]);
              if (gps_data[2] === 'A') {
                uploadData.nodeType = 'GPS'; // Shows that the line in the db has gps values
                // console.log("A Okay")
                let latitude = parseFloat(
                  lat(gps_data[3], gps_data[4]).toFixed(6)
                );
                let longitude = parseFloat(
                  lng(gps_data[5], gps_data[6]).toFixed(6)
                );
                let speed = parseFloat((1.85 * gps_data[7]).toFixed(2));
                let heatWeight = 0;

                // Calc Heat Weight
                if (speed <= 10) {
                  heatWeight = 0;
                } else if (speed >= 10) {
                  heatWeight = 1;
                } else if (speed >= 20) {
                  heatWeight = 2;
                } else if (speed >= 30) {
                  heatWeight = 3;
                }

                uploadData.gps = {
                  location: {
                    lat: latitude,
                    lng: longitude,
                  },
                  speed: speed,
                  heatWeight: heatWeight,
                  dateTime: now.toISOString(),
                };
              }

              console.log("GPS Data:", uploadData.gps)

              // var dt = new Date();
              // dt.setTime(dt.getTime() + 2 * 60 * 60 * 1000);

              // DynamoDB.appendLocation(`${node_id}`, data1);
              break;
              // }
            }

          case 3: // Current Sensor
            let threshold = 0.1;
            let maxScale = 12; // Sensor full range = 12 A
            // console.log("Sensor Reading",parseFloat(sensor_reading))
            let sensorCurrent = sensor_reading * (maxScale / 1024);
            uploadData.current = {
              value: sensorCurrent,
              dateTime: now.toISOString(),
            };
            // console.log('Current Sensor:', uploadData);

            // if (sensorCurrent >= threshold) {
            //   uploadData.gps.on = true;
            // } else {
            //   uploadData.gps.on = false;
            // }

            break;
        }
      }

      // console.log('Upload Data: ', uploadData);
      if (uploadData.nodeId > 60928) {
        DynamoDB.updateACNode(uploadData); //AgriComm Network
        incomeData.network = uploadData;
      } else {
        DynamoDB.updateNode(uploadData);
        incomeData.node = uploadData
      }
    }
    // console.log("Income Data: ",incomeData);

    // server.send(msg, senderInfo.port, senderInfo.address, () => {
    //   console.log(`Message sent to ${senderInfo.address}:${senderInfo.port}`);
    // });
  } catch (err) {
    console.log(err);
    let url =
      'https://discord.com/api/webhooks/805085262337933332/D9Jn_IOBz134Qh-aVwJhPHk-kWSXDVvlym2TjCC8J35q1D6xAQbfdUdNTGtJlUmnbyhV';
    let message = `Body: ${body} | Error: ${err}`;
    discord_message(url, message);
  }
});

server.on('listening', () => {
  const address = server.address();
  console.log(`server listening on ${address.address}:${address.port}`);
});

server.bind(5500);

function discord_message(webHookURL, message) {
  var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
  var xhr = new XMLHttpRequest();
  xhr.open('POST', webHookURL, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(
    JSON.stringify({
      content: message,
      username: 'EC2 - Server',
    })
  );
}

// Current function 05
