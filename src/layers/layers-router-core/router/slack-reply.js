const publicAck = (text) => {
  return {
    response_type: 'in_channel',
    text: text,
  };
};

module.exports = {
  publicAck,
};
