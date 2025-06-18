const API_URL = 'http://localhost:3001';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// API calls
const api = {
  // Save game progress
  saveProgress: async (themeId, shapeId, accuracy, timeSpent) => {
    try {
      const response = await fetch(`${API_URL}/progress/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          themeId,
          shapeId,
          accuracy,
          timeSpent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  },

  // Get user progress
  getUserProgress: async () => {
    try {
      const response = await fetch(`${API_URL}/progress/user`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching progress:', error);
      throw error;
    }
  }
};

export default api; 