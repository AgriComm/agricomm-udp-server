const AWS = require('aws-sdk');
const config = require('./../aws/config.js');
const uuidv1 = require('uuid/v1');

const addNodeReading = function (id, body) {
  AWS.config.update(config.aws_remote_config);
  const docClient = new AWS.DynamoDB.DocumentClient();
  // const Item = body;
  console.log(body);
  var timestamp = new Date().getTime();
  // console.log(timestamp)
  // Item.id = timestamp;
  var params = {
    TableName: config.aws_table_name,
    // Key: { id: `${id}` },
    Item: body,
  };

  // Call DynamoDB to add the item to the table
  docClient.put(params, function (err, data) {
    if (err) {
      console.log('Data upload: FAIL', err);
    } else {
      console.log('Data upload: SUCCESS');
    }
  });
};

const updateNodeReading = function (params) {
  AWS.config.update(config.aws_remote_config);
  const docClient = new AWS.DynamoDB.DocumentClient();
  var timestamp = new Date().getTime();

  var params = {
    TableName: config.aws_table_name,
    ...params,
  };

  // Call DynamoDB to add the item to the table
  docClient.update(params, function (err, data) {
    if (err) {
      console.log('Data upload: FAIL', err);
    } else {
      console.log('Data upload: SUCCESS');
    }
  });
};

// Append location to AgriComm Table
function updateACNode(data) {
  AWS.config.update(config.aws_remote_config);
  var DB = new AWS.DynamoDB.DocumentClient();
  var dt = new Date();
  dt.setTime(dt.getTime() + 2 * 60 * 60 * 1000); // add 2 hours

  return DB.update({
    TableName: config.aws_agricomm_table_name,
    Key: { id: data.id },
    ReturnValues: 'ALL_NEW',
    UpdateExpression:
      'SET #nodeBattery = list_append(if_not_exists(#nodeBattery, :empty_list), :nodeBattery), #solarVoltage = list_append(if_not_exists(#solarVoltage, :empty_list), :solarVoltage), #createdAt = if_not_exists(#createdAt, :createdAt), #typeName = if_not_exists(#typeName, :typeName), #updatedAt = :updatedAt, #nodeType = if_not_exists(#nodeType, :nodeType), #nodeId = if_not_exists(#nodeId, :nodeId)',
    ExpressionAttributeNames: {
      '#nodeBattery': 'nodeBattery',
      '#solarVoltage': 'solarVoltage',
      '#createdAt': 'createdAt',
      '#typeName': '__typename',
      '#nodeId': 'nodeId',
      '#updatedAt': 'updatedAt',
      '#nodeType': 'nodeType',
    },
    ExpressionAttributeValues: {
      ':nodeBattery': [data.nodeBattery],
      ':solarVoltage': [data.solarVoltage],
      ':empty_list': [],
      ':createdAt': dt.toISOString(),
      ':typeName': 'Node',
      ':nodeId': data.nodeId,
      ':updatedAt': dt.toISOString(),
      ':nodeType': 'Network',
    },
  }).promise();
}

// Append location to table
function updateNode(data) {
  AWS.config.update(config.aws_remote_config);
  var DB = new AWS.DynamoDB.DocumentClient();
  var dt = new Date();
  dt.setTime(dt.getTime() + 2 * 60 * 60 * 1000); // add 2 hours

  try {
    return DB.update({
      TableName: config.aws_table_name,
      Key: { id: data.id },
      ReturnValues: 'ALL_NEW',
      UpdateExpression:
        'SET #gps = list_append(if_not_exists(#gps, :empty_list), :gps), #nodeBattery = list_append(if_not_exists(#nodeBattery, :empty_list), :nodeBattery), #solarVoltage = list_append(if_not_exists(#solarVoltage, :empty_list), :solarVoltage),  #current = list_append(if_not_exists(#current, :empty_list), :current), #createdAt = if_not_exists(#createdAt, :createdAt), #typeName = if_not_exists(#typeName, :typeName), #updatedAt = :updatedAt, #nodeType = if_not_exists(#nodeType, :nodeType), #nodeId = if_not_exists(#nodeId, :nodeId)',
      ExpressionAttributeNames: {
        '#gps': 'gps',
        '#nodeBattery': 'nodeBattery',
        '#solarVoltage': 'solarVoltage',
        '#current': 'current',
        '#createdAt': 'createdAt',
        '#typeName': '__typename',
        '#nodeId': 'nodeId',
        '#updatedAt': 'updatedAt',
        '#nodeType': 'nodeType',
      },
      ExpressionAttributeValues: {
        ':gps': [data.gps],
        ':nodeBattery': [data.nodeBattery],
        ':solarVoltage': [data.solarVoltage],
        ':current': [data.current],
        ':empty_list': [],
        ':createdAt': dt.toISOString(),
        ':typeName': 'Node',
        ':nodeId': data.nodeId,
        ':updatedAt': dt.toISOString(),
        ':nodeType': 'GPS',
      },
    }).promise();
  } catch (err) {
    console.log('DynamoDB::');
  }
}

module.exports = {
  addNodeReading,
  updateNodeReading,
  updateNode,
  updateACNode,
};
