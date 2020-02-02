const mockFetchProfile = {
  country: 'AU',
  display_name: 'Sam Chung',
  email: 'samchungy@hotmail.com',
  explicit_content: {filter_enabled: false, filter_locked: false},
  external_urls: {spotify: 'https://open.spotify.com/user/samchungy'},
  followers: {href: null, total: 20},
  href: 'https://api.spotify.com/v1/users/samchungy',
  id: 'samchungy',
  images: [
    {
      height: null,
      url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/c53.0.320.320a/p320x320/40685720_10210198758440101_5414308512903725056_o.jpg?_nc_cat=102&_nc_ohc=GWYjl1uLkDMAX_V91OO&_nc_ht=scontent.xx&oh=34d06bfb9fece70b05cfeb8116921047&oe=5ECC19E2',
      width: null,
    },
  ],
  product: 'premium',
  type: 'user',
  uri: 'spotify:user:samchungy',
};

const mockFetchProfileFree = {
  country: 'AU',
  display_name: 'Sam Chung',
  email: 'samchungy@hotmail.com',
  explicit_content: {filter_enabled: false, filter_locked: false},
  external_urls: {spotify: 'https://open.spotify.com/user/samchungy'},
  followers: {href: null, total: 20},
  href: 'https://api.spotify.com/v1/users/samchungy',
  id: 'samchungy',
  images: [
    {
      height: null,
      url: 'https://scontent.xx.fbcdn.net/v/t1.0-1/c53.0.320.320a/p320x320/40685720_10210198758440101_5414308512903725056_o.jpg?_nc_cat=102&_nc_ohc=GWYjl1uLkDMAX_V91OO&_nc_ht=scontent.xx&oh=34d06bfb9fece70b05cfeb8116921047&oe=5ECC19E2',
      width: null,
    },
  ],
  product: 'free',
  type: 'user',
  uri: 'spotify:user:samchungy',
};

module.exports = {
  mockFetchProfile,
  mockFetchProfileFree,
};
