const config = require(process.env.CONFIG);
const INCHANNEL = config.slack.reply.in_channel;
const EPHEMERAL = config.slack.reply.ephemeral;

const deleteMessage = (channel, timestamp) => ({
  channel: channel,
  ts: timestamp,
});

const updateReply = (text, blocks) => ({
  text: text,
  replace_original: 'true',
  ...blocks ? {blocks: blocks} : {},
});

const deleteReply = (text, blocks) => ({
  text: text,
  delete_original: 'true',
  ...blocks ? {blocks: blocks} : {},
});

const messageUpdate = (channel, timestamp, text, blocks) => ({
  channel: channel,
  ts: timestamp,
  text: text,
  ...blocks ? {blocks: blocks} : {},
});

const inChannelReply = (text, blocks) => ({
  ...reply(INCHANNEL, text, blocks),
});

const ephemeralReply = (text, blocks) => ({
  ...reply(EPHEMERAL, text, blocks),
});

const reply = (type, text, blocks) => ({
  ...type ? {'response_type': type} : {}, // If type is ephemeral, type is null
  'text': text,
  ...blocks ? {blocks: blocks} : {},
});

const inChannelPost = (channel, text, blocks) => ({
  ...post(channel, null, text, blocks),
});

const ephemeralPost = (channel, user, text, blocks) => ({
  ...post(channel, user, text, blocks),
});

const post = (channel, user, text, blocks) => ({
  channel: channel,
  text: text,
  blocks: blocks,
  ...user ? {user: user} : {},
});

const publicAck = (text) => ({
  response_type: 'in_channel',
  text: text,
});

const ack = (text) => ({
  text: text,
});


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
