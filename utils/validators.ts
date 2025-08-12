

export function validateTitle(title: string) {
    if (!title) return 'Don\'t forget to title your album!';

    return null;
}

export function validateNickname(nickname: string) {
    if (!nickname) return 'Nickname is required';

    if (nickname.length < 3) return 'Nickname must be at least 3 characters';

    if (nickname.length > 30) return 'Nickname must be less than 30 characters';

    return null;
}