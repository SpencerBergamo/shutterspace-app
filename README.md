# Shutterspace 📸

A photo-sharing mobile app built with React Native that lets you capture, organize, and share your memories with friends and family.

## 🛠️ Tech Stack

Shutterspace is built using modern tools that make development fast and scalable:

- **[React Native](https://reactnative.dev/)** - Cross-platform mobile framework
- **[Expo](https://expo.dev)** - Development platform with file-based routing
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Convex](https://www.convex.dev/)** - Real-time backend database
- **[Firebase](https://firebase.google.com/)** - Authentication and cloud storage
- **[Cloudflare R2](https://www.cloudflare.com/products/r2/)** - Media storage and delivery
- **[Turborepo](https://turbo.build/)** - Monorepo build system
- **[Zustand](https://github.com/pmndrs/zustand)** - Lightweight state management

### Project Structure

This is a monorepo organized with workspaces:

```
shutterspace-app/
├── apps/
│   └── expo/          # React Native mobile app
└── packages/
    └── backend/       # Convex backend functions
```

## 🚀 Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the app**

   ```bash
   npx expo start
   ```

3. **Run on a device**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan the QR code with Expo Go on your phone

## 🤝 Contributing

Want to help make Shutterspace better? Here's how:

1. **Fork the repository** and clone it locally
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and test them thoroughly
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to your branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request** and describe what you've built

### Development Tips

- The mobile app lives in `apps/expo/`
- Backend functions are in `packages/backend/convex/`
- Use Turborepo commands to run tasks across workspaces
- Follow existing code patterns and component structure

## 📱 Building for Production

**Android Simulator Build**
```bash
eas build --platform android --profile development
```

**iOS Simulator Build**
```bash
eas build --platform ios --profile ios-simulator
```


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


### Components Directory
```
components/
  ├── ui/                    # Reusable UI components
  │   ├── Button.tsx
  │   ├── Input.tsx
  │   ├── MediaTile.tsx
  │   └── FloatingActionButton.tsx
  ├── AlbumGrid.tsx         # Feature component
  ├── ProfileHeader.tsx     # Feature component
  └── layout/              # Layout components
      └── MainLayout.tsx
```
