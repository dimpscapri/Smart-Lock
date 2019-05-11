var mqtt = require('mqtt')
var options = {
    username: 'smartlock',
    password: 'smartlock12345',
    port: 18872
}



var mqttHelper = function () { };

mqttHelper.prototype.doorCommand = (command) => {

    return new Promise((resolve, reject) => {
        var client = mqtt.connect('mqtt://postman.cloudmqtt.com', options)
        client.on('connect', function () {
            console.log("MQTT connection is created")

            if (command === 'open') {
                client.publish('door', '1');
                client.end();
                return resolve({ 'success': 'door opened' });
            }
            else if (command === 'close') {
                client.publish('door', '0');
                client.end();
                return resolve({ 'success': 'door closed' })
            }
            else {
                console.log('There is some error in MQTT...')
                client.end();
                return reject('Error while executing MQTT Helper')
            }
        })
    })



}

module.exports = new mqttHelper();


