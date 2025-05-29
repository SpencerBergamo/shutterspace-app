// Flag to control whether to use mock data in development

const MOCK_DATA = {
    user: {
        id: '1',
        email: 'spencer@example.com',
        nickname: 'Test User',
    },

    users: {
        publicProfile: {
            id: '2',
            email: 'public-user-1@example.com',
            nickname: 'Public One',
        },
        privateProfile: {
            id: '3',
            email: 'public-user-2@example.com',
            nickname: 'Public Two',
        },
    },

    albums: [
        {
            albumId: 'album1',
            hostId: '1',
            expiresAt: null,
            joinToken: 'join-token-1',
            title: 'Summer Vacation 2024',
            description: 'Photos from our amazing summer trip',
            createdAt: new Date('2024-03-15'),
            updatedAt: new Date('2024-03-15'),
            lastMessage: {
                id: 'msg1',
                content: 'Just added some new photos!',
                senderId: '1',
                timestamp: new Date('2024-03-15')
            },
            albumCover: {
                url: 'https://example.com/cover1.jpg',
                thumbnailUrl: 'https://example.com/cover1-thumb.jpg'
            },
            maxMembers: 10,
            openInvites: true,
            joinRequests: [],
            members: ['1', '2'],
            moderators: ['1'],
            permenantCover: null
        },
        {
            albumId: 'album2',
            hostId: '2',
            expiresAt: new Date('2024-12-31'),
            joinToken: 'join-token-2',
            title: 'Family Reunion',
            description: 'Annual family gathering photos',
            createdAt: new Date('2024-03-10'),
            updatedAt: new Date('2024-03-14'),
            lastMessage: {
                id: 'msg2',
                content: 'Can\'t wait to see everyone!',
                senderId: '2',
                timestamp: new Date('2024-03-14')
            },
            albumCover: {
                url: 'https://example.com/cover2.jpg',
                thumbnailUrl: 'https://example.com/cover2-thumb.jpg'
            },
            maxMembers: 20,
            openInvites: false,
            joinRequests: ['3'],
            members: ['1', '2'],
            moderators: ['2'],
            permenantCover: 'https://example.com/permanent-cover2.jpg'
        }
    ],

    media: {
        imageCount: 13
    }
}

export const isUsingMockData = __DEV__;
export const userMockData = MOCK_DATA.user;
export const albumMockData = MOCK_DATA.albums;
export const mediaMockData = MOCK_DATA.media;