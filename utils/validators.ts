import Graphemer from "graphemer";

export const splitter = new Graphemer();


export function validateEmail(email: string) {
    if (!email) return 'Email is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Invalid email address';

    return undefined;
}

export const passwordRules: string = "required: lower; required: upper; required: digit; minLength: 8; maxLength: 16;";
export function validatePassword(password: string) {
    if (!password) return 'Password is required';
}

export function validateAlbumTitle(title: string): string | undefined {
    if (!title) return 'Don\'t forget to title your album!';

    const charCount = splitter.countGraphemes(title);
    if (charCount > 30) return "Your title is just a bit too long";

    return undefined;
}

export function validateDescription(value: string) {
    const charCount = splitter.countGraphemes(value);
    if (charCount > 300) return 'Description must be less than 300 characters';

    return undefined;
}

export function validateNickname(nickname: string) {
    if (!nickname) return "Don't forget to give your profile a nickname!";

    const charCount = splitter.countGraphemes(nickname);
    if (charCount > 30) return "Your nickname is just a bit too long";

    return undefined;
}

// export function validateNickname(nickname: string) {
//     if (!nickname) return 'Nickname is required';

//     if (nickname.length < 3) return 'Nickname must be at least 3 characters';

//     if (nickname.length > 30) return 'Nickname must be less than 30 characters';

//     return null;
// }