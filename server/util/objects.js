const { deepEqual } = require('fast-equals')

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

function isEqual(obj1, obj2){
    return deepEqual(obj1, obj2);
}

module.exports = {
    nullOrValue,
    isEqual,
    isEmpty
}