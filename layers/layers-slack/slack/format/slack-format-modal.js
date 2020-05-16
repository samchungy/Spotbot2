const slackModal = (callbackId, title, submitText, closeText, blocks, notify, metadata) => ({
  type: 'modal',
  callback_id: callbackId,
  title: {
    type: 'plain_text',
    text: title,
    emoji: true,
  },
  ...submitText ? {
    submit: {
      type: 'plain_text',
      text: submitText,
      emoji: true,
    },
  } : {},
  close: {
    type: 'plain_text',
    text: closeText,
    emoji: true,
  },
  blocks: blocks,
  ...notify ? {notify_on_close: notify} : {},
  ...metadata ? {private_metadata: metadata} : {},
});

const input = (title, hint, blockId, optional) => ({
  type: 'input',
  label: {
    'type': 'plain_text',
    'text': title,
  },
  hint: {
    'type': 'plain_text',
    'text': hint,
  },
  block_id: blockId,
  ...optional ? {optional: true} : {},
});

const plainText = (text) => ({
  type: 'plain_text',
  text: text,
  ...text.length > 64 ? {text: `${text.slice(0, 61)}...`} : {text: text},
  emoji: true,
});

const option = (text, value) => ({
  text: plainText(text),
  value: value,
});

const optionGroup = (title, options) => ({
  label: {
    type: 'plain_text',
    text: title,
  },
  options: options,
});

const multiSelectStaticGroups = (actionId, title, hint, initial, options, optional) => ({
  ...input(title, hint, actionId, optional),
  element: {
    action_id: actionId,
    type: 'multi_static_select',
    option_groups: options,
    ...initial ? {initial_options: initial} : {},
  },
});

const multiSelectStatic = (actionId, title, hint, initial, options, optional) => ({
  ...input(title, hint, actionId, optional),
  element: {
    action_id: actionId,
    type: 'multi_static_select',
    options: options,
    ...initial ? {initial_options: initial} : {},
  },
});

const selectStatic = (actionId, title, hint, initial, options, optional) => ({
  ...input(title, hint, actionId, optional),
  element: {
    action_id: actionId,
    type: 'static_select',
    options: options,
    ...initial ? {initial_option: initial} : {}, // Cool little trick to remove field if it is not there
  },
});

const multiSelectUsers = (actionId, title, hint, initial) => ({
  ...input(title, hint, actionId),
  element: {
    action_id: actionId,
    type: 'multi_users_select',
    ...initial ? {initial_users: initial} : {},
  },
});

const selectChannels = (actionId, title, hint, initial) => ({
  ...input(title, hint, actionId),
  element: {
    action_id: actionId,
    type: 'channels_select',
    ...initial ? {initial_channel: initial} : {},
  },
});

const selectExternal = (actionId, title, hint, initial, min, placeholder) => ({
  ...input(title, hint, actionId),
  element: {
    action_id: actionId,
    type: 'external_select',
    min_query_length: min,
    placeholder: {
      type: 'plain_text',
      text: placeholder,
    },
    ...initial ? {initial_option: initial} : {},
  },
});

const textInput = (actionId, title, hint, initial, max, place) => ({
  ...input(title, hint, actionId),
  element: {
    'action_id': actionId,
    'type': 'plain_text_input',
    'max_length': max,
    'placeholder': {
      'type': 'plain_text',
      'text': place,
    },
    ...initial ? {initial_value: initial} : {},
  },
});

const buttonSection = (actionId, text, buttonText, style, url, value, confirm) => ({
  block_id: actionId,
  type: 'section',
  text: {
    'type': 'mrkdwn',
    'text': text,
  },
  accessory: {
    'action_id': actionId,
    'type': 'button',
    'text': {
      'type': 'plain_text',
      'text': buttonText,
      'emoji': true,
    },
    ...style ? {style: style}: {},
    ...url ? {url: url} : {},
    ...value ? {value: value} : {},
    ...confirm ? {confirm: confirm} : {},
  },
});

/**
 * Generates a yes or no option array
 * @return {array} Yes or No options
 */
const yesOrNo = () => [
  option(`Yes`, `true`),
  option(`No`, `false`),
];

module.exports = {
  buttonSection,
  option,
  optionGroup,
  multiSelectStatic,
  multiSelectStaticGroups,
  multiSelectUsers,
  slackModal,
  selectStatic,
  selectChannels,
  selectExternal,
  textInput,
  yesOrNo,
};
