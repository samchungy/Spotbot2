const {deepEqual} = require('fast-equals');

/**
 * Returns a boolean based on if object is empty or not
 * @param {object} obj
 * @return {boolean} True or False
 */
function isEmpty(obj) {
  return obj.constructor === Object && Object.entries(obj).length === 0;
}

/**
 * Returns a value or null based on if it is empty
 * @param {object} obj
 * @return {object} Null or Value
 */
function nullOrValue(obj) {
  if (isEmpty(obj)) {
    return null;
  } else {
    return obj.Item.value;
  }
}

/**
 * Determines if an object's internal values are the same
 * @param {object} obj1
 * @param {object} obj2
 * @return {boolean} True or False
 */
function isEqual(obj1, obj2) {
  return deepEqual(obj1, obj2);
}

/**
 * Determines if a value is a Positive Integer value
 * @param {number} n
 * @return {boolean} True or False
 */
function isPositiveInteger(n) {
  return 0 === n % (!isNaN(parseFloat(n)) && 0 <= ~~n);
}

module.exports = {
  isEqual,
  isEmpty,
  isPositiveInteger,
  nullOrValue,
};
