
              // // History of location for node
              // let nodePrevLocation = {};
              // let index = 0;
              // let needIt = true;
              // for (let l = 0; l < prevLocation.length; l++) {
              //   if (prevLocation[l].nodeId === node_id) {
              //     index = l;
              //     nodePrevLocation.lat = prevLocation[l].lat;
              //     nodePrevLocation.lng = prevLocation[l].lng;
              //     nodePrevLocation.dateTime = prevLocation[l].dateTime;
              //     needIt = false;
              //   }
              // }

              // if (needIt) {
              //   prevLocation.push({
              //     nodeId: node_id,
              //     lat: parseFloat(lat(gps_data[3], gps_data[4]).toFixed(6)),
              //     lng: parseFloat(lng(gps_data[5], gps_data[6]).toFixed(6)),
              //     dateTime: now,
              //   });
              //   nodePrevLocation.lat = parseFloat(
              //     lat(gps_data[3], gps_data[4]).toFixed(6)
              //   );
              //   nodePrevLocation.lng = parseFloat(
              //     lng(gps_data[5], gps_data[6]).toFixed(6)
              //   );
              //   nodePrevLocation.dateTime = now;
              // }

                            // console.log("Speed: ", speed);

              // console.log("Lat: ", parseFloat(lat(gps_data[3], gps_data[4]).toFixed(6)))

              // let arr = [
              //   nodePrevLocation,
              //   {
              //     lat: latitude,
              //     lng: lng,
              //   },
              // ];
              // // console.log("Array: ", arr)
              // dist = distance(arr);
              // // console.log("Distance: ", dist);
              // // console.log("prevLocation before: ", prevLocation)
              // let timeDiff = (now - nodePrevLocation.dateTime) / 3600000;
              // let calcSpeed = 0;
              // if (timeDiff != 0) {
              //   calcSpeed = dist / timeDiff;
              //   // console.log("Calculated Speed: ", calcSpeed);
              // }
              // let diffSpeed = calcSpeed - speed;

              // console.log(
              //   'Diff in speed: ',
              //   diffSpeed,
              //   ' | Distance: ',
              //   dist,
              //   ' | Speed GPS: ',
              //   speed
              // );

              // if (dist != 0 && lat != 0.0) {
                // prevLocation[index].lat = parseFloat(
                //   lat(gps_data[3], gps_data[4]).toFixed(6)
                // );
                // prevLocation[index].lng = parseFloat(
                //   lng(gps_data[5], gps_data[6]).toFixed(6)
                // );
                // prevLocation[index].dateTime = now;
                // var data1 = {
                //   location: {
                //     location: {
                //       lat: latitude,
                //       lng: longitude
                //     },
                //     date_time: dt.toISOString(),
                //   },
                //   locationPoints: {
                //     lat: latitude,
                //     lng: longitude
                //   },
                //   speed: parseFloat((1.85 * gps_data[7]).toFixed(2)),
                //   heatmap: {
                //     location: {
                //       lat: latitude,
                //       lng: longitude
                //     },
                //     weight: heatWeight,
                //   },
                //   heading: parseFloat(gps_data[8]),
                // };