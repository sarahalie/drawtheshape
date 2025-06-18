// Theme ID mapping
const THEME_IDS = {
  geometry: 1,
  nature: 2,
  abstract: 3
};

// Shape ID mapping (themeId_levelNumber format)
const SHAPE_IDS = {
  geometry: {
    1: 1,  // Rectangle
    2: 2,  // Pentagon
    3: 3,  // Triangle
    4: 4,  // Square
    5: 5,  // Heart
    6: 6,  // Circle
    7: 7,  // Diamond
    8: 8,  // Semi Circle
    9: 9,  // Rhombus
    10: 10 // Trapezoid
  },
  nature: {
    1: 11, // Leaf
    2: 12, // Tree
    3: 13, // Mountain
    4: 14, // Cloud
    5: 15, // Apple
    6: 16, // Flower
    7: 17, // Butterfly
    8: 18, // Star
    9: 19, // Sun
    10: 20 // Moon
  },
  abstract: {
    1: 21,
    2: 22,
    3: 23,
    4: 24,
    5: 25,
    6: 26,
    7: 27,
    8: 28,
    9: 29,
    10: 30
  }
};

export const getThemeId = (themeName) => {
  return THEME_IDS[themeName.toLowerCase()];
};

export const getShapeId = (themeName, level) => {
  return SHAPE_IDS[themeName.toLowerCase()][level];
}; 