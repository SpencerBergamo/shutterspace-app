# Shutterspace - React Native 📌

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


## EAS Build
**Development Build**
- npx expo install expo-dev-client -> package.json
- npm install -g eas-cli
- eas -v -> check version
- eas login -> follow login instructions
- eas whoami
- eas init -> select owner for project -> splitease (yes)
- eas build:configure -> select all platforms

**Build for Android Simulator** https://youtu.be/D612BUtvvl8?si=xraApImzTfYF3HK2
- simulator is .apk, Google Play format is .avi
- eas build --platform android --profile development
- you might need to create the package name, org.bbtechnologies.shutterspace

**Build for iOS Simulator** https://youtu.be/SgL97PFZctg?si=8WHlm2_PYQdVuX0C
- simulator is .app and physical device is .ipa
- eas build --platform ios --profile ios-simulator -> sign in on the simulator device
- npx expo start


## Syntax Notes
Notes and syntax patterns I've learned during my React Native journey.

### useEffect Hook
```typescript
useEffect(() => {
    // Effect code here
}, [/* dependency array */]);
```

#### Dependency Array Behavior
1. **Empty Array `[]`**
   - Effect runs once after initial mount
   - Never re-runs, even on re-renders
   - Use for: one-time setup (permissions, subscriptions, initial data fetching)
   ```typescript
   useEffect(() => {
       // Runs once on mount
   }, []);
   ```

2. **With Dependencies `[dep1, dep2]`**
   - Runs after initial mount
   - Re-runs when any dependency changes
   - Use for: effects that need to react to prop/state changes
   ```typescript
   useEffect(() => {
       // Runs on mount and when dep1 or dep2 changes
   }, [dep1, dep2]);
   ```

3. **No Dependency Array**
   - Runs after every render
   - Generally not recommended
   ```typescript
   useEffect(() => {
       // Runs on every render
   });
   ```

#### Common Use Cases
- Permission checks
- API calls
- Event listeners
- Subscriptions
- Cleanup operations

#### Cleanup Function
```typescript
useEffect(() => {
    // Setup code
    return () => {
        // Cleanup code
    };
}, []);
```

#### Best Practices
1. Always include dependencies that the effect uses
2. Use empty array `[]` for one-time setup
3. Return cleanup function when needed
4. Avoid infinite loops by carefully managing dependencies

### Async Functions and Dependencies
```typescript
// function declaration
async function myFunc() {}

// arrow funcion
const myFunc= async () => {}

// With Dependencies in useEffect
useEffect(() => {}, [/* Dependencies */])
```

#### When to use Each Pattern
1. **Function Declaration `async function`**
    - Use for standalone functions
    - better for hoisting
    - clearer stack traces

2. **Arry Functions `const func = async () => {}`**
    - Use for callbacks and event handlers
    - Maintains `this` context
    - Common in React components

3. **Async Functions in useEffect**
    - Must be defined inside useEffect
    - Need proper dependency management
    - should handle cleanup


