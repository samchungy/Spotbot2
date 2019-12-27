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
            initial_option: initial,
            options: options
        }
    }
}

const selectChannels = (action_id, title, hint, initial) => {
    return {
        ...input(title, hint, action_id),
        element: {
            action_id: action_id,
            type: "channels_select",
            initial_channel: initial
        }
    }
}

const selectExternal = (action_id, title, hint, initial, min) => {
    return {
        ...input(title, hint, action_id),
        element: {
            action_id: action_id,
            type: "external_select",
            initial_option: initial,
            min_query_length: min
        }
    }
}

const textInput = (action_id, title, hint, initial, max) => {
    return {
        ...input(title, hint, action_id),
        element: {
            action_id: action_id,
            type: "plain_text_input",
            initial_value: initial,
            max_length: max 
        }
    }
}

module.exports = {
    option,
    optionGroup,
    slackModal,
    selectStatic,
    selectChannels,
    selectExternal,
    textInput
}