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
}

export const isUsingMockData = __DEV__;
export const userMockData = MOCK_DATA.user;