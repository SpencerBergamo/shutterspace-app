import * as Linking from 'expo-linking';

// Deep link configuration for the Shutterspace app
export const linkingConfig = {
  prefixes: [
    'shutterspace://',
    'https://shutterspace.app',
    'http://shutterspace.app'
  ],
  config: {
    screens: {
      // Auth screens
      '(auth)': {
        screens: {
          'sign-in': 'sign-in',
          'sign-up': 'sign-up',
        }
      },
      // App screens
      '(app)': {
        screens: {
          index: '',
        }
      },
      // Deep link for joining albums
      'join/[albumId]': 'join/:albumId',
    }
  }
};

// Utility function to create album join links
export const createAlbumJoinLink = (albumId: string) => {
  return `shutterspace://join/${albumId}`;
};

// Utility function to create album join web links
export const createAlbumJoinWebLink = (albumId: string) => {
  return `https://shutterspace.app/join/${albumId}`;
};

// Function to parse deep link URL and extract album ID
export const parseAlbumJoinLink = (url: string): string | null => {
  try {
    const parsedUrl = Linking.parse(url);
    if (parsedUrl.path?.includes('/join/')) {
      const albumId = parsedUrl.path.split('/join/')[1];
      return albumId || null;
    }
    return null;
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

// Function to handle incoming deep links
export const handleDeepLink = (url: string) => {
  console.log('Received deep link:', url);
  const albumId = parseAlbumJoinLink(url);
  if (albumId) {
    console.log('Album ID extracted:', albumId);
    return { type: 'albumJoin', albumId };
  }
  return null;
};