import React, { useEffect, useRef, useState } from 'react';

const HandTracking = ({ onHandPosition, currentColor }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const handsRef = useRef(null);
    const cameraRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                if (document.querySelector(`script[src="${src}"]`)) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = (e) => reject(new Error(`Failed to load script: ${src}`));
                document.body.appendChild(script);
            });
        };

        const initializeHandTracking = async () => {
            try {
                // Load required scripts
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
                await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');

                if (!videoRef.current || !canvasRef.current) {
                    throw new Error('Video or canvas reference not found');
                }

                // Initialize MediaPipe Hands
                if (!window.Hands) {
                    throw new Error('MediaPipe Hands not loaded properly');
                }

                handsRef.current = new window.Hands({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
                });

                handsRef.current.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                // Initialize canvas
                const canvas = canvasRef.current;
                canvas.width = 320;
                canvas.height = 240;
                contextRef.current = canvas.getContext('2d');

                // Set up hand tracking results handler
                handsRef.current.onResults((results) => {
                    try {
                        handleResults(results);
                    } catch (err) {
                        console.error('Error in handleResults:', err);
                        setError('Error processing hand tracking results');
                    }
                });

                // Initialize camera
                if (!window.Camera) {
                    throw new Error('MediaPipe Camera not loaded properly');
                }

                cameraRef.current = new window.Camera(videoRef.current, {
                    onFrame: async () => {
                        try {
                            if (videoRef.current && handsRef.current) {
                                await handsRef.current.send({ image: videoRef.current });
                            }
                        } catch (err) {
                            console.error('Error in camera frame processing:', err);
                            setError('Error processing camera frame');
                        }
                    },
                    width: 320,
                    height: 240
                });

                await cameraRef.current.start();
                console.log('Camera and hand tracking initialized successfully');

            } catch (err) {
                console.error('Initialization error:', err);
                setError(err.message);
            }
        };

        // Start initialization
        initializeHandTracking();

        // Cleanup function
        return () => {
            try {
                if (cameraRef.current) {
                    cameraRef.current.stop();
                }
                if (handsRef.current) {
                    handsRef.current.close();
                }
            } catch (err) {
                console.error('Cleanup error:', err);
            }
        };
    }, []);

    const handleResults = (results) => {
        if (!contextRef.current || !results) return;

        const ctx = contextRef.current;

        // Clear canvas
        ctx.save();
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Mirror the canvas
        ctx.scale(-1, 1);
        ctx.translate(-ctx.canvas.width, 0);

        // Draw camera feed
        if (results.image) {
            ctx.drawImage(results.image, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Draw hand landmarks
            for (const landmarks of results.multiHandLandmarks) {
                if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
                    // Draw hand connections
                    window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
                        color: '#00FF00',
                        lineWidth: 3
                    });
                    
                    // Draw landmarks except index finger tip
                    for (let i = 0; i < landmarks.length; i++) {
                        if (i !== 8) { // Skip index fingertip
                            ctx.beginPath();
                            ctx.arc(
                                landmarks[i].x * ctx.canvas.width,
                                landmarks[i].y * ctx.canvas.height,
                                4,
                                0,
                                2 * Math.PI
                            );
                            ctx.fillStyle = '#FF0000';
                            ctx.fill();
                        }
                    }

                    // Draw special indicator for index fingertip
                    const indexTip = landmarks[8];
                    ctx.beginPath();
                    ctx.arc(
                        indexTip.x * ctx.canvas.width,
                        indexTip.y * ctx.canvas.height,
                        8, // Larger radius for the pointer
                        0,
                        2 * Math.PI
                    );
                    
                    // Create gradient for pointer indicator using the current color
                    const gradient = ctx.createRadialGradient(
                        indexTip.x * ctx.canvas.width,
                        indexTip.y * ctx.canvas.height,
                        2,
                        indexTip.x * ctx.canvas.width,
                        indexTip.y * ctx.canvas.height,
                        8
                    );
                    gradient.addColorStop(0, currentColor); // Use the current color
                    gradient.addColorStop(1, currentColor); // Use the current color

                    ctx.fillStyle = gradient;
                    ctx.fill();
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Process hand position and gestures
                    const fingerState = getFingerState(landmarks);
                    if (fingerState && onHandPosition) {
                        // Calculate relative position from center of webcam
                        const webcamCenterX = ctx.canvas.width / 2;
                        const webcamCenterY = ctx.canvas.height / 2;
                        
                        // Calculate offset from center (-1 to 1 range)
                        const offsetX = (indexTip.x * ctx.canvas.width - webcamCenterX) / webcamCenterX;
                        const offsetY = (indexTip.y * ctx.canvas.height - webcamCenterY) / webcamCenterY;
                        
                        // Pass the relative offset and current color to the drawing component
                        fingerState.offsetX = offsetX;
                        fingerState.offsetY = offsetY;
                        fingerState.isRelativePosition = true;
                        fingerState.currentColor = currentColor;
                        
                        onHandPosition(fingerState);
                    }
                }
            }
        }
        ctx.restore();
    };

    const getFingerState = (landmarks) => {
        if (!landmarks) return null;

        // Get fingertip and pip joint positions
        const indexTip = landmarks[8];  // Index fingertip
        const indexPip = landmarks[6];  // Index PIP joint
        const middleTip = landmarks[12];
        const middlePip = landmarks[10];
        const ringTip = landmarks[16];
        const ringPip = landmarks[14];
        const pinkyTip = landmarks[20];
        const pinkyPip = landmarks[18];
        const wristPoint = landmarks[0]; // Wrist point for reference

        // Check if fingers are up (if fingertip is above pip joint)
        const isIndexUp = indexTip.y < indexPip.y;
        const isMiddleUp = middleTip.y < middlePip.y;
        const isRingUp = ringTip.y < ringPip.y;
        const isPinkyUp = pinkyTip.y < pinkyPip.y;

        // Count raised fingers
        const raisedFingers = [isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(Boolean).length;

        // Check if index finger is pointing (index up, others down)
        const isPointing = isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp;

        // Determine gesture
        let gesture = null;
        if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
            gesture = "colorPicker";
        } else if (isPointing) {
            gesture = "draw";
        } else if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
            gesture = "clear";
        }

        return {
            x: indexTip.x * canvasRef.current.width,
            y: indexTip.y * canvasRef.current.height,
            isDrawing: isPointing,
            isSelecting: isPointing && indexTip.y < wristPoint.y - 0.3,
            gesture,
            raisedFingers,
            currentColor: currentColor
        };
    };

    return (
        <div className="hand-tracking-container">
            {error && (
                <div style={{
                    position: 'fixed',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(255, 0, 0, 0.8)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    zIndex: 1000
                }}>
                    Error: {error}
                </div>
            )}
            <video
                ref={videoRef}
                style={{ display: 'none' }}
                playsInline
            />
            <canvas
                ref={canvasRef}
                className="hand-tracking-canvas"
                style={{
                    position: 'fixed',
                    right: '20px',
                    bottom: '20px',
                    borderRadius: '10px',
                    border: '3px solid #4D96FF',
                    zIndex: 100,
                    transform: 'scale(1)',
                    transition: 'transform 0.3s ease'
                }}
            />
        </div>
    );
};

export default HandTracking;