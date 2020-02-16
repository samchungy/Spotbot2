const dynamoDb = require('./db');
const AUTH_TABLE = process.env.AUTH_TABLE;

const authTable = (item) => {
  return {
    TableName: AUTH_TABLE,
    ...item,
  };
};

const authInfo = (item) => {
  return authTable(
      {
        Item: item,
      });
};

const getAuthInfo = (key) => {
  return authTable({
    Key: key,
  });
};

const authModel = (team, channel, name, value) => {
  return {
    name: name,
    team_channel: `${team}-${channel}`,
    ...value ? {value: value} : {},
  };
};

const putAuth = (auth) => {
  return dynamoDb.put(authInfo(auth)).promise();
};

const getAuth = (auth) => {
  return dynamoDb.get(getAuthInfo(auth)).promise();
};

module.exports = {
  authModel,
  getAuth,
  putAuth,
};
