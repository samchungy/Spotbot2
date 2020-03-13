module.exports = (resource, logicalId) => {
  if (logicalId.startsWith('Router')) return {destination: 'Router'};
  if (logicalId.startsWith('Settings')) return {destination: 'Settings'};
  if (logicalId.startsWith('Tracks')) return {destination: 'Tracks'};
  if (logicalId.startsWith('Control')) return {destination: 'Control'};
  if (logicalId.startsWith('Delete')) return {destination: 'Delete'};
  // Falls back to default
};
