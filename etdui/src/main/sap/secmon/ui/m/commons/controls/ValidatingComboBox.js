jQuery.sap.declare("sap.secmon.ui.m.commons.controls.ValidatingComboBox");

jQuery.sap.require("sap.m.ComboBox");

/**
 * this combox is intended to validate the user input and allow only values when an items-value
 * starts with the given input. the combox should behave like the sap.m.MultiComboBox
 */
var ValidatingComboBox = sap.m.ComboBox.extend("sap.secmon.ui.m.commons.controls.ValidatingComboBox", {
    metadata: {},

    renderer: {}
});

ValidatingComboBox.prototype.oninput = function(oEvent) {
    sap.m.ComboBox.prototype.oninput.apply(this, arguments);

    var srcControl = oEvent.srcControl;
    var val = oEvent.target.value;
    var oldVal = oEvent.srcControl._sOldValue || "";

    // check if an item exists which value starts with the current input
    // if not restore the old valid value and change the value state of the
    // control for at least 300ms (as in the MultiComboBox)
    if (!oEvent.srcControl.getItems().some(function(oItem) {
            return oItem.getText().indexOf(val) === 0;
        })) {
        srcControl.updateDomValue(oldVal);

        srcControl.setValueState(sap.ui.core.ValueState.Error);
        setTimeout(function() {
            srcControl.setValueState(sap.ui.core.ValueState.None);
        }, 300);
    }
};