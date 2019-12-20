

const dialog = (callback_id, title, submit_label, elements) => {
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

module.exports = {
    dialog,
    selectDialogElement,
    selectSlackDialogElement
}