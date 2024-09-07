(function () {
    if (typeof document.querySelectorAll === "undefined") {
        return;
    }
    var history = {};
    window.addEventListener('beforeunload', function (e) {
        findUnsubmittedForms().forEach(function (it) {
            var lastField = it.history[it.history.length - 1].name;
            var lastFieldType = it.history[it.history.length - 1].type;
            window.dataLayer.push({
                'event': window.fat_event_name,
                'form': it.name,
                'dropped_at_field_name': lastField,
                'dropped_at_field_type': lastFieldType
            });
        });
    });
    window.addEventListener("load", function () {
        document.addEventListener("change", function (e) {
            var target = e.target;
            if (target && target.tagName && (target.tagName.toUpperCase() === "INPUT" || target.tagName.toUpperCase() === "SELECT" || target.tagName.toUpperCase() === "TEXTAREA")) {
                var form = target.form;
                if (form) {
                    var formName = form.getAttribute("name") || form.getAttribute("aria-label") || form.id || "unlabeled_form";
                    if (typeof history[formName] === "undefined") {
                        history[formName] = [];
                    }
                    var nextUnfilledField = getNextUnfilledField(form);
                    if (nextUnfilledField) {
                        var fieldName = getFieldName(nextUnfilledField);
                        if (fieldName && (!history[formName].length || history[formName][history[formName].length - 1].name !== fieldName)) {
                            history[formName].push({
                                name: fieldName,
                                type: nextUnfilledField.tagName.toLowerCase()
                            });
                        }
                    }
                }
            }
        });
    });

    function getNextUnfilledField(form) {
        var elements = form.querySelectorAll("input, select, textarea");
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            if (isElementUnfilled(element) && isElementVisible(element)) {
                return element;
            }
        }
        return null;
    }

    function isElementUnfilled(element) {
        if (element.tagName.toUpperCase() === "INPUT") {
            var type = element.type.toLowerCase();
            if (type === "checkbox" || type === "radio") {
                return !element.checked;
            } else {
                return !element.value;
            }
        } else if (element.tagName.toUpperCase() === "SELECT" || element.tagName.toUpperCase() === "TEXTAREA") {
            return !element.value;
        }
        return false;
    }

    function isElementVisible(element) {
        return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
    }

    function getFieldName(element) {
        var name = element.getAttribute("name");
        if (name && /\d/.test(name)) {
            var label = findLabel(element);
            if (label) {
                return label.textContent.trim();
            }
        }
        return name || "unlabeled_field";
    }

    function findLabel(element) {
        var parent = element.parentElement;
        while (parent) {
            var label = parent.querySelector("label[for='" + element.id + "']") || parent.querySelector("label");
            if (label) {
                return label;
            }
            parent = parent.parentElement;
        }
        return null;
    }

    function findUnsubmittedForms() {
        var unsubmittedForms = [];
        for (var name in history) {
            if (history.hasOwnProperty(name) && hasNoFormSubmitEvent(name)) {
                var formHistory = history[name];
                var lastHistoryElement = formHistory[formHistory.length - 1];
                unsubmittedForms.push({
                    name: name,
                    history: formHistory,
                    lastFieldElement: lastHistoryElement ? lastHistoryElement.element : null
                });
            }
        }
        return unsubmittedForms;
    }

    function hasNoFormSubmitEvent(name) {
        for (var i = 0; i < window.dataLayer.length; i++) {
            var event = window.dataLayer[i];
            if (isFormSubmitEvent(event) && getFormName(event) === name) {
                return false;
            }
        }
        return true;
    }

    function isFormSubmitEvent(e) {
        return e.event === 'gtm.formSubmit';
    }

    function getFormName(e) {
        var formElement = e['gtm.element'];
        return formElement.getAttribute("name") || formElement.getAttribute("aria-label") || formElement.id || "unlabeled_form";
    }
})();