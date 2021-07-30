const AWS = require('aws-sdk');
const config = require('./../aws/config.js');
const uuidv1 = require('uuid/v1');



const addNodeReading = function (id, body) {
    AWS.config.update(config.aws_remote_config);
    const docClient = new AWS.DynamoDB.DocumentClient();
    // const Item = body;
    console.log(body)
    var timestamp = new Date().getTime();
    // console.log(timestamp)
    // Item.id = timestamp;
    var params = {
        TableName: config.aws_table_name,
        // Key: { id: `${id}` },
        Item: body
    };

    // Call DynamoDB to add the item to the table
    docClient.put(params, function (err, data) {
        if (err) {
            console.log("Data upload: FAIL", err)
        } else {
            console.log("Data upload: SUCCESS")
        }
    });
}

const updateNodeReading = function (params) {
    AWS.config.update(config.aws_remote_config);
    const docClient = new AWS.DynamoDB.DocumentClient();
    var timestamp = new Date().getTime();

    var params = {
        TableName: config.aws_table_name,
        ...params
    }

    // Call DynamoDB to add the item to the table
    docClient.update(params, function (err, data) {
        if (err) {
            console.log("Data upload: FAIL", err)
        } else {
            console.log("Data upload: SUCCESS")
        }
    });
}

// Append location to table
function appendLocation (node_Id, data) {
    AWS.config.update(config.aws_remote_config);
    var DB = new AWS.DynamoDB.DocumentClient()
    var dt = new Date();
    dt.setTime(dt.getTime() + (2*60*60*1000)) // add 2 hours

    return DB.update({
        TableName: config.aws_table_name,
        Key: { id: node_Id },
        ReturnValues: 'ALL_NEW',
        UpdateExpression: 'SET #locationPoints = list_append(if_not_exists(#locationPoints, :empty_list), :locationPoints), #location = :location, #speed = :speed, #createdAt = if_not_exists(#createdAt, :createdAt), #typeName = if_not_exists(#typeName, :typeName), #updatedAt = :updatedAt, #nodeName = if_not_exists(#nodeName, :nodeName), #nodeType = if_not_exists(#nodeType, :nodeType) , #farmerId = if_not_exists(#farmerId, :farmerId)  ',
        ExpressionAttributeNames: {
        '#locationPoints': 'locationPoints',
        '#location': 'location',
        '#createdAt': 'createdAt',
        '#typeName': '__typename',
        '#updatedAt': 'updatedAt',
        '#nodeName': 'nodeName',
        '#farmerId': 'farmerId',
        '#nodeType': 'nodeType',
        '#speed': 'speed'
        },
        ExpressionAttributeValues: {
        ':locationPoints': [data.locationPoints],
        ':empty_list': [],
        ':createdAt': dt.toISOString(),
        ':location': data.location,
        ':typeName': 'Node',
        ':nodeName': 'AgriComm',
        ':speed': data.speed,
        ':farmerId': '0',
        ':updatedAt': dt.toISOString(),
        ':nodeType': 'GPS',
        }
    }).promise()
}

//Append or create batt values
function appendNodeBatt (node_Id, nodeBatt) {
    AWS.config.update(config.aws_remote_config);
    var DB = new AWS.DynamoDB.DocumentClient()
    var dt = new Date();
    dt.setTime(dt.getTime() + (2*60*60*1000)) // add 2 hours

    return DB.update({
        TableName: config.aws_table_name,
        Key: { id: node_Id },
        ReturnValues: 'ALL_NEW',
        UpdateExpression: 'SET #nodeBatt = list_append(if_not_exists(#nodeBatt, :empty_list), :nodeBatt), #createdAt = if_not_exists(#createdAt, :createdAt), #typeName = if_not_exists(#typeName, :typeName), #updatedAt = :updatedAt ',
        ExpressionAttributeNames: {
        '#nodeBatt': 'nodeBatt',
        '#createdAt': 'createdAt',
        '#typeName': '__typename',
        '#updatedAt': 'updatedAt'
        },
        ExpressionAttributeValues: {
        ':nodeBatt': [nodeBatt],
        ':empty_list': [],
        ':createdAt': dt.toISOString(),
        ':typeName': 'Node',
        ':updatedAt': dt.toISOString()
        }
    }).promise()
}



module.exports = {
    addNodeReading,
    updateNodeReading,
    appendLocation,
    appendNodeBatt
}