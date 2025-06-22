# Draw the Shape - Interactive Drawing Game

An interactive drawing game designed to help children with dyslexia improve their motor skills and shape recognition through hand gesture-based interactions.

## Features

- Real-time hand tracking and gesture recognition
- Interactive shape drawing exercises
- Multiple shape options
- Color selection
- Clear gesture functionality
- Beginner-friendly interface
- Dyslexia-friendly design

## Tech Stack

- React.js for the frontend
- TensorFlow.js for hand tracking
- Python/Flask for the backend
- MediaPipe for gesture recognition
- HTML Canvas for drawing

## Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- npm or yarn
- Webcam access

## Installation

1. Clone the repository:
```bash
git clone https://github.com/sarahalie/fyp-airplaygamedts.git
cd fyp-airplaygamedts
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

## Running the Application

1. Start the backend server:
```bash
cd backend
python app.py
```

2. In a new terminal, start the frontend:
```bash
npm start
```

The application will be available at http://localhost:3000

## Project Structure

```
draw-the-shape-cpy/
├── public/              # Static files
│   ├── hands.js        # Hand tracking library
│   └── assets/         # Images and sounds
├── src/                # React source files
│   ├── App.js         # Main application component
│   ├── components/    # React components
│   └── utils/         # Utility functions
├── backend/           # Python Flask backend
│   ├── app.py        # Main server file
│   └── requirements.txt # Python dependencies
└── package.json      # Project dependencies
```

## Game Instructions

1. Enable camera access when prompted
2. Select a shape to draw
3. Choose your preferred color
4. Use your hand to trace the shape
5. Show all fingers to clear the canvas

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
