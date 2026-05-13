import time
import math
import requests
from smbus2 import SMBus

AS5600_ADDR = 0x36
ANGLE_REG = 0x0E
STATUS_REG = 0x0B

# Threshold to ignore minor noise or accidental touches
THRESHOLD = 5.0 
# Sensitivity ratio (e.g., 1.0 means 1:1, 2.0 doubles the output speed)
RATIO = 0.5
# Polling interval for high responsiveness
INTERVAL = 0.02 

def read_angle(bus):
    data = bus.read_i2c_block_data(AS5600_ADDR, ANGLE_REG, 2)
    raw = (data[0] << 8) | data[1]
    raw &= 0x0FFF
    degrees = raw * 360.0 / 4096.0
    return raw, degrees

def read_status(bus):
    s = bus.read_byte_data(AS5600_ADDR, STATUS_REG)
    md = (s >> 5) & 1
    ml = (s >> 4) & 1
    mh = (s >> 3) & 1
    return md, ml, mh

prev_deg = None
session = requests.Session()

with SMBus(1) as bus:
    md, ml, mh = read_status(bus)
    print(f"magnet: detect={md}, too far={ml}, too near={mh}")
    
    while True:
        raw, deg = read_angle(bus)
        
        if prev_deg is not None:
            delta = deg - prev_deg
            
            # Shortest path logic
            if delta > 180:
                delta -= 360
            elif delta < -180:
                delta += 360
            
            # Check if movement exceeds the noise threshold
            if abs(delta) > THRESHOLD:
                # Calculate movement based on ratio and invert direction
                # Using -delta to keep the requested reverse logic
                send_val = -delta * RATIO
                
                print(f"deg={deg:6.2f} delta={delta:6.2f} -> send={send_val:+.2f}", end="")
                
                try:
                    # Send calculated value based on actual movement ratio
                    r = session.post("http://localhost:3000/api/rotation",
                                   json={"delta": send_val},
                                   timeout=0.05)
                    print(f" [{r.status_code}]")
                except requests.RequestException as e:
                    print(f" [error: {e}]")
                
                # Update baseline after processing significant movement
                prev_deg = deg
            else:
                # Optional: Slowly track prev_deg even within threshold 
                # to prevent slow drift from accumulating
                pass 
        else:
            prev_deg = deg
        
        time.sleep(INTERVAL)
