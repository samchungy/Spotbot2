const mockSlackApi = {
  pushModal: jest.fn(),
  sendModal: jest.fn(),
};
const mockSlackFormat = {
  slackModal: jest.fn(),
};
const mockSlackBlocks = {
  textSection: jest.fn(),
};

jest.mock('/opt/slack/slack-api', () => mockSlackApi, {virtual: true});
jest.mock('/opt/slack/format/slack-format-modal', () => mockSlackFormat, {virtual: true});
jest.mock('/opt/slack/format/slack-format-blocks', () => mockSlackBlocks, {virtual: true});
const mod = require('../../../../../src/layers/layers-router-core/router/slack-modal');
const response = mod.RESPONSE;
const {teamId, channelId, triggerId} = require('../../../../data/request');
const modal = require('../../../../data/slack/open-modal');

describe('Router Slack Modal', () => {
  it('sendModal should return Slack payload', async () => {
    const callbackId = 'EMPTY';
    const title = 'Empty Modal Title';
    const cancel = 'Cancel';
    const textSection = {textSection: true};
    mockSlackApi.sendModal.mockResolvedValue(modal[0]);
    mockSlackBlocks.textSection.mockReturnValue(textSection);

    await expect(mod.openModal(teamId, channelId, triggerId, callbackId, title, null, cancel)).resolves.toStrictEqual(modal[0]);
    expect(mockSlackBlocks.textSection).toBeCalledWith(response.loading);
    expect(mockSlackFormat.slackModal).toBeCalledWith(callbackId, title, null, cancel, [textSection], false, channelId);
  });

  it('sendModal should return the error thrown', async () => {
    const callbackId = 'EMPTY';
    const title = 'Empty Modal Title';
    const cancel = 'Cancel';
    const error = new Error();
    mockSlackApi.sendModal.mockRejectedValue(error);
    await expect(mod.openModal(teamId, channelId, triggerId, callbackId, title, null, cancel)).rejects.toStrictEqual(error);
  });

  it('pushModal should return Slack payload', async () => {
    const callbackId = 'EMPTY';
    const title = 'Empty Modal Title';
    const cancel = 'Cancel';
    const textSection = {textSection: true};
    mockSlackApi.pushModal.mockResolvedValue(modal[0]);
    mockSlackBlocks.textSection.mockReturnValue(textSection);

    await expect(mod.pushView(teamId, channelId, triggerId, callbackId, title, null, cancel)).resolves.toStrictEqual(modal[0]);
    expect(mockSlackBlocks.textSection).toBeCalledWith(response.loading);
    expect(mockSlackFormat.slackModal).toBeCalledWith(callbackId, title, null, cancel, [textSection], false, channelId);
  });

  it('pushModal should return the error thrown', async () => {
    const callbackId = 'EMPTY';
    const title = 'Empty Modal Title';
    const cancel = 'Cancel';
    const error = new Error();
    mockSlackApi.pushModal.mockRejectedValue(error);
    await expect(mod.pushView(teamId, channelId, triggerId, callbackId, title, null, cancel)).rejects.toStrictEqual(error);
  });
});
