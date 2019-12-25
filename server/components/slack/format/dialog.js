

const slackDialog = (callback_id, title, submit_label, elements) => {
    return {
        callback_id: callback_id,
        title: title,
        submit_label: submit_label,
        elements: elements
    }
}

const dialogElement = (name, value, label, hint) => {
    return {
        name: name,
        value: value,
        label: label,
        hint: hint
    }
}

const textDialogElement = (name, value, label, hint, placeholder, max_length, subtype) => {
    return Object.assign(
        dialogElement(name, value, label, hint),
        {
            type: "text",
            placeholder: placeholder,
            max_length: max_length,
            subtype: subtype
        }
    )
}

const selectDialogElement = (name, value, label, hint, options) => {
    return Object.assign(
        dialogElement(name, value, label, hint), 
        {
            type: "select",
            options: options
        }
    );
}

const selectSlackDialogElement = (name, value, label, hint, data_source, selected_options) => {
    return Object.assign(
        dialogElement(name, value, label, hint), 
        {
            type: "select",
            data_source: data_source,
            selected_options: selected_options
        }
    );
}

const selectDynamicSlackDialogElement = (name, value, label, hint, data_source, selected_options, length) => {
    return Object.assign(
        selectSlackDialogElement(name, value, label, hint, data_source, selected_options),
        {
            min_query_length: length
        }
    )
}

const option = (label, value) => {
    return {
        label: label,
        value: value
    }
}

module.exports = {
    option,
    slackDialog,
    selectDialogElement,
    selectSlackDialogElement,
    selectDynamicSlackDialogElement,
    textDialogElement
}