const config = require('config');
const INCHANNEL = config.get('slack.reply.in_channel');
const EPHEMERAL = config.get('slack.reply.ephemeral');

const inChannelReply = (text, blocks) => {
  return {
    ...reply(INCHANNEL, text, blocks),
  };
};

const ephemeralReply = (text, blocks) => {
  return {
    ...reply(EPHEMERAL, text, blocks),
  };
};

const reply = (type, text, blocks) => {
  return {
    ...type ? {'response_type': type} : {}, // If type is ephemeral, type is null
    'text': text,
    ...blocks ? {blocks: blocks} : {},
  };
};

const inChannelPost = (channel, text, blocks) => {
  return {
    ...post(channel, null, text, blocks),
  };
};

const ephemeralPost = (channel, user, text, blocks) => {
  return {
    ...post(channel, user, text, blocks),
  };
};

const post = (channel, user, text, blocks) => {
  return {
    channel: channel,
    text: text,
    blocks: blocks,
    ...user ? {user: user} : {},
  };
};

const publicAck = (text) => {
  return {
    response_type: 'in_channel',
    text: text,
  };
};

const ack = (text)=> {
  return {
    text: text,
  };
};


module.exports = {
  ack,
  publicAck,
  ephemeralPost,
  ephemeralReply,
  inChannelPost,
  inChannelReply,
};
