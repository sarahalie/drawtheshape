import React, { useEffect, useRef, useState, useCallback } from 'react';
import './DrawingGame.css';
import useSound from 'use-sound';
import io from 'socket.io-client';
import api from '../services/api';
import { getThemeId, getShapeId } from '../utils/gameHelpers';
import HandTracking from './HandTracking';

const SHAPES = {
  geometry: [
    { name: 'Rectangle', points: [[250, 100], [550, 100], [550, 300], [250, 300]] },
    { name: 'Pentagon', points: [[400, 100], [600, 200], [500, 300], [300, 300], [200, 200]] },
    { name: 'Triangle', points: [[400, 100], [600, 300], [200, 300]] },
    { name: 'Square', points: [[300, 100], [500, 100], [500, 300], [300, 300]] },
    { name: 'Heart', type: 'composite',
      parts: [
        // Left curve
        { type: 'bezier', 
          start: [400, 200],
          cp1: [400, 150],
          cp2: [300, 150],
          end: [300, 200]
        },
        // Right curve
        { type: 'bezier',
          start: [400, 200],
          cp1: [400, 150],
          cp2: [500, 150],
          end: [500, 200]
        },
        // Bottom point
        { points: [[300, 200], [400, 350], [500, 200]] }
      ]
    },
    { name: 'Circle', type: 'circle', center: [400, 200], radius: 100 },
    { name: 'Diamond', points: [[400, 100], [500, 200], [400, 300], [300, 200]] },
    { name: 'Semi Circle', type: 'composite',
      parts: [
        { type: 'arc', 
          center: [400, 200],
          radius: 100,
          startAngle: 0,
          endAngle: Math.PI
        },
        { points: [[300, 200], [500, 200]] }
      ]
    },
    { name: 'Rhombus', points: [[400, 100], [550, 200], [400, 300], [250, 200]] },
    { name: 'Trapezoid', points: [[250, 250], [550, 250], [500, 150], [300, 150]] }
  ],
  nature: [
    // Level 1: Simple leaf - single curve with a line
    { name: 'Leaf', type: 'composite',
      parts: [
        { type: 'bezier',
          start: [400, 100],
          cp1: [300, 100],
          cp2: [300, 300],
          end: [400, 300]
        },
        { type: 'bezier',
          start: [400, 100],
          cp1: [500, 100],
          cp2: [500, 300],
          end: [400, 300]
        },
        // Center vein
        { points: [[400, 100], [400, 300]] }
      ]
    },
    // Level 2: Simple tree - basic straight lines
    { name: 'Tree', type: 'composite',
      parts: [
        // Trunk
        { points: [[380, 300], [380, 200], [420, 200], [420, 300]] },
        // Triangular top
        { points: [[300, 200], [400, 100], [500, 200]] }
      ]
    },
    // Level 3: Mountain - simple triangular shapes
    { name: 'Mountain', type: 'composite',
      parts: [
        // Main peak
        { points: [[200, 300], [400, 100], [600, 300]] },
        // Snow cap
        { points: [[350, 150], [400, 100], [450, 150]] }
      ]
    },
    // Level 4: Cloud - smooth curves
    { name: 'Cloud', type: 'composite',
      parts: [
        { type: 'bezier',
          start: [200, 200],
          cp1: [250, 150],
          cp2: [350, 150],
          end: [400, 200]
        },
        { type: 'bezier',
          start: [400, 200],
          cp1: [450, 150],
          cp2: [550, 150],
          end: [600, 200]
        },
        { type: 'bezier',
          start: [600, 200],
          cp1: [600, 250],
          cp2: [500, 250],
          end: [400, 200]
        },
        { type: 'bezier',
          start: [400, 200],
          cp1: [300, 250],
          cp2: [200, 250],
          end: [200, 200]
        }
      ]
    },
    // Level 5: Apple - complex curves
    { name: 'Apple', type: 'composite',
      parts: [
        // Main apple body
        { type: 'bezier',
          start: [400, 120],
          cp1: [300, 120],
          cp2: [300, 320],
          end: [400, 320]
        },
        { type: 'bezier',
          start: [400, 120],
          cp1: [500, 120],
          cp2: [500, 320],
          end: [400, 320]
        },
        // Leaf
        { type: 'bezier',
          start: [400, 120],
          cp1: [420, 80],
          cp2: [460, 100],
          end: [400, 120]
        }
      ]
    },
    // Level 6: Flower - symmetrical curves with circle
    { name: 'Flower', type: 'composite',
      parts: [
        // Center
        { type: 'circle', center: [400, 200], radius: 30 },
        // Petals
        { type: 'bezier',
          start: [400, 170],
          cp1: [350, 120],
          cp2: [300, 120],
          end: [400, 170]
        },
        { type: 'bezier',
          start: [400, 170],
          cp1: [450, 120],
          cp2: [500, 120],
          end: [400, 170]
        },
        { type: 'bezier',
          start: [400, 230],
          cp1: [350, 280],
          cp2: [300, 280],
          end: [400, 230]
        },
        { type: 'bezier',
          start: [400, 230],
          cp1: [450, 280],
          cp2: [500, 280],
          end: [400, 230]
        }
      ]
    },
    // Level 7: Butterfly - complex symmetrical curves
    { name: 'Butterfly', type: 'composite',
      parts: [
        // Left wing
        { type: 'bezier',
          start: [400, 200],
          cp1: [350, 150],
          cp2: [250, 150],
          end: [300, 250]
        },
        // Right wing
        { type: 'bezier',
          start: [400, 200],
          cp1: [450, 150],
          cp2: [550, 150],
          end: [500, 250]
        },
        // Body
        { points: [[400, 150], [400, 250]] }
      ]
    },
    // Level 8: Star - precise angles and points
    { name: 'Star', type: 'composite',
      parts: [
        { points: [[400, 100], [430, 180], [510, 180], [450, 230], [470, 300], 
                   [400, 260], [330, 300], [350, 230], [290, 180], [370, 180]] }
      ]
    },
    // Level 9: Sun - complex combination of circle and lines
    { name: 'Sun', type: 'composite',
      parts: [
        { type: 'circle', center: [400, 200], radius: 80 },
        { points: [[400, 80], [400, 20]] },
        { points: [[400, 320], [400, 380]] },
        { points: [[280, 200], [220, 200]] },
        { points: [[520, 200], [580, 200]] },
        { points: [[310, 110], [260, 60]] },
        { points: [[490, 110], [540, 60]] },
        { points: [[310, 290], [260, 340]] },
        { points: [[490, 290], [540, 340]] }
      ]
    },
    // Add new Rainbow shape
    { name: 'Rainbow', type: 'composite',
      parts: [
        { type: 'arc',
          center: [400, 300],
          radius: 200,
          startAngle: Math.PI,
          endAngle: 0
        },
        { type: 'arc',
          center: [400, 300],
          radius: 180,
          startAngle: Math.PI,
          endAngle: 0
        },
        { type: 'arc',
          center: [400, 300],
          radius: 160,
          startAngle: Math.PI,
          endAngle: 0
        }
      ]
    }
  ],
  abstract: [
    // Level 1: ZigZag - simple connected lines
    { name: 'ZigZag', points: [[200, 200], [300, 100], [400, 300], [500, 100], [600, 200]] },
    // Level 2: Waves - simple curves
    { name: 'Waves', type: 'composite',
      parts: [
        { type: 'bezier',
          start: [200, 200],
          cp1: [250, 150],
          cp2: [350, 250],
          end: [400, 200]
        },
        { type: 'bezier',
          start: [400, 200],
          cp1: [450, 150],
          cp2: [550, 250],
          end: [600, 200]
        }
      ]
    },
    // Level 3: Mosaic - straight lines grid
    { name: 'Mosaic', points: [
        [300, 100], [500, 100], [500, 300], [300, 300], [300, 100],
        [400, 100], [400, 300],
        [300, 200], [500, 200]
      ]
    },
    // Level 4: Starburst - intersecting lines
    { name: 'Starburst', type: 'composite',
      parts: [
        { points: [[400, 100], [400, 300]] },
        { points: [[250, 200], [550, 200]] },
        { points: [[300, 120], [500, 280]] },
        { points: [[300, 280], [500, 120]] }
      ]
    },
    // Level 5: Infinity - smooth continuous curves
    { name: 'Infinity', type: 'composite',
      parts: [
        // Left loop
        { type: 'bezier',
          start: [300, 200],
          cp1: [300, 150],
          cp2: [350, 150],
          end: [400, 200]
        },
        { type: 'bezier',
          start: [400, 200],
          cp1: [350, 250],
          cp2: [300, 250],
          end: [300, 200]
        },
        // Right loop
        { type: 'bezier',
          start: [400, 200],
          cp1: [450, 150],
          cp2: [500, 150],
          end: [500, 200]
        },
        { type: 'bezier',
          start: [500, 200],
          cp1: [500, 250],
          cp2: [450, 250],
          end: [400, 200]
        }
      ]
    },
    // Level 6: Spiral - continuous curved motion
    { name: 'Spiral', type: 'composite',
      parts: [
        { type: 'bezier',
          start: [400, 200],
          cp1: [350, 150],
          cp2: [300, 200],
          end: [400, 250]
        },
        { type: 'bezier',
          start: [400, 250],
          cp1: [500, 300],
          cp2: [450, 200],
          end: [350, 150]
        },
        { type: 'bezier',
          start: [350, 150],
          cp1: [250, 100],
          cp2: [300, 200],
          end: [450, 200]
        }
      ]
    },
    // Level 7: Vortex - nested curves
    { name: 'Vortex', type: 'composite',
      parts: [
        { type: 'bezier',
          start: [400, 150],
          cp1: [300, 150],
          cp2: [300, 250],
          end: [400, 250]
        },
        { type: 'bezier',
          start: [400, 250],
          cp1: [500, 250],
          cp2: [500, 150],
          end: [400, 150]
        },
        { type: 'bezier',
          start: [400, 175],
          cp1: [350, 175],
          cp2: [350, 225],
          end: [400, 225]
        },
        { type: 'bezier',
          start: [400, 225],
          cp1: [450, 225],
          cp2: [450, 175],
          end: [400, 175]
        }
      ]
    },
    // Level 8: Maze - complex connected paths
    { name: 'Maze', type: 'composite',
      parts: [
        { points: [[300, 100], [500, 100]] },
        { points: [[500, 100], [500, 300]] },
        { points: [[500, 300], [300, 300]] },
        { points: [[300, 300], [300, 150]] },
        { points: [[300, 150], [450, 150]] },
        { points: [[450, 150], [450, 250]] },
        { points: [[450, 250], [350, 250]] }
      ]
    }
  ]
};

