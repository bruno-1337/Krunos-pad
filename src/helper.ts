const urlToDotPath = (url: string): string => {
    if (!url) return '/';
    url += "/content";
    return url
        .replace(/\/+/g, ".")
        .replace(/(\.){2,}/g, ".")
        .replace(/^\./g, "");
};

export default urlToDotPath;
