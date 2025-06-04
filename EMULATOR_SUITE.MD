## Firebase Emulator Suite Setup

### Initial Setup
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init
```

### Configure Emulators
```bash
# Initialize emulators
firebase init emulators

# Answer the prompts:
# - Which emulators do you want to set up? (Select what you need)
# - Which port do you want to use for the auth emulator? (Default: 9099)
# - Which port do you want to use for the functions emulator? (Default: 5001)
# - Which port do you want to use for the storage emulator? (Default: 9199)
# - Which port do you want to use for the emulator UI? (Default: 4000)
# - Would you like to download the emulators now? (Yes)
```

### Environment Variables
```bash
# Set up application default credentials
firebase login:application-default
```

### Running Emulators
you can start here :)
```bash
# Start all emulators
firebase emulators:start

# Start specific emulators only
firebase emulators:start --only storage
firebase emulators:start --only functions
firebase emulators:start --only auth
firebase emulators:start --only storage,functions

# Clear emulator data
firebase emulators:start --clear-data
```

### Testing Setup
```typescript
// functions/src/test-upload.ts
import * as admin from 'firebase-admin';

// Set emulator hosts
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';
process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = 'localhost:5001';

// Initialize Firebase Admin
admin.initializeApp({
    storageBucket: 'your-project-id.appspot.com'
});
```

### Running Tests
```bash
# In functions directory
npx ts-node src/test-upload.ts
```

### Monitoring
- Emulator UI: http://localhost:4000
- Functions logs: In terminal where emulators are running
- Storage logs: In emulator UI under Storage tab

### Common Issues & Solutions
- Port conflicts: Change ports in `firebase.json`
- Credentials: Use `firebase login:application-default`
- Multiple instances: Kill existing processes or use different ports

### firebase.json Configuration
```json
{
  "emulators": {
    "functions": {
      "port": 5001
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### Testing Cloud Functions
- Functions are automatically loaded into emulator
- No need to deploy to test
- Can monitor execution in emulator UI
- Can test triggers (storage, auth, etc.)

Remember:
- Emulators provide a local development environment
- No need to deploy to test functions
- Can test multiple Firebase services together
- Data is local and can be cleared with `--clear-data`
- Environment variables are needed for local testing
- Emulator UI provides monitoring and debugging tools