# Draw The Shape Game

A fun drawing game that uses hand gestures to draw shapes. The game uses Python for hand tracking and React for the frontend interface.

## Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- pip (Python package manager)
- Webcam

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a Python virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- On Windows:
```bash
.\venv\Scripts\activate
```
- On macOS/Linux:
```bash
source venv/bin/activate
```

4. Install Python dependencies:
```bash
pip install -r requirements.txt
```

### Frontend Setup

1. Navigate to the project root directory:
```bash
cd ..
```

2. Install Node.js dependencies:
```bash
npm install
```

## Running the Application

1. Start the Python backend server (in one terminal):
```bash
cd backend
python app.py
```

2. Start the React frontend (in another terminal):
```bash
npm start
```

3. Open your browser and navigate to `http://localhost:3000`

## How to Play

1. Click the "Hand Mode" button to enable hand tracking
2. Use your hand gestures to draw:
   - Point to the top menu to select colors
   - Raise your index finger to draw
   - Pinch your thumb and index finger together to clear the canvas
3. Try to draw the shapes shown on screen!

## Troubleshooting

If you encounter any issues:

1. Make sure both the backend and frontend servers are running
2. Check that your webcam is properly connected and accessible
3. Ensure you have granted webcam permissions to your browser
4. Try refreshing the page if hand tracking isn't working

## Technical Details

- Frontend: React.js
- Backend: Python with Flask and WebSocket
- Hand Tracking: MediaPipe Hands
- Video Processing: OpenCV
