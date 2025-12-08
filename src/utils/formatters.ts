export function formatAlbumData(creationTime: number): string {
    const date = new Date(creationTime);
    const currentYear = new Date().getFullYear();
    const dateYear = date.getFullYear();
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

    if (dateYear !== currentYear) {
        options.year = 'numeric';
    }

    return date.toLocaleDateString('en-US', options);
}

export function formatVideoDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
