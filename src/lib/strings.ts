export const stripTags = (str: string, allowed: string[]) => {
    allowed = allowed || []
    const tags = /<\/?([a-z][a-z0-9]*)\b[^>]*\/?>/gi
    const commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi
    return str
        .replaceAll('&nbsp;', ' ')
        .replace(commentsAndPhpTags, '')
        .replace(tags, function ($match, $tag) {
            return allowed.includes($tag.toLowerCase()) ? $match : ''
        })
}

export const pregMatchAll = (regex: RegExp, str: string): string[] => {
    return [...str.matchAll(new RegExp(regex, 'g'))].reduce((acc: string[], group): string[] => {
        group.forEach((element: string, i: number) => {
            if (!acc[i]) {
                // @ts-ignore
                acc[i] = []
            }
            // @ts-ignore
            acc[i].push(element)
        })
        return acc
    }, [])
}