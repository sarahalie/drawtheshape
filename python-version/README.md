# Hand Drawing with Python

This is a Python implementation of the hand drawing application using OpenCV and MediaPipe for hand tracking.

## Features

- Real-time hand tracking
- Drawing with index finger
- Color selection (Blue, Green, Red, Yellow)
- Clear canvas functionality
- Pinch gesture to reset drawing points

## Requirements

- Python 3.7+
- Webcam
- Required packages (install using `pip install -r requirements.txt`):
  - OpenCV
  - NumPy
  - MediaPipe

## Installation

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

1. Run the script:
```bash
python hand_drawing.py
```

2. Controls:
- Move your index finger to draw
- Use the color buttons at the top to change colors
- Use the CLEAR button to clear the canvas
- Pinch your thumb and index finger together to reset drawing points
- Press 'q' to quit the application

## Windows

Two windows will appear:
1. "Output" - Shows the webcam feed with hand tracking
2. "Paint" - Shows your drawings on a clean canvas 