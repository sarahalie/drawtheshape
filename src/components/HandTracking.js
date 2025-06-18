import React, { useEffect, useRef, useState } from 'react';

const HandTracking = ({ onHandPosition }) => {
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
                canvas.width = 640;
                canvas.height = 480;
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
                    width: 640,
                    height: 480
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

        // Draw camera feed
        if (results.image) {
            ctx.drawImage(results.image, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Draw hand landmarks
            for (const landmarks of results.multiHandLandmarks) {
                if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
                    window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {
                        color: '#00FF00',
                        lineWidth: 5
                    });
                    window.drawLandmarks(ctx, landmarks, {
                        color: '#FF0000',
                        lineWidth: 2
                    });

                    // Process hand position and gestures
                    const fingerState = getFingerState(landmarks);
                    if (fingerState && onHandPosition) {
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
        const indexTip = landmarks[8];
        const indexPip = landmarks[6];
        const middleTip = landmarks[12];
        const middlePip = landmarks[10];
        const ringTip = landmarks[16];
        const ringPip = landmarks[14];
        const pinkyTip = landmarks[20];
        const pinkyPip = landmarks[18];
        const thumbTip = landmarks[4];

        // Check if fingers are up (if fingertip is above pip joint)
        const isIndexUp = indexTip.y < indexPip.y;
        const isMiddleUp = middleTip.y < middlePip.y;
        const isRingUp = ringTip.y < ringPip.y;
        const isPinkyUp = pinkyTip.y < pinkyPip.y;

        // Calculate pinch distance
        const pinchDistance = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) + 
            Math.pow(indexTip.y - thumbTip.y, 2)
        );

        // Determine gesture
        let gesture = null;
        if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
            gesture = "colorPicker";
        } else if (isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
            gesture = "eraser";
        } else if (isIndexUp && isMiddleUp && isRingUp && isPinkyUp) {
            gesture = "clear";
        }

        return {
            x: indexTip.x * canvasRef.current.width,
            y: indexTip.y * canvasRef.current.height,
            isDrawing: pinchDistance < 0.1,
            isSelecting: pinchDistance < 0.08,
            gesture
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
                    top: '20px',
                    borderRadius: '10px',
                    border: '3px solid #4D96FF',
                    zIndex: 100
                }}
            />
        </div>
    );
};

export default HandTracking;