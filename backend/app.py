from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
import cv2
import mediapipe as mp
import numpy as np
import threading
import time

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize MediaPipe Hand tracking with drawing utilities
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def initialize_hands():
    return mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.5,  # Lowered threshold for better detection
        min_tracking_confidence=0.5    # Lowered threshold for better tracking
    )

# Start video capture
cap = None
is_tracking = False
tracking_thread = None
hands = None

def get_finger_coordinates(hand_landmarks, frame_shape):
    if hand_landmarks:
        try:
            # Get index fingertip coordinates (normalized)
            index_tip = hand_landmarks.landmark[8]  # Index fingertip
            thumb_tip = hand_landmarks.landmark[4]  # Thumb tip
            
            # Convert normalized coordinates to pixel coordinates
            h, w, _ = frame_shape
            x = int(index_tip.x * w)
            y = int(index_tip.y * h)
            
            # Calculate distance between thumb and index finger for pinch detection
            thumb_x = int(thumb_tip.x * w)
            thumb_y = int(thumb_tip.y * h)
            pinch_distance = np.sqrt((x - thumb_x)**2 + (y - thumb_y)**2)
            
            # Detect if fingers are up
            index_pip = hand_landmarks.landmark[6]  # Index PIP joint
            middle_tip = hand_landmarks.landmark[12]  # Middle fingertip
            middle_pip = hand_landmarks.landmark[10]  # Middle PIP joint
            ring_tip = hand_landmarks.landmark[16]  # Ring fingertip
            pinky_tip = hand_landmarks.landmark[20]  # Pinky fingertip
            
            # Check finger states (convert numpy bool to Python bool)
            is_index_up = bool(index_tip.y < index_pip.y)
            is_middle_up = bool(middle_tip.y < middle_pip.y)
            is_ring_up = bool(ring_tip.y < hand_landmarks.landmark[14].y)
            is_pinky_up = bool(pinky_tip.y < hand_landmarks.landmark[18].y)
            
            # Determine gesture
            gesture = None
            if is_index_up and is_middle_up and not is_ring_up and not is_pinky_up:
                gesture = "colorPicker"
            elif is_index_up and not is_middle_up and not is_ring_up and not is_pinky_up:
                gesture = "eraser"
            elif is_index_up and is_middle_up and is_ring_up and is_pinky_up:
                gesture = "clear"
            
            return {
                "x": int(x),  # Ensure integers for JSON
                "y": int(y),
                "isDrawing": bool(pinch_distance < 50),  # Convert to Python bool
                "isSelecting": bool(pinch_distance < 30),
                "gesture": gesture
            }
        except Exception as e:
            print(f"Error processing hand landmarks: {e}")
            return None
    return None

def hand_tracking_loop():
    global cap, is_tracking, hands
    
    try:
        # Initialize hands in the thread that will use it
        hands = initialize_hands()
        
        while is_tracking:
            try:
                if cap is None or not cap.isOpened():
                    try:
                        if cap is not None:
                            cap.release()
                        cap = cv2.VideoCapture(0)
                        # Set camera resolution to 640x480
                        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                        if not cap.isOpened():
                            print("Failed to open camera. Retrying...")
                            time.sleep(1)
                            continue
                    except Exception as e:
                        print(f"Error opening camera: {e}")
                        time.sleep(1)
                        continue
                
                success, frame = cap.read()
                if not success:
                    print("Failed to read frame. Retrying...")
                    time.sleep(0.1)
                    continue
                
                # Flip the frame horizontally for a later selfie-view display
                frame = cv2.flip(frame, 1)
                
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # Process frame
                try:
                    results = hands.process(frame_rgb)
                except Exception as e:
                    print(f"Error processing frame: {e}")
                    continue
                
                # Draw hand landmarks
                if results.multi_hand_landmarks:
                    for hand_landmarks in results.multi_hand_landmarks:
                        try:
                            # Draw the hand landmarks
                            mp_drawing.draw_landmarks(
                                frame,
                                hand_landmarks,
                                mp_hands.HAND_CONNECTIONS,
                                mp_drawing_styles.get_default_hand_landmarks_style(),
                                mp_drawing_styles.get_default_hand_connections_style()
                            )
                            
                            # Get finger coordinates and emit them
                            coords = get_finger_coordinates(hand_landmarks, frame.shape)
                            if coords:
                                socketio.emit('hand_position', coords)
                            
                            # Draw fingertip markers
                            h, w, _ = frame.shape
                            # Draw index fingertip (landmark 8)
                            index_tip = hand_landmarks.landmark[8]
                            cv2.circle(frame, 
                                    (int(index_tip.x * w), int(index_tip.y * h)),
                                    8, (0, 255, 0), -1)  # Green circle
                            
                            # Draw thumb tip (landmark 4)
                            thumb_tip = hand_landmarks.landmark[4]
                            cv2.circle(frame, 
                                    (int(thumb_tip.x * w), int(thumb_tip.y * h)),
                                    8, (255, 0, 0), -1)  # Blue circle
                        except Exception as e:
                            print(f"Error drawing landmarks: {e}")
                            continue
                
                # Add text to show if hand is detected
                cv2.putText(frame,
                        "Hand Detected" if results.multi_hand_landmarks else "No Hand Detected",
                        (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        1,
                        (0, 255, 0) if results.multi_hand_landmarks else (0, 0, 255),
                        2)
                
                # Show the frame
                cv2.imshow('Hand Tracking', frame)
                
                # Break the loop if 'q' is pressed
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                
                time.sleep(1/30)  # Limit to 30 FPS
                
            except Exception as e:
                print(f"Error in tracking loop: {e}")
                time.sleep(0.1)
                continue
            
    except Exception as e:
        print(f"Fatal error in hand tracking: {e}")
    finally:
        if cap is not None:
            cap.release()
        cv2.destroyAllWindows()

@app.route('/start-tracking', methods=['POST'])
def start_tracking():
    global is_tracking, tracking_thread
    
    if not is_tracking:
        is_tracking = True
        tracking_thread = threading.Thread(target=hand_tracking_loop)
        tracking_thread.start()
        return jsonify({"status": "started"})
    return jsonify({"status": "already running"})

@app.route('/stop-tracking', methods=['POST'])
def stop_tracking():
    global is_tracking, cap, hands
    
    is_tracking = False
    if tracking_thread:
        tracking_thread.join()
    if cap:
        cap.release()
        cap = None
    if hands:
        hands = None
    cv2.destroyAllWindows()
    return jsonify({"status": "stopped"})

if __name__ == '__main__':
    try:
        socketio.run(app, host='0.0.0.0', port=5000, debug=True)
    finally:
        if cap:
            cap.release()
        cv2.destroyAllWindows() 