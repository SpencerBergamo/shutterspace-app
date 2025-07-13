#!/usr/bin/env node

// Simple Node.js script to test deep link parsing without Expo dependencies
// This script validates the URL patterns and parsing logic

const testUrls = [
  'shutterspace://join/album123',
  'https://shutterspace.app/join/album456', 
  'http://shutterspace.app/join/test-album-789',
  'shutterspace://join/',
  'https://shutterspace.app/join',
  'shutterspace://other/path',
  'https://shutterspace.app/other/path',
  'invalid-url',
  'shutterspace://join/album-with-dashes',
  'https://shutterspace.app/join/album_with_underscores'
];

// Simplified parsing function for testing
function parseAlbumJoinLink(url) {
  try {
    // Handle different URL formats
    let path = '';
    
    if (url.startsWith('shutterspace://')) {
      path = url.replace('shutterspace://', '');
    } else if (url.startsWith('https://shutterspace.app')) {
      path = url.replace('https://shutterspace.app', '');
      if (path.startsWith('/')) path = path.substring(1);
    } else if (url.startsWith('http://shutterspace.app')) {
      path = url.replace('http://shutterspace.app', '');
      if (path.startsWith('/')) path = path.substring(1);
    } else {
      return null;
    }
    
    if (path.startsWith('join/')) {
      const albumId = path.replace('join/', '');
      return albumId || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}

// Function to create join links
function createAlbumJoinLink(albumId) {
  return `shutterspace://join/${albumId}`;
}

function createAlbumJoinWebLink(albumId) {
  return `https://shutterspace.app/join/${albumId}`;
}

console.log('🔗 Deep Link Testing for Shutterspace App');
console.log('============================================\n');

// Test URL parsing
console.log('📋 URL Parsing Tests:');
console.log('---------------------');
testUrls.forEach((url, index) => {
  const albumId = parseAlbumJoinLink(url);
  const status = albumId ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${url}`);
  if (albumId) {
    console.log(`   → Album ID: "${albumId}"`);
  }
  console.log('');
});

// Test link generation
console.log('\n🔧 Link Generation Tests:');
console.log('-------------------------');
const testAlbumIds = ['album123', 'test-album-456', 'album_with_underscores'];

testAlbumIds.forEach((albumId, index) => {
  const nativeLink = createAlbumJoinLink(albumId);
  const webLink = createAlbumJoinWebLink(albumId);
  
  console.log(`${index + 1}. Album ID: "${albumId}"`);
  console.log(`   Native: ${nativeLink}`);
  console.log(`   Web:    ${webLink}`);
  
  // Verify parsing works
  const parsedNative = parseAlbumJoinLink(nativeLink);
  const parsedWeb = parseAlbumJoinLink(webLink);
  
  console.log(`   Parse Native: ${parsedNative === albumId ? '✅' : '❌'} "${parsedNative}"`);
  console.log(`   Parse Web:    ${parsedWeb === albumId ? '✅' : '❌'} "${parsedWeb}"`);
  console.log('');
});

console.log('🎯 Expected Patterns:');
console.log('--------------------');
console.log('• shutterspace://join/[albumId]');
console.log('• https://shutterspace.app/join/[albumId]');
console.log('• http://shutterspace.app/join/[albumId]');
console.log('\n✨ Testing complete!');