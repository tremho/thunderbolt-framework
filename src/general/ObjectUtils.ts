export function flatten(obj) {
    const flatObj = {}
    Object.getOwnPropertyNames(obj).forEach(prop => {

        let value = obj[prop]
        if( typeof value === 'object') {
            if(!Array.isArray(value)) {
                value = this.flatten(value)
            }
        }
        flatObj[prop] = value
    })
    return flatObj
}
