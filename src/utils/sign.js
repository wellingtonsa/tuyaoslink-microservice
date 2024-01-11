const crypto = require('crypto');
const { Buffer } = require('buffer');


 function getInfo(productKey, deviceId, deviceSecret) {
  if (!productKey || !deviceId || !deviceSecret) {
    return;
  }

  try {
    const timestamp = Date.now().toString();
    // MQTT username
    let username = `${deviceId}|signMethod=hmacSha256,timestamp=${timestamp},secureMode=1,accessType=1`;
    // MQTT clientId
    let clientId = `tuyalink_${deviceId}`;
    const plainPasswd = `deviceId=${deviceId},timestamp=${timestamp},secureMode=1,accessType=1`;
    console.log(`plainPasswd= ${plainPasswd}`);
    // MQTT password
    let password = hmacSha256(plainPasswd, deviceSecret);

    return { username, clientId, password }
  } catch (e) {
    console.error(e);
  }
}

function getInfoMQTT(uuid, authKey){
  let clientId = 'acon_' +  uuid;
  let username = 'acon_' + uuid;
  let password =  md5(authKey).slice(8, 8 + 8 * 2);
  let topicIn = 'd/ai/' + uuid;

  return { clientId, username, password, topicIn }
}

function hmacSha256(plainText, key) {
  // Zero filling less than 64 characters
  return hmac(plainText, key, 'sha256', 'hex', 64);
}

function hmac(plainText, key, algorithm, encoding, length) {
  if (!plainText || !key) {
    return null;
  }
  const hmac = crypto.createHmac(algorithm, key);
  const digest = hmac.update(plainText).digest(encoding);
  return length ? zeroFill(digest, length) : digest;
}

function md5(input) {
  return crypto.createHash('md5').update(input).digest('hex');
}

function zeroFill(str, length) {
  const zeroBuffer = Buffer.alloc(length).fill(0);
  const strBuffer = Buffer.from(str, 'hex');
  if (strBuffer.length >= length) {
    return strBuffer;
  }
  zeroBuffer.set(strBuffer, length - strBuffer.length);
  return zeroBuffer.toString('hex');
}

module.exports = { getInfo, getInfoMQTT }