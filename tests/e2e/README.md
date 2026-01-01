# End-to-End Tests

This directory contains comprehensive end-to-end tests for the Photo Butler AI image generation application using Playwright.

## Test Structure

### Test Files

- **`complete-generation-flow.spec.ts`** - Tests the complete user journey from image upload to download
- **`error-handling-flow.spec.ts`** - Tests error scenarios and recovery mechanisms
- **`responsive-layout.spec.ts`** - Tests responsive design across different screen sizes
- **`smoke.spec.ts`** - Basic smoke tests to verify application loads correctly

### Support Files

- **`fixtures.ts`** - Custom test fixtures and helper functions
- **`test-config.ts`** - Configuration constants and test data
- **`setup.ts`** - Global setup and cleanup functions

## Test Coverage

### Complete Generation Flow
✅ Full workflow: upload → template selection → prompt editing → generation → download  
✅ State consistency throughout the flow  
✅ Multiple sequential generations  
✅ History record creation and persistence  

### Error Handling
✅ Invalid file format rejection  
✅ Empty prompt validation  
✅ API failure handling with retry mechanism  
✅ Network timeout handling  
✅ localStorage quota exceeded scenarios  
✅ Missing templates graceful handling  
✅ Error recovery and retry functionality  

### Responsive Design
✅ Desktop multi-column layout  
✅ Mobile single-column layout  
✅ Dynamic layout adaptation on screen size changes  
✅ Mobile camera/gallery upload support  
✅ Cross-device usability testing  
✅ Orientation change handling  
✅ Touch target accessibility on mobile  

## Running Tests

### Prerequisites

1. Ensure both frontend and backend development servers can be started
2. Install Playwright browsers: `npx playwright install`
3. Verify test images exist in the `image/` directory

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI (interactive mode)
npm run test:e2e:ui

# Run tests in headed mode (show browser)
npm run test:e2e:headed

# Debug tests step by step
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run specific test file
npx playwright test complete-generation-flow.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium

# Run tests on mobile
npx playwright test --project="Mobile Chrome"
```

### Test Configuration

The tests are configured in `playwright.config.ts` with:

- **Multiple browsers**: Chromium, Firefox, WebKit
- **Mobile devices**: Mobile Chrome, Mobile Safari
- **Automatic server startup**: Frontend (port 3000) and Backend (port 3001)
- **Parallel execution**: Tests run in parallel for faster execution
- **Retry mechanism**: Automatic retry on CI environments
- **Trace collection**: Traces collected on test failures

## Test Data

### Images Used
- `image/film-grid-rainy-night.jpg` - Valid JPG for testing
- `image/placeholder.png` - Valid PNG for testing  
- `README.md` - Invalid file format for error testing

### Mock Responses
Tests include comprehensive mocking for:
- Successful API responses
- Various error conditions
- Timeout scenarios
- Empty data states

## Best Practices

### Test Organization
- Each test file focuses on a specific aspect of functionality
- Tests are grouped into logical describe blocks
- Helper functions are extracted to fixtures for reusability

### Assertions
- Use semantic assertions (`toBeVisible`, `toContainText`)
- Verify both positive and negative scenarios
- Check state consistency across user interactions

### Error Handling
- Test both expected and unexpected error conditions
- Verify error messages are user-friendly
- Ensure recovery mechanisms work correctly

### Performance
- Use appropriate timeouts for different operations
- Wait for network idle state when needed
- Minimize test execution time while maintaining reliability

## Debugging

### Common Issues

1. **Tests timing out**
   - Check if development servers are running
   - Verify API endpoints are accessible
   - Increase timeout for slow operations

2. **Element not found**
   - Verify data-testid attributes exist in components
   - Check if elements are rendered conditionally
   - Use browser developer tools to inspect DOM

3. **Flaky tests**
   - Add proper wait conditions
   - Use `waitForLoadState('networkidle')`
   - Avoid hard-coded delays, use dynamic waits

### Debug Mode

Run tests in debug mode to step through execution:

```bash
npm run test:e2e:debug
```

This opens the Playwright Inspector where you can:
- Step through test execution
- Inspect page state at each step
- Modify selectors and assertions
- Record new test actions

## CI/CD Integration

Tests are configured to run in GitHub Actions:

- Triggered on push to main/develop branches
- Runs on Ubuntu with Node.js 18
- Installs all dependencies and browsers
- Uploads test reports as artifacts
- Fails the build if tests fail

## Maintenance

### Adding New Tests

1. Create test file in `tests/e2e/`
2. Import fixtures: `import { test, expect } from './fixtures';`
3. Use helper functions from `PhotoButlerPage` class
4. Follow existing naming conventions for test IDs
5. Add appropriate assertions and error handling

### Updating Selectors

When UI changes, update selectors in:
- `test-config.ts` for commonly used selectors
- Individual test files for specific selectors
- `fixtures.ts` for helper function selectors

### Performance Optimization

- Run tests in parallel when possible
- Use efficient selectors (data-testid preferred)
- Minimize page reloads and navigation
- Cache common setup operations

## Reporting

Test results are available in multiple formats:

- **Console output**: Real-time test execution status
- **HTML report**: Detailed results with screenshots and traces
- **JUnit XML**: For CI/CD integration
- **JSON**: For programmatic analysis

Access reports via:
```bash
npm run test:e2e:report
```

## Contributing

When adding new features:

1. Add corresponding E2E tests
2. Update test documentation
3. Ensure tests pass in all browsers
4. Add appropriate data-testid attributes to new components
5. Consider mobile and responsive scenarios