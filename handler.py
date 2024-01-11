import time
import sys
import logging
import qrcode_terminal
from io import StringIO
from tuyalinksdk.client import TuyaClient
from tuyalinksdk.console_qrcode import qrcode_generate

client = TuyaClient(productid=sys.argv[1],
                    uuid=sys.argv[2],
                    authkey=sys.argv[3])

def on_connected():
    print('Connected.')

def on_qrcode(url):
    qrcode_terminal.draw(url)

def on_reset(data):
    print('Reset:', data)

def on_dps(dps):
    print('receiver:', dps)
    client.push_dps(dps)

client.on_connected = on_connected
client.on_qrcode = on_qrcode
client.on_reset = on_reset
client.on_dps = on_dps

client.connect()
client.loop_start()


while True:
    time.sleep(1)
    buffer = StringIO()
    
    if "sender" in buffer.getvalue():
        payload = buffer.getvalue().split('|')
        if payload[0] == sys.argv[1]:
            dps = payload[1].split('sender:')[1]
            client.push_dps(dps)

