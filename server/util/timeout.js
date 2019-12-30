/**
 * A delaying function
 * @param {number} ms
 * @return {Promise} setTimeout Promise
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  sleep,
};
