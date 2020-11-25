module.exports = (resource, logicalId) => {
  logicalId = logicalId.toLowerCase();
  if (logicalId.startsWith('router') || logicalId.startsWith('apigatewaymethod')) return {destination: 'Router'};
  if (logicalId.startsWith('settings') || isSns('settings', logicalId)) return {destination: 'Settings'};
  if (logicalId.startsWith('tracks') || isSns('tracks', logicalId)) return {destination: 'Tracks'};
  if (logicalId.startsWith('control') || isSns('control', logicalId)) return {destination: 'Control'};
  if (logicalId.startsWith('delete') || isSns('delete', logicalId)) return {destination: 'Delete'};
  if (logicalId.startsWith('sync') || isSns('sync', logicalId)) return {destination: 'Sync'};
  // Falls back to default
};

/**
 * Identifies SNS objects
 * @param {string} identifier
 * @param {string} logicalId
 * @return {boolean}
 */
function isSns(identifier, logicalId) {
  return (logicalId.startsWith('snstopic') && logicalId.includes(identifier));
}
