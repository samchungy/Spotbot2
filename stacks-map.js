module.exports = (resource, logicalId) => {
  if (logicalId.startsWith('Settings')) return {destination: 'Settings'};
  if (logicalId.startsWith('Tracks')) return {destination: 'Tracks'};
  if (logicalId.startsWith('Control')) return {destination: 'Control'};
  // Falls back to default
};