const getShape = (theme, level) => {
  return SHAPES[theme]?.[level - 1];
};

const DrawingGame = ({ theme, level, onSuccess }) => {
  const canvasRef = useRef(null);
  const drawingStateRef = useRef({
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    isMouseDrawing: false
  });
  const themeRef = useRef(theme);
  const levelRef = useRef(level);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [drawnPaths, setDrawnPaths] = useState([]);
  const [currentColor, setCurrentColor] = useState('#4D96FF');
  const [isErasing, setIsErasing] = useState(false);
  const [selectedShape, setSelectedShape] = useState(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [playWow] = useSound('/wowsnd.mp3', { volume: 0.5 });
  const [playFailure] = useSound('/failure.mp3', { volume: 0.5 });
  const [lastPosition, setLastPosition] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showEncouragement, setShowEncouragement] = useState(false);
  const encouragementMessages = [
    "Amazing effort! 🌟",
    "You're doing great! 💫",
    "Wonderful drawing! 🎨",
    "Keep going, superstar! ⭐",
    "Beautiful work! 🌈",
    "You're a creative genius! 🎨palette",
    "Fantastic job! 🌟",
    "You make drawing fun! 🎨"
  ];
  const [isHandDrawing, setIsHandDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);
  const pathsRef = useRef([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPosition, setColorPickerPosition] = useState({ x: 0, y: 0 });
  const [currentTool, setCurrentTool] = useState('pen'); // 'pen' or 'eraser'
  const [context, setContext] = useState(null);

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  // Update refs when props change
  useEffect(() => {
    themeRef.current = theme;
    levelRef.current = level;
  }, [theme, level]);

  const colors = {
    blue: '#C5D3E8',    // Dyslexia-friendly blue
    green: '#B1C29E',   // Dyslexia-friendly green
    peach: '#FFD6BA',     // Dyslexia-friendly red
    yellow: '#FADFA1'   // Dyslexia-friendly yellow
  };

  const redrawPaths = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Only redraw the user's paths
    drawnPaths.forEach(path => {
      if (path.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(path.points[0][0], path.points[0][1]);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i][0], path.points[i][1]);
        }
        ctx.strokeStyle = path.isEraser ? '#FFFFFF' : path.color;
        ctx.lineWidth = path.isEraser ? 20 : 3;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    });
  };

  const drawGuideShape = (ctx) => {
    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;
    
    const shape = getShape(themeRef.current, levelRef.current);
    if (!shape) return;

    // Draw helper points first
    if (shape.helperPoints) {
      shape.helperPoints.forEach((point, index) => {
        const x = (point.x / 100) * ctx.canvas.width;
        const y = (point.y / 100) * ctx.canvas.height;
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = index === 0 ? '#6BCB77' : '#A7C8E7';
        ctx.fill();
        
        // Add helper text
        ctx.font = '14px Comic Sans MS';
        ctx.fillStyle = '#272757';
        ctx.fillText(point.text, x + 15, y);
      });
    }

    // Draw the shape path
    if (shape.path) {
      const path = new Path2D(shape.path);
      const scale = {
        x: ctx.canvas.width / 100,
        y: ctx.canvas.height / 100
      };
      
      ctx.save();
      ctx.scale(scale.x, scale.y);
      ctx.stroke(path);
      ctx.restore();
      return;
    }

    // Handle legacy shape types
    if (shape.type === 'circle') {
      ctx.beginPath();
      ctx.arc(shape.center[0], shape.center[1], shape.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shape.type === 'composite') {
      shape.parts.forEach(part => {
        if (part.type === 'bezier') {
          ctx.beginPath();
          ctx.moveTo(part.start[0], part.start[1]);
          ctx.bezierCurveTo(
            part.cp1[0], part.cp1[1],
            part.cp2[0], part.cp2[1],
            part.end[0], part.end[1]
          );
          ctx.stroke();
        } else if (part.points) {
          ctx.beginPath();
          ctx.moveTo(part.points[0][0], part.points[0][1]);
          for (let i = 1; i < part.points.length; i++) {
            ctx.lineTo(part.points[i][0], part.points[i][1]);
          }
          ctx.stroke();
        }
      });
    } else if (shape.points) {
      ctx.beginPath();
      ctx.moveTo(shape.points[0][0], shape.points[0][1]);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i][0], shape.points[i][1]);
      }
      if (shape.closed !== false) {
        ctx.closePath();
      }
      ctx.stroke();
    }
  };

  const drawSelectedShape = (shapeIndex) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const shape = SHAPES[themeRef.current][shapeIndex];
    if (!shape) return;

    ctx.strokeStyle = '#CCCCCC';
    ctx.lineWidth = 2;

    if (shape.type === 'circle') {
      ctx.beginPath();
      ctx.arc(shape.center[0], shape.center[1], shape.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shape.type === 'composite') {
      shape.parts.forEach(part => {
        if (part.type === 'bezier') {
          ctx.beginPath();
          ctx.moveTo(part.start[0], part.start[1]);
          ctx.bezierCurveTo(
            part.cp1[0], part.cp1[1],
            part.cp2[0], part.cp2[1],
            part.end[0], part.end[1]
          );
          ctx.stroke();
        } else if (part.points) {
          ctx.beginPath();
          ctx.moveTo(part.points[0][0], part.points[0][1]);
          for (let i = 1; i < part.points.length; i++) {
            ctx.lineTo(part.points[i][0], part.points[i][1]);
          }
          ctx.stroke();
        }
      });
    } else if (shape.points) {
      ctx.beginPath();
      ctx.moveTo(shape.points[0][0], shape.points[0][1]);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i][0], shape.points[i][1]);
      }
      if (shape.closed !== false) {
        ctx.closePath();
      }
      ctx.stroke();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = 800;
    canvas.height = 400;
    
    // Draw the initial guide shape
    drawGuideShape(ctx);
  }, [theme, level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    
    const handleResize = () => {
      const ctx = canvas.getContext('2d');
      
      // Resize canvas
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // First draw the guide shape
      drawGuideShape(ctx);
      
      // Then redraw all user paths
      redrawPaths();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (selectedShape === null) {
      drawGuideShape(ctx);
    } else {
      drawSelectedShape(selectedShape);
    }
    setHasDrawn(false);
  }, [level, theme, selectedShape]);

  const calculateAccuracy = () => {
    return 0.8;
  };

  const handleColorSelect = (color) => {
    setCurrentColor(color);
    setIsErasing(false);
  };

  const toggleEraser = () => {
    setIsErasing(!isErasing);
  };

  const handleShapeSelect = (shapeIndex) => {
    setSelectedShape(shapeIndex);
    drawSelectedShape(shapeIndex);
    setHasDrawn(false);
  };

  const startDrawing = (e) => {
    if (!startTime) {
      setStartTime(Date.now());
    }
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentPath([[x, y]]);
  };

  const handleCanvasMove = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCurrentPath(prev => {
      const newPath = [...prev, [x, y]];
      const ctx = canvas.getContext('2d');
      
      ctx.beginPath();
      ctx.moveTo(prev[prev.length - 1][0], prev[prev.length - 1][1]);
      ctx.lineTo(x, y);
      ctx.strokeStyle = isErasing ? '#FFFFFF' : currentColor;
      ctx.lineWidth = isErasing ? 20 : 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      
      return newPath;
    });
    setHasDrawn(true);
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    setDrawnPaths(prev => [...prev, { points: currentPath, color: currentColor, isEraser: isErasing }]);
  };

  const handleReset = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (selectedShape !== null) {
      drawSelectedShape(selectedShape);
    } else {
      drawGuideShape(ctx);
    }
    
    setCurrentPath([]);
    setDrawnPaths([]);
    setHasDrawn(false);
  };

  const handleFinish = async () => {
    const accuracy = calculateAccuracy(); // We'll still calculate but won't use it for judgment
    const timeSpentInSeconds = Math.round((Date.now() - startTime) / 1000);
    setTimeSpent(timeSpentInSeconds);

    try {
      // Get theme and shape IDs from the database
      const themeId = getThemeId(theme);
      const shapeId = getShapeId(theme, level);

      // Save progress to server - always mark as completed
      await api.saveProgress(themeId, shapeId, 100, timeSpentInSeconds); // Set accuracy to 100 to ensure badge is awarded

      // Show random encouragement message
      setShowEncouragement(true);
      
      // Play success sound
      playWow();
      
      // Call onSuccess to move to next level
      setTimeout(() => {
        onSuccess();
        setShowEncouragement(false);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save progress:', error);
      // Still provide positive feedback even if save fails
      setShowEncouragement(true);
      playWow();
      setTimeout(() => {
        onSuccess();
        setShowEncouragement(false);
      }, 2000);
    }
  };

  // Get a random encouragement message
  const getRandomEncouragement = () => {
    const randomIndex = Math.floor(Math.random() * encouragementMessages.length);
    return encouragementMessages[randomIndex];
  };

  const drawShapePreview = (canvasElement, shape) => {
    const ctx = canvasElement.getContext('2d');
    
    // Set canvas dimensions
    canvasElement.width = 100;
    canvasElement.height = 100;
    
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Set white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Save the current transformation state
    ctx.save();
    
    // Center the shape in preview
    ctx.translate(canvasElement.width/2, canvasElement.height/2);
    ctx.scale(0.25, 0.25);
    ctx.translate(-400, -200); // Center based on original canvas dimensions
    
    ctx.strokeStyle = '#272757';
    ctx.lineWidth = 6;
    
    if (shape.type === 'circle') {
      ctx.beginPath();
      ctx.arc(shape.center[0], shape.center[1], shape.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (shape.type === 'composite') {
      shape.parts.forEach(part => {
        if (part.type === 'bezier') {
          ctx.beginPath();
          ctx.moveTo(part.start[0], part.start[1]);
          ctx.bezierCurveTo(
            part.cp1[0], part.cp1[1],
            part.cp2[0], part.cp2[1],
            part.end[0], part.end[1]
          );
          ctx.stroke();
        } else if (part.type === 'arc') {
          ctx.beginPath();
          ctx.arc(part.center[0], part.center[1], part.radius, part.startAngle, part.endAngle);
          ctx.stroke();
        } else if (part.points) {
          ctx.beginPath();
          ctx.moveTo(part.points[0][0], part.points[0][1]);
          for (let i = 1; i < part.points.length; i++) {
            ctx.lineTo(part.points[i][0], part.points[i][1]);
          }
          ctx.stroke();
        }
      });
    } else if (shape.points) {
      ctx.beginPath();
      ctx.moveTo(shape.points[0][0], shape.points[0][1]);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i][0], shape.points[i][1]);
      }
      if (shape.closed !== false) {
        ctx.closePath();
      }
      ctx.stroke();
    }
    
    // Restore the transformation state
    ctx.restore();
  };

  // Add useEffect to draw shape previews
  useEffect(() => {
    const previewCanvases = document.querySelectorAll('.shape-preview-canvas');
    previewCanvases.forEach((canvas, index) => {
      const shape = SHAPES[theme]?.[index];
      if (shape) {
        drawShapePreview(canvas, shape);
      }
    });
  }, [theme]);

  // Mouse drawing handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    // Convert mouse coordinates to canvas coordinates
    const canvasX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const canvasY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    drawingStateRef.current.isMouseDrawing = true;
    ctx.beginPath();
    ctx.moveTo(canvasX, canvasY);
    drawingStateRef.current.lastX = canvasX;
    drawingStateRef.current.lastY = canvasY;
    setHasDrawn(true);
  };

  const handleMouseMove = (e) => {
    if (!drawingStateRef.current.isMouseDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    // Convert mouse coordinates to canvas coordinates
    const canvasX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const canvasY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    ctx.lineTo(canvasX, canvasY);
    ctx.stroke();

    drawingStateRef.current.lastX = canvasX;
    drawingStateRef.current.lastY = canvasY;
  };

  const handleMouseUp = () => {
    drawingStateRef.current.isMouseDrawing = false;
  };

  const handleMouseLeave = () => {
    drawingStateRef.current.isMouseDrawing = false;
  };

  // Update canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [currentColor]);

  // Update the hand movement handler
  const handleHandMove = ({ x, y, isDrawing, isSelecting, pressure = 1 }) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    if (isDrawing) {
      const ctx = canvas.getContext('2d');
      
      if (!isDrawingRef.current) {
        // Start a new path when drawing begins
        ctx.beginPath();
        ctx.moveTo(canvasX, canvasY);
        isDrawingRef.current = true;
        currentPathRef.current = [{ x: canvasX, y: canvasY }];
      } else {
        // Continue the path
        ctx.lineTo(canvasX, canvasY);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = isErasing ? 20 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        currentPathRef.current.push({ x: canvasX, y: canvasY });
      }
    } else {
      isDrawingRef.current = false;
      if (currentPathRef.current.length > 0) {
        pathsRef.current.push({
          points: currentPathRef.current,
          color: currentColor,
          isErasing
        });
        currentPathRef.current = [];
      }
    }

    // Handle shape selection with isSelecting gesture
    if (isSelecting) {
      const shapes = document.querySelectorAll('.shape-preview');
      shapes.forEach((shape, index) => {
        const shapeRect = shape.getBoundingClientRect();
        if (x >= shapeRect.left && x <= shapeRect.right &&
            y >= shapeRect.top && y <= shapeRect.bottom) {
          handleShapeSelect(index);
        }
      });
    }
  };

  // Handle gestures
  const handleGesture = ({ type, position }) => {
    switch (type) {
      case 'colorPicker':
        // Show color picker near the hand position
        setShowColorPicker(true);
        setColorPickerPosition({ x: position.x, y: position.y });
        break;
      case 'eraser':
        toggleEraser();
        break;
      case 'clear':
        handleReset();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    // Connect to Python backend
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Python backend');
      
      // Start hand tracking
      fetch('http://localhost:5000/start-tracking', {
        method: 'POST'
      }).catch(console.error);
    });

    socketRef.current.on('hand_position', handleHandPosition);

    return () => {
      // Stop hand tracking
      fetch('http://localhost:5000/stop-tracking', {
        method: 'POST'
      }).catch(console.error);
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleHandPosition = (data) => {
    const { x, y, isDrawing, isSelecting, gesture } = data;
    
    // Convert coordinates to canvas space
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    // Handle drawing
    if (isDrawing) {
      const ctx = canvas.getContext('2d');
      
      if (!isDrawingRef.current) {
        ctx.beginPath();
        ctx.moveTo(canvasX, canvasY);
        isDrawingRef.current = true;
        currentPathRef.current = [{ x: canvasX, y: canvasY }];
      } else {
        ctx.lineTo(canvasX, canvasY);
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = isErasing ? 20 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        currentPathRef.current.push({ x: canvasX, y: canvasY });
      }
      setHasDrawn(true);
    } else {
      isDrawingRef.current = false;
      if (currentPathRef.current.length > 0) {
        pathsRef.current.push({
          points: currentPathRef.current,
          color: currentColor,
          isErasing
        });
        currentPathRef.current = [];
      }
    }

    // Handle gestures
    if (gesture) {
      switch (gesture) {
        case 'colorPicker':
          setShowColorPicker(true);
          setColorPickerPosition({ x, y });
          break;
        case 'eraser':
          toggleEraser();
          break;
        case 'clear':
          handleReset();
          break;
        default:
          break;
      }
    }

    // Handle shape selection
    if (isSelecting) {
      const shapes = document.querySelectorAll('.shape-preview');
      shapes.forEach((shape, index) => {
        const shapeRect = shape.getBoundingClientRect();
        if (x >= shapeRect.left && x <= shapeRect.right &&
            y >= shapeRect.top && y <= shapeRect.bottom) {
          handleShapeSelect(index);
        }
      });
    }
  };

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    setContext(ctx);

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleColorChange = (color) => {
    setCurrentColor(color);
    if (context) {
      context.strokeStyle = color;
    }
    setCurrentTool('pen');
  };

  return (
    <div className="drawing-game">
      <div className="badges-container">
        {earnedBadges.map((badge, index) => (
          <div key={badge.id} className="heart-badge" style={{ '--index': index }}>
            <div className="badge-content">
              <span className="badge-icon">❤️</span>
            </div>
          </div>
        ))}
      </div>

      <div className="top-controls">
        <div className="color-palette">
          {Object.entries(colors).map(([color, value]) => (
            <button
              key={value}
              className={`color-option ${currentColor === value ? 'selected' : ''}`}
              style={{ backgroundColor: value }}
              onClick={() => handleColorChange(value)}
              aria-label={`Select ${color} color`}
            >
              {currentColor === value && <span className="selected-check">✔</span>}
            </button>
          ))}
        </div>

        <div className="drawing-tools">
          <div 
            className={`eraser-tool ${isErasing ? 'active' : ''}`}
            onClick={toggleEraser}
            title="Click to toggle eraser"
          >
            🧽
          </div>
          <div 
            className="clear-tool"
            onClick={handleReset}
            title="Click to clear drawing"
          >
            🗑️
          </div>
        </div>
      </div>

      <div className="game-layout">
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            width={800}
            height={400}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>
        
        <div className="shape-selector">
          <h3>Choose a Shape</h3>
          <div className="shape-list">
            {SHAPES[theme]?.map((shape, index) => (
              <div
                key={shape.name}
                className={`shape-option ${selectedShape === index ? 'selected' : ''}`}
                onClick={() => handleShapeSelect(index)}
              >
                <canvas 
                  className="shape-preview-canvas" 
                  width="100" 
                  height="100"
                  title={shape.name}
                />
                {selectedShape === index && <span className="shape-selected">✨</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={handleFinish}
        disabled={!hasDrawn}
        className="finish-button"
      >
        ✨ Finish ✨
      </button>
      
      {showEncouragement && (
        <div className="encouragement-message">
          {getRandomEncouragement()}
        </div>
      )}

      <div className="gesture-instructions">
        <h3>Gesture Controls</h3>
        <div className="gesture-instruction">
          <span className="gesture-icon">✌️</span>
          <span>Two fingers up: Color picker</span>
        </div>
        <div className="gesture-instruction">
          <span className="gesture-icon">☝️</span>
          <span>One finger up: Eraser</span>
        </div>
        <div className="gesture-instruction">
          <span className="gesture-icon">✋</span>
          <span>All fingers up: Clear canvas</span>
        </div>
        <div className="gesture-instruction">
          <span className="gesture-icon">🤏</span>
          <span>Pinch: Draw</span>
        </div>
      </div>

      {showColorPicker && (
        <div 
          className="color-picker"
          style={{
            left: colorPickerPosition.x,
            top: colorPickerPosition.y
          }}
        >
          {['#4D96FF', '#FF6B6B', '#6BCB77', '#FFD93D', '#FF8FB1'].map((color) => (
            <div
              key={color}
              className={`color-option ${color === currentColor ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorChange(color)}
            />
          ))}
        </div>
      )}

      <HandTracking onHandPosition={handleHandPosition} />
    </div>
  );
};

export default DrawingGame; 