const config = require('config');
const INCHANNEL = config.get('slack.reply.in_channel');
const EPHEMERAL = config.get('slack.reply.ephemeral');

const deleteMessage = (channel, timestamp) => {
  return {
    channel: channel,
    ts: timestamp,
  };
};

const updateReply = (text, blocks) => {
  return {
    text: text,
    replace_original: 'true',
    ...blocks ? {blocks: blocks} : {},
  };
};

const deleteReply = (text, blocks) => {
  return {
    text: text,
    delete_original: 'true',
    ...blocks ? {blocks: blocks} : {},
  };
};

const messageUpdate = (channel, timestamp, text, blocks) => {
  return {
    channel: channel,
    ts: timestamp,
    text: text,
    ...blocks ? {blocks: blocks} : {},
  };
};

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
  deleteMessage,
  deleteReply,
  publicAck,
  ephemeralPost,
  ephemeralReply,
  inChannelPost,
  inChannelReply,
  messageUpdate,
  updateReply,
};
