function isEmpty(obj){
    return Object.entries(obj).length === 0 && obj.constructor === Object
}

function nullOrValue(obj){
    if (isEmpty(obj)){
        return null
    } else {
        return obj.Item.value
    }
}

module.exports = {
    nullOrValue,
    isEmpty
}