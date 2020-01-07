const imageSection = (text, imageUrl, imageAlt) => {
  return {
    'type': 'section',
    'text': {
      'type': 'mrkdwn',
      'text': text,
    },
    ...imageUrl ? imageAccessory(imageUrl, imageAlt) : {},
  };
};

const imageAccessory = (imageUrl, imageAlt) => {
  return {
    'accessory': {
      'type': 'image',
      'image_url': imageUrl,
      'alt_text': imageAlt,
    },
  };
};

const contextSection = (blockId, text) => {
  return {
    ...blockId ? {'block_id': blockId} : {},
    'type': 'context',
    'elements': [
      {
        'type': 'mrkdwn',
        'text': text,
      },
    ],
  };
};

const actionSection = (blockId, elements) => {
  return {
    'block_id': blockId,
    'type': 'actions',
    'elements': elements,
  };
};


const buttonActionElement = (text, value) => {
  return {
    'value': value,
    'action_id': value,
    'type': 'button',
    'text': {
      'type': 'plain_text',
      'emoji': true,
      'text': text,
    },
  };
};

const overflowActionElement = (actionId, options, confirm) => {
  return {
    'action_id': actionId,
    'type': 'overflow',
    'options': options,
    ...confirm ? {confirm: confirm} : {},
  };
};

const overflowOption = (text, value) => {
  return {
    'text': {
      'type': 'plain_text',
      'text': text,
    },
    'value': value,
  };
};

module.exports = {
  actionSection,
  buttonActionElement,
  contextSection,
  imageSection,
  overflowActionElement,
  overflowOption,
};
