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

const divider = () => {
  return {
    'type': 'divider',
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

const textSection = (text) =>{
  return {
    'type': 'section',
    'text': {
      'type': 'mrkdwn',
      'text': text,
    },
  };
};

module.exports = {
  actionSection,
  buttonActionElement,
  divider,
  contextSection,
  imageSection,
  overflowActionElement,
  overflowOption,
  textSection,
};
