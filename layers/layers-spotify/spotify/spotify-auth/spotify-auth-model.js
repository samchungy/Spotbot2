const modelSpotifyAuth = (accessToken, refreshToken, expires, profile) => {
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires: expires,
    profile: profile,
  };
};

const modelProfile = (id, country) => {
  return {
    country: country,
    id: id,
  };
};


module.exports = {
  modelSpotifyAuth,
  modelProfile,
};
