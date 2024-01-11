require('dotenv').config()
const http = require('http');
const express =  require('express');
const cors = require('cors');
const app = express();
const Aedes = require('aedes');
const { createServer } = require('net')
const { spawn } = require('child_process');


app.use(cors());
app.use(express.json());

const HTTPserver = http.createServer(app);

const MQTTPort = 8883

const aedes = Aedes();

const MQTTserver = createServer(aedes.handle)

let pir_sensor = {
  id: process.env.PIR_SENSOR_DEVICE_ID,
  args: ['-u', 'handler.py', process.env.PIR_SENSOR_DEVICE_ID, process.env.PIR_SENSOR_UUID, process.env.PIR_SENSOR_AUTHKEY]
}

let door_sensor = {
  id: process.env.DOOR_SENSOR_DEVICE_ID,
  args: ['-u', 'handler.py', process.env.DOOR_SENSOR_DEVICE_ID, process.env.DOOR_SENSOR_UUID, process.env.DOOR_SENSOR_AUTHKEY]
}


function  startBroker () {


  MQTTserver.listen(MQTTPort, function () {
    console.log('Aedes listening on port:', MQTTPort)
  })

  MQTTserver.on('error', function (err) {
    console.log('Server error', err)
    process.exit(1)
  })

  aedes.on('subscribe', function (subscriptions, client) {
    console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
            '\x1b[0m subscribed to topics: ' + subscriptions.map(s => s.topic).join('\n'), 'from broker', aedes.id)
  })

  aedes.on('unsubscribe', function (subscriptions, client) {
    console.log('MQTT client \x1b[32m' + (client ? client.id : client) +
            '\x1b[0m unsubscribed to topics: ' + subscriptions.join('\n'), 'from broker', aedes.id)
  })

  // fired when a client connects
  aedes.on('client', function (client) {
    console.log('Client Connected: \x1b[33m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
  })

  // fired when a client disconnects
  aedes.on('clientDisconnect', function (client) {
    console.log('Client Disconnected: \x1b[31m' + (client ? client.id : client) + '\x1b[0m', 'to broker', aedes.id)
  })

  // fired when a message is published
  aedes.on('publish', async function (packet, client) {
   // console.log('Client \x1b[31m' + (client ? client.id : 'BROKER_' + aedes.id) + '\x1b[0m has published', packet.payload.toString(), 'on', packet.topic, 'to broker', aedes.id)
   if(packet.topic.endsWith('get')){
    let deviceId = packet.topic.split('/')[1];
    process.stdout.write(`${deviceId}|sender:`+packet.payload.toString());
   }
  })
}

function main() {

  var pir_sensor_worker = spawn('python3', pir_sensor.args);
  var door_sensor_worker = spawn('python3', door_sensor.args);

  pir_sensor_worker.stderr.setEncoding('utf8');
  pir_sensor_worker.stderr.on('data', function (data) {
    console.log(data);
  });

  
  pir_sensor_worker.stdout.setEncoding('utf8');
  pir_sensor_worker.stdout.on('data', function(data) {
      if(data.includes('receiver')){
        let payload = data.split('receiver:')[1];
        aedes.publish({ topic: `device/${pir_sensor.id}/set`, payload })
      }
      console.log(data);
  });

  door_sensor_worker.stderr.setEncoding('utf8');
  door_sensor_worker.stderr.on('data', function (data) {
    console.log(data)
  });

  door_sensor_worker.stdout.setEncoding('utf8');
  door_sensor_worker.stdout.on('data', function(data) {
      console.log(data);
  });

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  })
  
  const port = process.env.PORT || 9000;
  
  HTTPserver.listen(port, () => { 
    console.log(`Server is up and running on Port ${port}`);

    startBroker();
  });
}


 main();