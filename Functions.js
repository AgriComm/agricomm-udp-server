function hex2a(hexx) {
    var hex = hexx.toString(); //force conversion
    var str = "";
    for (var i = 0; i < hex.length && hex.substr(i, 2) !== "00"; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
  }
  
  function lat(t, dir) {
    // console.log(t)
    let lat = Number(t.slice(0, 2)) + Number(t.slice(2, 9)) / 60;
    if (dir == "S") {
      lat = lat * -1;
    }
    return lat;
  }
  
  function lng(g, dir) {
    let lng = Number(g.slice(0, 3)) + Number(g.slice(3, 10)) / 60;
    if (dir == "W") {
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

