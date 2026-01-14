"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vcfExtractPhone = exports.pregMatchAll = exports.stripTags = exports.splitFirst = void 0;
const splitFirst = (str, delimiter) => {
    const index = str.indexOf(delimiter);
    if (index === -1)
        return [str];
    return [str.slice(0, index), str.slice(index + delimiter.length)];
};
exports.splitFirst = splitFirst;
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
const vcfExtractPhone = (vcf) => {
    const telLine = vcf
        .split('\n')
        .find((line) => line.startsWith('TEL'));
    if (telLine) {
        const phone = telLine.split(':')[1];
        return phone ? phone.trim() : null;
    }
    return null;
};
exports.vcfExtractPhone = vcfExtractPhone;
