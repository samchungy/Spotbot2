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

const getAuthInfo = (key, keys) => {
  return authTable({
    Key: key,
    ...keys ? {ProjectionExpression: keys.join(', ')}: {},
  });
};

const authModel = (team, channel, name, value, expiry) => {
  return {
    name: name,
    team_channel: `${team}-${channel}`,
    ...value ? value : {},
    ...expiry ? {ttl: expiry} : {},
  };
};

const authValues = (item) => {
  // eslint-disable-next-line no-unused-vars, camelcase
  const {name, team_channel, ...results} = item;
  return results;
};

const authUpdateModel = (team, channel, name, values) => {
  expressionValues = {};
  updateExpressions = values.map(({key, value}) => {
    expressionValues[`:${key}`] = value;
    return `${key} = :${key}`;
  });
  return authTable({
    Key: {
      name: name,
      team_channel: `${team}-${channel}`,
    },
    UpdateExpression: `set ${updateExpressions.join(', ')}`,
    ExpressionAttributeValues: expressionValues,
  });
};

const authDeleteModel = (team, channel, name) => {
  return authTable({
    Key: {
      name: name,
      team_channel: `${team}-${channel}`,
    },
  });
};

const putAuth = (auth) => {
  return dynamoDb.put(authInfo(auth)).promise();
};

const getAuth = (auth, keys) => {
  return dynamoDb.get(getAuthInfo(auth, keys)).promise();
};

const updateAuth = (auth) => {
  return dynamoDb.update(auth).promise();
};

const deleteAuth = (auth) =>{
  return dynamoDb.delete(auth).promise();
};

module.exports = {
  authModel,
  authDeleteModel,
  authValues,
  authUpdateModel,
  deleteAuth,
  getAuth,
  putAuth,
  updateAuth,
};
