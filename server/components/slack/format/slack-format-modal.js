const slackModal = (callbackId, title, submitText, closeText, blocks) => {
  return {
    type: 'modal',
    callback_id: callbackId,
    title: {
      type: 'plain_text',
      text: title,
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: submitText,
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: closeText,
      emoji: true,
    },
    blocks: blocks,
  };
};

const input = (title, hint, blockId) => {
  return {
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
  };
};

const plainText = (text) => {
  return {
    type: 'plain_text',
    text: text,
    emoji: true,
  };
};

const option = (text, value) => {
  return {
    text: plainText(text),
    value: value,
  };
};

const optionGroup = (title, options) => {
  return {
    label: {
      type: 'plain_text',
      text: title,
    },
    options: options,
  };
};

const selectStatic = (actionId, title, hint, initial, options) => {
  return {
    ...input(title, hint, actionId),
    element: {
      action_id: actionId,
      type: 'static_select',
      options: options,
      ...initial ? {initial_option: initial} : {}, // Cool little trick to remove field if it is not there
    },
  };
};

const selectChannels = (actionId, title, hint, initial) => {
  return {
    ...input(title, hint, actionId),
    element: {
      action_id: actionId,
      type: 'channels_select',
      ...initial ? {initial_channel: initial} : {},
    },
  };
};

const selectExternal = (actionId, title, hint, initial, min, placeholder) => {
  return {
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
  };
};

const textInput = (actionId, title, hint, initial, max, place) => {
  return {
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
  };
};

const buttonSection = (actionId, text, buttonText, style, url, value) => {
  return {
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
    },
  };
};

module.exports = {
  buttonSection,
  option,
  optionGroup,
  slackModal,
  selectStatic,
  selectChannels,
  selectExternal,
  textInput,
};
