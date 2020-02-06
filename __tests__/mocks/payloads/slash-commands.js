const settingsSlashPayload = {
  token: '6r2mZJdBz8Gb8wSl49SHMABa',
  team_id: 'TRVUTD7DM',
  team_domain: 'spotbottest',
  channel_id: 'CRVUTDP47',
  channel_name: 'slack-bots',
  user_id: 'URVUTD7UP',
  user_name: 'samchungy',
  command: '/spotbot',
  text: 'settings',
  response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/920606799857/zpbRZv0e10qbT5lqdmdwPEXK',
  trigger_id: '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3',
};

const skipSlashPayload = {
  token: '6r2mZJdBz8Gb8wSl49SHMABa',
  team_id: 'TRVUTD7DM',
  team_domain: 'spotbottest',
  channel_id: 'CRVUTDP47',
  channel_name: 'slack-bots',
  user_id: 'URVUTD7UP',
  user_name: 'samchungy',
  command: '/skip',
  text: '',
  response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/920606799857/zpbRZv0e10qbT5lqdmdwPEXK',
  trigger_id: '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3',
};

const playSlashPayload = {
  token: '6r2mZJdBz8Gb8wSl49SHMABa',
  team_id: 'TRVUTD7DM',
  team_domain: 'spotbottest',
  channel_id: 'CRVUTDP47',
  channel_name: 'slack-bots',
  user_id: 'URVUTD7UP',
  user_name: 'samchungy',
  command: '/play',
  text: '',
  response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/920606799857/zpbRZv0e10qbT5lqdmdwPEXK',
  trigger_id: '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3',
};

const pauseSlashPayload = {
  token: '6r2mZJdBz8Gb8wSl49SHMABa',
  team_id: 'TRVUTD7DM',
  team_domain: 'spotbottest',
  channel_id: 'CRVUTDP47',
  channel_name: 'slack-bots',
  user_id: 'URVUTD7UP',
  user_name: 'samchungy',
  command: '/pause',
  text: '',
  response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/920606799857/zpbRZv0e10qbT5lqdmdwPEXK',
  trigger_id: '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3',
};

const findSlashPayload = {
  token: '6r2mZJdBz8Gb8wSl49SHMABa',
  team_id: 'TRVUTD7DM',
  team_domain: 'spotbottest',
  channel_id: 'CRVUTDP47',
  channel_name: 'slack-bots',
  user_id: 'URVUTD7UP',
  user_name: 'samchungy',
  command: '/find',
  text: 'lime',
  response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/920606799857/zpbRZv0e10qbT5lqdmdwPEXK',
  trigger_id: '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3',
};

const currentSlashPayload = {
  token: '6r2mZJdBz8Gb8wSl49SHMABa',
  team_id: 'TRVUTD7DM',
  team_domain: 'spotbottest',
  channel_id: 'CRVUTDP47',
  channel_name: 'slack-bots',
  user_id: 'URVUTD7UP',
  user_name: 'samchungy',
  command: '/current',
  text: '',
  response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/920606799857/zpbRZv0e10qbT5lqdmdwPEXK',
  trigger_id: '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3',
};

const whomSlashCommand = {
  token: '6r2mZJdBz8Gb8wSl49SHMABa',
  team_id: 'TRVUTD7DM',
  team_domain: 'spotbottest',
  channel_id: 'CRVUTDP47',
  channel_name: 'slack-bots',
  user_id: 'URVUTD7UP',
  user_name: 'samchungy',
  command: '/whom',
  text: '',
  response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/920606799857/zpbRZv0e10qbT5lqdmdwPEXK',
  trigger_id: '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3',
};


const removeTrackSlashPayload = {
  token: '6r2mZJdBz8Gb8wSl49SHMABa',
  team_id: 'TRVUTD7DM',
  team_domain: 'spotbottest',
  channel_id: 'CRVUTDP47',
  channel_name: 'slack-bots',
  user_id: 'URVUTD7UP',
  user_name: 'samchungy',
  command: '/removetrack',
  text: '',
  response_url: 'https://hooks.slack.com/commands/TRVUTD7DM/920606799857/zpbRZv0e10qbT5lqdmdwPEXK',
  trigger_id: '920606799937.879979449463.03cf1e98affb1769fde3a2f3393ff4d3',
};


module.exports = {
  currentSlashPayload,
  findSlashPayload,
  pauseSlashPayload,
  playSlashPayload,
  removeTrackSlashPayload,
  settingsSlashPayload,
  skipSlashPayload,
  whomSlashCommand,
};
