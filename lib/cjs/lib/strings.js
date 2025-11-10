"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pregMatchAll = exports.stripTags = void 0;
const stripTags = (str, allowed) => {
    allowed = allowed || [];
    const tags = /<\/?([a-z][a-z0-9]*)\b[^>]*\/?>/gi;
    const commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return str
        .replaceAll('&nbsp;', ' ')
        .replace(commentsAndPhpTags, '')
        .replace(tags, function ($match, $tag) {
        return allowed.includes($tag.toLowerCase()) ? $match : '';
    });
};
exports.stripTags = stripTags;
const pregMatchAll = (regex, str) => {
    return [...str.matchAll(new RegExp(regex, 'g'))].reduce((acc, group) => {
        group.forEach((element, i) => {
            if (!acc[i]) {
                // @ts-ignore
                acc[i] = [];
            }
            // @ts-ignore
            acc[i].push(element);
        });
        return acc;
    }, []);
};
exports.pregMatchAll = pregMatchAll;
