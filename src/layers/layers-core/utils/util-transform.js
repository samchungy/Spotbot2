
/**
 * Encodes in Base64
 * @param {string} unencoded
 * @return {string}
 */
function encode64(unencoded) {
  return Buffer.from(unencoded || '').toString('base64');
};

/**
 * Decodes in Base64
 * @param {string} encoded
 * @return {string}
 */
function decode64(encoded) {
  return Buffer.from(encoded || '', 'base64').toString('utf8');
};

module.exports = {
  decode64,
  encode64,
};
