# Convex Database Schema for Shutterspace

## Why Convex for Mobile Expo App?

Convex was chosen as the backend solution for Shutterspace due to several key advantages that align perfectly with mobile app development:

1. **Real-time by Default**: Built-in real-time subscriptions enable instant updates across all connected devices - perfect for photo albums where multiple users need to see new uploads immediately.

2. **Type Safety**: Full TypeScript support with auto-generated types ensures data consistency between frontend and backend, reducing runtime errors in production.

3. **Edge Functions**: Serverless functions run globally, providing low-latency responses for mobile users regardless of their location.

4. **Built-in Auth**: Seamless integration with Firebase Auth through Convex's auth system, eliminating the need for custom JWT handling.

5. **Automatic Optimizations**: Query optimization, caching, and indexing are handled automatically, crucial for mobile apps where performance directly impacts user experience.

6. **Zero DevOps**: No server management, scaling, or infrastructure concerns - perfect for mobile app development where backend complexity should be minimal.

7. **React Native Integration**: Excellent support for React Native with hooks like `useQuery` and `useMutation` that work seamlessly with Expo.

## Schema Overview

The database is designed around a **social photo-sharing model** with the following core entities:
- **Profiles**: User identity and authentication
- **Albums**: Photo collections with member management
- **Media**: Photos and videos with metadata
- **Social Features**: Friendships, comments, and likes
- **Access Control**: Role-based permissions and album membership

## Table Relationships & Design

### 1. Profiles Table
**Purpose**: Core user identity and authentication management

**Key Fields**:
- `firebaseUID`: Links to Firebase Auth for secure authentication
- `avatarKey`: Stores R2 storage key for profile pictures (not full URL)
- `authProvider`: Tracks authentication method (email, Google, Apple)

**Relationships**:
- One-to-many with `albums` (as host)
- One-to-many with `albumMembers` (as member)
- One-to-many with `media` (as uploader)
- One-to-many with `friendships` (both directions)

**Design Decisions**:
- `avatarKey` stores only the storage key, not full URL (constructed client-side)
- `joined` timestamp for user analytics and onboarding flows
- `authProvider` enables multi-provider authentication support

### 2. Albums Table
**Purpose**: Photo collection containers with metadata and access control

**Key Fields**:
- `hostId`: References the album creator/owner
- `staticCover`: Boolean flag for custom vs. auto-generated cover images
- `dateRange`: Optional time boundaries for the album content
- `openInvites`: Boolean for public vs. private album access

**Relationships**:
- Many-to-one with `profiles` (host)
- One-to-many with `albumMembers` (members)
- One-to-many with `media` (content)

**Design Decisions**:
- `staticCover` allows for custom album covers vs. auto-generated thumbnails
- `dateRange` supports event-based albums (weddings, vacations, etc.)
- `openInvites` enables both private and public album sharing models

### 3. AlbumMembers Table
**Purpose**: Role-based access control and membership management

**Key Fields**:
- `role`: Three-tier permission system (member, moderator, host)
- `joinedAt`: Timestamp for membership tracking

**Relationships**:
- Many-to-one with `albums` (album)
- Many-to-one with `profiles` (member)

**Indexes**:
- `by_albumId`: Efficient member listing per album
- `by_profileId`: Quick album discovery per user
- `by_album_profileId`: Fast membership validation

**Design Decisions**:
- Three-role system provides granular permissions
- Separate table enables many-to-many relationships efficiently
- Indexes optimize common query patterns

### 4. Media Table
**Purpose**: Photo and video storage with metadata and access URLs

**Key Fields**:
- `downloadUrl`: Signed URL for full-resolution media access
- `thumbnailUrl`: Signed URL for optimized thumbnail display
- `type`: Distinguishes between images and videos
- `width/height`: Dimensions for responsive UI rendering
- `duration`: Optional video length (images are null)

**Relationships**:
- Many-to-one with `albums` (container)
- Many-to-one with `profiles` (uploader)

**Design Decisions**:
- Separate `downloadUrl` and `thumbnailUrl` for performance optimization
- `duration` only applies to videos, reducing storage for images
- Dimensions enable responsive grid layouts and proper aspect ratios

### 5. Comments Table
**Purpose**: Social interaction through threaded comments on media

**Key Fields**:
- `parentCommentId`: Enables threaded replies and conversations
- `createdAt`: Chronological ordering and moderation

**Relationships**:
- Many-to-one with `media` (commented content)
- Many-to-one with `profiles` (commenter)
- Self-referencing for threaded replies

**Indexes**:
- `by_mediaId_createdAt`: Efficient chronological comment loading
- `by_parentCommentId`: Fast reply threading

**Design Decisions**:
- Threaded comments enable rich conversations
- Chronological indexing optimizes feed loading
- Separate table keeps media queries fast

### 6. Likes Table
**Purpose**: Simple social engagement tracking

**Key Fields**:
- `createdAt`: Timestamp for like activity

**Relationships**:
- Many-to-one with `media` (liked content)
- Many-to-one with `profiles` (user who liked)

**Indexes**:
- `by_mediaId_profileId`: Prevents duplicate likes
- `by_mediaId`: Fast like count aggregation

**Design Decisions**:
- Simple structure for performance
- Composite index prevents duplicate likes efficiently
- Timestamp enables activity feeds and analytics

### 7. Friendships Table
**Purpose**: Social connections between users

**Key Fields**:
- `status`: Three-state friendship (pending, accepted, blocked)
- `createdAt/updatedAt`: Friendship lifecycle tracking

**Relationships**:
- Many-to-one with `profiles` (both directions)

**Indexes**:
- `by_pair` and `by_pair_reverse`: Efficient bidirectional friendship lookup
- `by_user_and_status`: Fast status-based queries

**Design Decisions**:
- Bidirectional indexing for efficient friendship validation
- Three-state system handles all social scenarios
- Timestamps enable friendship analytics and notifications

### ConvexProviderWithAuth UserIdentity Object
```typescript
interface UserIdentity {
    tokenIdentifier: string;  //  Firebase UID (e.g., "abc123...")
    name?: string;            // From Firebase user.displayName
    email?: string;           // From Firebase user.email
    pictureUrl?: string;      // From Firebase user.photoURL
    emailVerified: boolean;   // From Firebase user.emailVerified
}
```

## Schema Evolution Strategy

Following Convex best practices for production deployments:

1. **Add New Fields as Optional**: Prevents breaking existing data
2. **Use v.union for Type Transitions**: Enables gradual schema migrations
3. **Mark Fields Optional Before Deletion**: Safe field removal process
4. **Test in Development**: Validate changes before production deployment

## Deployment Commands

```bash
# Development environment
npx convex dev

# Production deployment (when schema changes are ready)
npx convex deploy
```

## Performance Considerations

1. **Indexing Strategy**: Composite indexes optimize common query patterns
2. **Real-time Subscriptions**: Efficient updates for mobile app responsiveness
3. **Query Optimization**: Convex automatically optimizes complex queries
4. **Edge Caching**: Global distribution reduces latency for mobile users

## Security Model

1. **Row-Level Security**: Auth rules ensure users only access authorized data
2. **Role-Based Access**: Album membership controls media visibility
3. **Signed URLs**: R2 integration provides secure, time-limited media access
4. **Firebase Integration**: Leverages proven authentication system

This schema design prioritizes **performance**, **scalability**, and **user experience** while maintaining **security** and **data integrity** - essential requirements for a successful mobile photo-sharing application.
