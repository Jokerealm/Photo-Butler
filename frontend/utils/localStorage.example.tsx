/**
 * Example usage of localStorage utilities
 * This file demonstrates how to integrate the localStorage functions with React components
 */

import React from 'react';
import { 
  HistoryItem, 
  saveHistoryItem, 
  loadHistory, 
  clearHistory, 
  generateHistoryId 
} from './localStorage';

// Example: How to save a generation result to history
export function saveGenerationToHistory(
  originalImageUrl: string,
  generatedImageUrl: string,
  template: string,
  prompt: string
): void {
  const historyItem: HistoryItem = {
    id: generateHistoryId(),
    originalImageUrl,
    generatedImageUrl,
    template,
    prompt,
    timestamp: Date.now()
  };

  try {
    saveHistoryItem(historyItem);
    console.log('Generation saved to history successfully');
  } catch (error) {
    console.error('Failed to save generation to history:', error);
    // Handle error (e.g., show toast notification to user)
  }
}

// Example: React hook for managing history
export function useHistory() {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load history on component mount
  React.useEffect(() => {
    try {
      const loadedHistory = loadHistory();
      setHistory(loadedHistory);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to add new item to history
  const addToHistory = React.useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    try {
      const historyItem: HistoryItem = {
        ...item,
        id: generateHistoryId(),
        timestamp: Date.now()
      };
      
      saveHistoryItem(historyItem);
      setHistory(prev => [historyItem, ...prev]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save to history');
    }
  }, []);

  // Function to clear all history
  const clearAllHistory = React.useCallback(() => {
    try {
      clearHistory();
      setHistory([]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear history');
    }
  }, []);

  return {
    history,
    loading,
    error,
    addToHistory,
    clearAllHistory
  };
}

// Example: Component that uses the history utilities
export function HistoryExample() {
  const { history, loading, error, addToHistory, clearAllHistory } = useHistory();

  if (loading) {
    return <div>Loading history...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Generation History ({history.length} items)</h2>
      
      <button onClick={clearAllHistory}>
        Clear All History
      </button>

      <div className="history-list">
        {history.map((item) => (
          <div key={item.id} className="history-item">
            <img src={item.originalImageUrl} alt="Original" width={100} />
            <img src={item.generatedImageUrl} alt="Generated" width={100} />
            <div>
              <p>Template: {item.template}</p>
              <p>Prompt: {item.prompt}</p>
              <p>Date: {new Date(item.timestamp).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {history.length === 0 && (
        <p>No generation history yet. Generate some images to see them here!</p>
      )}
    </div>
  );
}

// Note: This example shows how to use the localStorage utilities with React components