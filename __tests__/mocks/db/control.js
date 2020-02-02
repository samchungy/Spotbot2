const fullSkip = {
  history: [],
  track: {
    duration: '3:10',
    art: 'https://i.scdn.co/image/ab67616d00001e02d23e426be310ff7f761217b7',
    artists: 'Crooked Colours',
    album: 'Langata',
    name: 'Do It Like You',
    id: '1sCgWGukswGPlym4ggdoav',
    title: 'Crooked Colours - Do It Like You',
    uri: 'spotify:track:1sCgWGukswGPlym4ggdoav',
    url: 'https://open.spotify.com/track/1sCgWGukswGPlym4ggdoav',
  },
  users: ['URVUTD7UP'],
  votesNeeded: 2,
  timestamp: '1580549019.001400',
};

const fullSkipNoUser = {
  history: [],
  track: {
    duration: '3:10',
    art: 'https://i.scdn.co/image/ab67616d00001e02d23e426be310ff7f761217b7',
    artists: 'Crooked Colours',
    album: 'Langata',
    name: 'Do It Like You',
    id: '1sCgWGukswGPlym4ggdoav',
    title: 'Crooked Colours - Do It Like You',
    uri: 'spotify:track:1sCgWGukswGPlym4ggdoav',
    url: 'https://open.spotify.com/track/1sCgWGukswGPlym4ggdoav',
  },
  users: ['URVUTUP'],
  votesNeeded: 2,
  timestamp: '1580549019.001400',
};

const fullSkipOneVoteNeeded = {
  history: [],
  track: {
    duration: '3:10',
    art: 'https://i.scdn.co/image/ab67616d00001e02d23e426be310ff7f761217b7',
    artists: 'Crooked Colours',
    album: 'Langata',
    name: 'Do It Like You',
    id: '1sCgWGukswGPlym4ggdoav',
    title: 'Crooked Colours - Do It Like You',
    uri: 'spotify:track:1sCgWGukswGPlym4ggdoav',
    url: 'https://open.spotify.com/track/1sCgWGukswGPlym4ggdoav',
  },
  users: ['ABCD'],
  votesNeeded: 1,
  timestamp: '1580549019.001400',
};

const fullSkipExpired = {
  history: [],
  track: {
    duration: '3:10',
    art: 'https://i.scdn.co/image/ab67616d00001e02d23e426be310ff7f761217b7',
    artists: 'Crooked Colours',
    album: 'Langata',
    name: 'Do It Like You',
    id: 'BADID',
    title: 'Crooked Colours - Do It Like You',
    uri: 'spotify:track:1sCgWGukswGPlym4ggdoav',
    url: 'https://open.spotify.com/track/1sCgWGukswGPlym4ggdoav',
  },
  users: ['ABCD'],
  votesNeeded: 1,
  timestamp: '1580549019.001400',
};

module.exports = {
  fullSkip,
  fullSkipNoUser,
  fullSkipOneVoteNeeded,
  fullSkipExpired,
};
