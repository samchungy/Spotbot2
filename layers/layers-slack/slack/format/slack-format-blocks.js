const actionSection = (blockId, elements) => ({
  ...blockId ? {'block_id': blockId} : {},
  'type': 'actions',
  'elements': elements,
});

const buttonActionElement = (actionId, text, value, confirm, style) => ({
  'value': value,
  'action_id': actionId,
  'type': 'button',
  'text': {
    'type': 'plain_text',
    'emoji': true,
    'text': text,
  },
  ...confirm ? {'confirm': confirm} : {},
  ...style ? {'style': style} : {},
});

const confirmObject = (title, text, confirmText, denyText) => ({
  'title': {
    'type': 'plain_text',
    'text': title,
  },
  'text': {
    'type': 'mrkdwn',
    'text': text,
  },
  'confirm': {
    'type': 'plain_text',
    'text': confirmText,
  },
  'deny': {
    'type': 'plain_text',
    'text': denyText,
  },
});

const contextSection = (blockId, text) => ({
  ...blockId ? {'block_id': blockId} : {},
  'type': 'context',
  'elements': [
    {
      'type': 'mrkdwn',
      'text': text,
    },
  ],
});

const divider = {
  'type': 'divider',
};

const imageAccessory = (imageUrl, imageAlt) => ({
  'accessory': {
    'type': 'image',
    'image_url': imageUrl,
    'alt_text': imageAlt,
  },
});

const imageSection = (text, imageUrl, imageAlt) => ({
  'type': 'section',
  'text': {
    'type': 'mrkdwn',
    'text': text,
  },
  ...imageUrl ? imageAccessory(imageUrl, imageAlt) : {},
});
const overflowActionElement = (actionId, options, confirm) => ({
  'action_id': actionId,
  'type': 'overflow',
  'options': options,
  ...confirm ? {confirm: confirm} : {},
});

const overflowOption = (text, value) => ({
  'text': {
    'type': 'plain_text',
    'text': text,
  },
  'value': value,
});

const textSection = (text) => ({
  'type': 'section',
  'text': {
    'type': 'mrkdwn',
    'text': text,
  },
});

module.exports = {
  actionSection,
  buttonActionElement,
  confirmObject,
  divider,
  contextSection,
  imageSection,
  overflowActionElement,
  overflowOption,
  textSection,
};
