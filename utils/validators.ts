
export function validateEmail(email: string) {
    if (!email) return 'Email is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email address';

    return null;
}

export function validatePassword(password: string) {
    if (!password) return 'Password is required';

    if (password.length < 8) return 'Password must be at least 8 characters';
}

export function validateConfirmPassword(password: string, confirmPassword: string) {
    if (!confirmPassword) return 'Confirm password is required';
    if (password !== confirmPassword) return 'Passwords do not match';
}

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