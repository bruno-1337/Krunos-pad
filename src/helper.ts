const pathToRoomName = (url: string): string => {
    if (!url) return 'content';
    url += "/content";
    return url
        .replace(/\/+/g, ".")
        .replace(/(\.){2,}/g, ".")
        .replace(/^\./g, "");
};

export default pathToRoomName;
