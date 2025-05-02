# E2E Testing Strategy for AptosFS

This document outlines the strategy and implementation details for end-to-end testing of the AptosFS application.

## Technology Stack

For E2E testing, we use Playwright which offers:
- Cross-browser testing (Chromium, Firefox, WebKit)
- Reliable testing with auto-wait capabilities
- Mobile device emulation
- Visual comparison capabilities
- Network interception

## Test Structure

E2E tests focus on complete user flows rather than individual components. Our tests are organized around user journeys and critical features:

### Core User Flows

1. **Authentication Flow**
   - User registration
   - Login/logout
   - Wallet connection

2. **File Management Flow**
   - Uploading files
   - Downloading files
   - Creating folders
   - Moving and copying files
   - Renaming files
   - Deleting files

3. **Navigation Flow**
   - Browsing through folder hierarchy
   - Using breadcrumbs
   - Switching between views (grid/list)
   - Using shortcuts and keyboard navigation

### Test Organization

Tests are located in the `e2e/` directory with the following structure:

```
e2e/
├── fixtures/         # Test data files
├── support/          # Helper functions, custom commands
├── auth/             # Authentication tests
│   ├── login.spec.ts
│   └── wallet.spec.ts
├── files/            # File operations tests
│   ├── upload.spec.ts
│   ├── download.spec.ts
│   └── management.spec.ts
└── navigation/        # Navigation and UI tests
    ├── browse.spec.ts
    ├── views.spec.ts
    └── keyboard.spec.ts
```

## Best Practices

1. **Independent Tests**: Each test should be self-contained and not depend on the state from previous tests.

2. **Realistic Data**: Tests use realistic sample files and data that represent actual user scenarios.

3. **Page Object Model**: Tests use a Page Object Model pattern to encapsulate page behavior and reduce duplication.

4. **Custom Commands**: Common operations are abstracted into custom commands for readability.

5. **Accessibility Testing**: E2E tests include accessibility checks using Playwright's accessibility testing capabilities.

6. **Visual Testing**: Critical UI states are captured for visual regression testing.

## Setting Up Tests

1. Install Playwright:

```bash
npm install -D @playwright/test
npx playwright install
```

2. Configure Playwright (playwright.config.ts):

```typescript
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
    {
      name: 'mobile-chrome',
      use: {
        browserName: 'chromium',
        viewport: { width: 414, height: 896 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
};

export default config;
```

## Sample Test

Example of a file upload test:

```typescript
import { test, expect } from '@playwright/test';
import { FileManagerPage } from '../support/pages/file-manager';

test.describe('File Upload', () => {
  let fileManagerPage: FileManagerPage;

  test.beforeEach(async ({ page }) => {
    fileManagerPage = new FileManagerPage(page);
    await fileManagerPage.goto();
    await fileManagerPage.login('testuser', 'password');
  });

  test('should upload a single file', async ({ page }) => {
    // Set up file to upload
    const fileName = 'test-file.txt';
    
    // Perform upload
    await fileManagerPage.uploadFile(fileName);
    
    // Verify file appears in the list
    await expect(fileManagerPage.getFileByName(fileName)).toBeVisible();
  });

  test('should support multiple file upload', async ({ page }) => {
    // Set up files to upload
    const fileNames = ['file1.txt', 'file2.jpg', 'file3.pdf'];
    
    // Perform upload
    await fileManagerPage.uploadFiles(fileNames);
    
    // Verify all files appear in the list
    for (const fileName of fileNames) {
      await expect(fileManagerPage.getFileByName(fileName)).toBeVisible();
    }
  });

  test('should show progress during upload', async ({ page }) => {
    // Set up a large file to upload
    const fileName = 'large-file.zip';
    
    // Start upload
    const uploadPromise = fileManagerPage.uploadFile(fileName, { waitForCompletion: false });
    
    // Verify progress indicator is shown
    await expect(fileManagerPage.progressIndicator).toBeVisible();
    
    // Wait for upload to complete
    await uploadPromise;
    
    // Verify file appears and progress indicator is hidden
    await expect(fileManagerPage.getFileByName(fileName)).toBeVisible();
    await expect(fileManagerPage.progressIndicator).not.toBeVisible();
  });
});
```

## Visual Regression Testing

Visual regression tests capture screenshots of key UI states and compare them to baseline images to detect unexpected visual changes:

```typescript
import { test, expect } from '@playwright/test';
import { FileManagerPage } from '../support/pages/file-manager';

test.describe('Visual Regression', () => {
  let fileManagerPage: FileManagerPage;

  test.beforeEach(async ({ page }) => {
    fileManagerPage = new FileManagerPage(page);
    await fileManagerPage.goto();
    await fileManagerPage.login('testuser', 'password');
  });

  test('empty folder state looks correct', async ({ page }) => {
    await fileManagerPage.navigateToEmptyFolder();
    await expect(page).toHaveScreenshot('empty-folder.png');
  });

  test('grid view with files looks correct', async ({ page }) => {
    await fileManagerPage.navigateToFolderWithFiles();
    await fileManagerPage.switchToGridView();
    await expect(page).toHaveScreenshot('grid-view.png');
  });

  test('list view with files looks correct', async ({ page }) => {
    await fileManagerPage.navigateToFolderWithFiles();
    await fileManagerPage.switchToListView();
    await expect(page).toHaveScreenshot('list-view.png');
  });
});
```

## Continuous Integration

E2E tests are integrated into the CI pipeline, running on:
- Pull requests (limited subset)
- Nightly builds (full test suite)
- Release branches (full test suite with cross-browser testing)

Test reports and screenshots are saved as artifacts for easy debugging when tests fail in CI.

## Conclusion

This E2E testing strategy provides comprehensive coverage of critical user flows while balancing test reliability and execution speed. By focusing on user journeys rather than implementation details, these tests verify that the application works correctly from the user's perspective.