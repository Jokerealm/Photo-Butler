# localStorage Utilities

This directory contains utility functions for managing browser localStorage in the AI Image Generator application.

## Files

- `localStorage.ts` - Core localStorage utility functions
- `localStorage.test.ts` - Comprehensive test suite
- `localStorage.example.ts` - Usage examples and React integration patterns

## Core Functions

### `saveHistoryItem(historyItem: HistoryItem): void`
Saves a generation history item to localStorage.
- Automatically adds new items to the beginning of the history array
- Limits history to 100 items maximum
- Handles localStorage quota exceeded errors
- Throws error if localStorage is unavailable

### `loadHistory(): HistoryItem[]`
Loads and returns all history items from localStorage.
- Returns empty array if no history exists
- Filters out invalid/corrupted items
- Sorts items by timestamp in descending order (newest first)
- Handles JSON parsing errors gracefully

### `clearHistory(): void`
Removes all history items from localStorage.
- Throws error if localStorage is unavailable

### `removeHistoryItem(itemId: string): void`
Removes a specific history item by ID.
- Silently handles non-existent items
- Throws error if localStorage is unavailable

### `getHistoryStats(): { count: number; storageSize: number }`
Returns statistics about the stored history.
- `count`: Number of history items
- `storageSize`: Size of stored data in bytes

### `generateHistoryId(): string`
Generates a unique identifier for history items.
- Format: `history_{timestamp}_{random}`
- Guaranteed to be unique across calls

## Data Model

```typescript
interface HistoryItem {
  id: string;                    // Unique identifier
  originalImageUrl: string;      // URL of the original uploaded image
  generatedImageUrl: string;     // URL of the AI-generated image
  template: string;              // Name of the template used
  prompt: string;                // Prompt text used for generation
  timestamp: number;             // Generation timestamp (Date.now())
}
```

## Error Handling

The utilities handle several error scenarios:

1. **localStorage unavailable**: Returns empty arrays or throws descriptive errors
2. **Quota exceeded**: Throws specific error message suggesting to clear history
3. **Corrupted data**: Filters out invalid items and continues operation
4. **JSON parsing errors**: Returns empty array and logs error

## Usage Examples

### Basic Usage
```typescript
import { saveHistoryItem, loadHistory, generateHistoryId } from './localStorage';

// Save a generation result
const historyItem = {
  id: generateHistoryId(),
  originalImageUrl: 'blob:...',
  generatedImageUrl: 'https://...',
  template: 'Anime Style',
  prompt: 'A beautiful landscape',
  timestamp: Date.now()
};

saveHistoryItem(historyItem);

// Load all history
const history = loadHistory();
console.log(`Found ${history.length} items in history`);
```

### React Integration
See `localStorage.example.ts` for complete React hook and component examples.

## Testing

Run tests with:
```bash
npm test localStorage.test.ts
```

The test suite covers:
- All core functions
- Error scenarios
- Edge cases
- localStorage unavailability
- Data validation
- Sorting and filtering

## Performance Considerations

- History is limited to 100 items to prevent excessive storage usage
- Items are validated on load to filter out corrupted data
- Storage size is monitored via `getHistoryStats()`
- Failed operations are logged but don't crash the application

## Browser Compatibility

The utilities work in all modern browsers that support:
- localStorage API
- JSON.parse/stringify
- ES6+ features (const, arrow functions, etc.)

For older browsers, consider adding polyfills or graceful degradation.