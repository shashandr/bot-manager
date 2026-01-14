export const splitFirst = (str: string, delimiter: string): string[] => {
    const index = str.indexOf(delimiter)
    if (index === -1) return [str]

    return [str.slice(0, index), str.slice(index + delimiter.length)]
}

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

export const vcfExtractPhone = (vcf: string): string | null =>  {
    const telLine = vcf
        .split('\n')
        .find((line: string) => line.startsWith('TEL'))

    if (telLine) {
        const phone = telLine.split(':')[1]

        return phone ? phone.trim() : null
    }

    return null
}