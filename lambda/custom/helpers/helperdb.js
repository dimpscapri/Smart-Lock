var AWS = require("aws-sdk");

AWS.config.update({
    region: "us-east-1"
});
var dbHelper = function () { };
var table = "smartlock-users";
var docClient = new AWS.DynamoDB.DocumentClient();

dbHelper.prototype.generateAndSendOTP = (id) => {
    return new Promise((resolve, reject) => {
        var mobile;
        var name;
        var otp = Math.floor(1000 + Math.random() * 9000);

        var updateParams = {
            TableName: table,
            Key: {
                "id": id
            },
            UpdateExpression: "set otp = :o",
            ExpressionAttributeValues: {
                ":o": otp,
            },
            ReturnValues: "ALL_NEW"
        };

        console.log("Updating the item...");
        docClient.update(updateParams, function (err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                mobile = data.Attributes.mobile;
                name = data.Attributes.name;
                return resolve({ name, mobile, otp });
            }
        });

    });



};

dbHelper.prototype.validateOTP = (id, otp) => {
    console.log("Inside dbhelper...");
    console.log("id is...." + id);
    console.log("OTP is..." + otp);
    return new Promise((resolve, reject) => {
        var params = {
            TableName: table,
            Key: {
                "id": id
            }
        };
        docClient.get(params, function (err, data) {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                return reject(JSON.stringify(err, null, 2))
            }
            else {
                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                var optfromdb = data.Item.otp;
                console.log("user given otp is " + otp);
                console.log("otp from db is " + optfromdb);
                var success = 'success';
                var failure = 'failure';
                console.log(otp === optfromdb)
                console.log(otp == optfromdb)
                if (otp === optfromdb) {
                    console.log("Inside if condition...");
                    return resolve({ success });
                }
                else {
                    console.log("Inside else condition...")
                    return resolve({ failure });
                }
            }
        });
    });
};

module.exports = new dbHelper();
