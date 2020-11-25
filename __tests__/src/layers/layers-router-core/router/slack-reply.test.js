const mod = require('../../../../../src/layers/layers-router-core/router/slack-reply');

describe('Slack Reply layer', () => {
  it('should return a in channel slack reply', () => {
    const text = '';
    expect(mod.publicAck(text)).toStrictEqual({
      response_type: 'in_channel',
      text,
    });
  });
});
