# Deep Link Testing Guide for Shutterspace

This guide explains how to test the deep link functionality for album joining in the Shutterspace app.

## Deep Link Configuration

The app supports the following deep link patterns:

### URL Schemes
- **Native App**: `shutterspace://`
- **Web URL**: `https://shutterspace.app`
- **Web URL (HTTP)**: `http://shutterspace.app`

### Album Join Pattern
- **Pattern**: `join/:albumId`
- **Examples**:
  - `shutterspace://join/album123`
  - `https://shutterspace.app/join/album123`

## Testing Methods

### 1. Using the Built-in Test Page

The app includes a test page accessible at `/deep-link-test` that provides:
- Link generation utilities
- URL parsing tests
- Navigation testing
- Current URL inspection

To access the test page:
1. Run the app
2. Navigate to Home page (if authenticated)
3. Tap "Test Deep Links" button

### 2. Manual Testing with ADB (Android)

```bash
# Test native deep link
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "shutterspace://join/test-album-123" \
  org.bbtechnologies.shutterspace

# Test web URL deep link
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "https://shutterspace.app/join/test-album-123" \
  org.bbtechnologies.shutterspace
```

### 3. Manual Testing with iOS Simulator

```bash
# Test native deep link
xcrun simctl openurl booted "shutterspace://join/test-album-123"

# Test web URL deep link
xcrun simctl openurl booted "https://shutterspace.app/join/test-album-123"
```

### 4. Testing in Development

When using Expo development builds:

```bash
# Start the development server
npx expo start

# Use the Expo CLI to test deep links
npx uri-scheme open shutterspace://join/test-album-123 --ios
npx uri-scheme open shutterspace://join/test-album-123 --android
```

## Expected Behavior

### Authenticated Users
1. Deep link opens the app
2. Navigates to the join page (`/join/[albumId]`)
3. Displays album join interface with the extracted album ID
4. User can join the album or cancel

### Unauthenticated Users
1. Deep link opens the app
2. Navigates to the join page
3. Shows authentication prompt
4. Redirects to sign-in page
5. After successful authentication, should handle the album join

## URL Validation

The deep linking utility provides functions to:
- Generate valid album join links
- Parse and validate incoming URLs
- Extract album IDs from deep links

### Example Usage

```typescript
import { 
  createAlbumJoinLink, 
  createAlbumJoinWebLink, 
  parseAlbumJoinLink 
} from '@/utils/deepLinking';

// Generate links
const nativeLink = createAlbumJoinLink('album123');
// Result: "shutterspace://join/album123"

const webLink = createAlbumJoinWebLink('album123');
// Result: "https://shutterspace.app/join/album123"

// Parse incoming links
const albumId = parseAlbumJoinLink('shutterspace://join/album123');
// Result: "album123"
```

## Troubleshooting

### Common Issues

1. **Deep link doesn't open the app**
   - Verify the app is installed
   - Check that the URL scheme is correct
   - Ensure the app.json configuration is properly set

2. **App opens but doesn't navigate to join page**
   - Check that the route is properly configured in `app/_layout.tsx`
   - Verify the URL pattern matches the expected format

3. **Album ID not extracted correctly**
   - Use the test page to verify URL parsing
   - Check console logs for parsing errors

### Debug Information

The join page logs useful information:
- Extracted album ID
- User authentication status
- Navigation events

Check the console output when testing deep links.

## Production Testing

For production testing:
1. Build and install the production app
2. Create test album join links
3. Share links via messaging apps, email, or QR codes
4. Verify the app opens and navigates correctly
5. Test both authenticated and unauthenticated flows

## Integration with Album Sharing

To implement actual album joining:
1. Update the `handleJoinAlbum` function in `app/join/[albumId].tsx`
2. Add API calls to your backend service
3. Implement proper error handling
4. Add success/failure feedback to users