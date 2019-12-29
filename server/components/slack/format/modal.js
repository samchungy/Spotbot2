const slackModal = (callback_id, title, submit_text, close_text, blocks) => {
    return {
        type: "modal",
        callback_id: callback_id,
        title: {
            type: "plain_text",
            text: title,
            emoji: true
        },
        submit: {
            type: "plain_text",
            text: submit_text,
            emoji: true
        },
        close: {
            type: "plain_text",
            text: close_text,
            emoji: true
        },
        blocks: blocks
    }    
}

const input = (title, hint, block_id) => {
    return {
        type: "input",
        label: {
            "type": "plain_text",
            "text": title
        },
        hint: {
            "type": "plain_text",
            "text": hint
        },
        block_id: block_id
    }
}

const plainText = (text) => {
    return {
        type: "plain_text",
        text: text,
        emoji: true
    }
}

const option = (text, value) => {
    return {
        text: plainText(text),
        value: value
    }
}

const optionGroup = (title, options) => {
    return {
        label: {
            type: "plain_text",
            text: title
        },
        options: options
    }
}

const selectStatic = (action_id, title, hint, initial, options) => {
    return {
        ...input(title, hint, action_id),
        element: {
            action_id: action_id,
            type: "static_select",
            options: options,
            ... initial ? {initial_option: initial} : {} //Cool little trick to remove field if it is not there
        }
    }
}

const selectChannels = (action_id, title, hint, initial) => {
    return {
        ...input(title, hint, action_id),
        element: {
            action_id: action_id,
            type: "channels_select",
            ... initial ? {initial_channel: initial} : {}
        }
    }
}

const selectExternal = (action_id, title, hint, initial, min) => {
    return {
        ...input(title, hint, action_id),
        element: {
            action_id: action_id,
            type: "external_select",
            min_query_length: min,
            ... initial ? {initial_option: initial} : {}
        }
    }
}

const textInput = (action_id, title, hint, initial, max, place) => {
    return {
        ...input(title, hint, action_id),
        element: {
            action_id: action_id,
            type: "plain_text_input",
            max_length: max,
            "placeholder": {
                "type": "plain_text",
                "text": place
            },
            ... initial ? {initial_value: initial} : {}
        }
    }
}

const buttonSection = (action_id, text, button_text, style, url, value) => {
    return {
        block_id: action_id,
        type: "section",
        text: {
            "type": "mrkdwn",
            "text": text
        },
        accessory: {
            "action_id": action_id,
            "type": "button",
            "text": {
                "type": "plain_text",
                "text": button_text,
                "emoji": true
            },
            ... style ? {style: style}: {},
            ... url ? {url: url} : {},
            ... value ? {value: value} : {}
        },
    }
}

const context = (block_id, text) => {
    return {
        block_id: block_id,
        type: "context",
        elements: [
            {
                "type": "mrkdwn",
                "text": text
            }
        ]
    }
}

module.exports = {
    buttonSection,
    context,
    option,
    optionGroup,
    slackModal,
    selectStatic,
    selectChannels,
    selectExternal,
    textInput
}