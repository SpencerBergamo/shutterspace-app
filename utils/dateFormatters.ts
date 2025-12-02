

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

export function formatDateRange(start: Date, end: Date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const startMonth = months[start.getMonth()];
    const endMonth = months[end.getMonth()];
    const startDay = start.getDate();
    const endDay = end.getDate();
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear < currentYear || endYear < currentYear) {
        throw new Error('Start or end year is before current year');
    }

    if (startYear === currentYear && endYear === currentYear) {
        return {
            start: `${startMonth} ${startDay}`,
            end: `${endMonth} ${endDay}`
        }
    }


    if (startYear === currentYear && endYear !== currentYear) {
        return {
            start: `${startMonth} ${startDay}`,
            end: `${endMonth} ${endDay}, ${endYear}`
        }
    }

    return {
        start: `${startMonth} ${startDay}, ${startYear}`,
        end: `${endMonth} ${endDay}, ${endYear}`
    }
}

export function formatDate(date: Date) {

    return {
        date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
        }),
        time: date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }),
    }
}



export function formatTime(date: Date) { }