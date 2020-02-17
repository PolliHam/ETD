jQuery.sap.declare("sap.secmon.ui.commons.InputValidationService");

/*- 
 * This class helps performing input validation.
 * The constructor adds parse and validation handlers to the
 * supplied controls. The handlers set sap.ui.core.ValueState.Error
 * on a control if parsing / validation fails.
 * The binding of the controls should use a data type and can use constraints.
 * Example: value="{path:..., type: 'sap.ui.model.type.Integer', constraints : {minimum : 1}}"
 * 
 */
sap.secmon.ui.commons.InputValidationService = function(aControls) {
    this._attachValidators = function(oInput) {
        oInput.attachParseError(function(evt) {
            var control = evt.getParameter("element");
            if (control && control.setValueState) {
                control.setValueState(sap.ui.core.ValueState.Error);
            }
        });
        oInput.attachValidationError(function(evt) {
            var control = evt.getParameter("element");
            if (control && control.setValueState) {
                control.setValueState(sap.ui.core.ValueState.Error);
            }
        });
        oInput.attachValidationSuccess(function(evt) {
            var control = evt.getParameter("element");
            if (control && control.setValueState) {
                control.setValueState(sap.ui.core.ValueState.None);
            }
        });
    };

    this._attachValidatorsToAllControls = function() {
        this.aControls.forEach(this._attachValidators);
    };

    /**
     * Checks if all controls are not empty and no control has an error Is usually called before performing an action like "save"
     * 
     * @return {function} this.checkInputStates() - Function to check on value states of controls
     */
    this.checkControls = function() {
        // check that inputs are not empty
        // this does not happen during data binding as this is only triggered by
        // changes
        this.aControls.forEach(function(oInputControl) {
            if (!oInputControl.getValue()) {
                oInputControl.setValueState(sap.ui.core.ValueState.Error);
            }
        });
        // Check value states of input controls
        return this.checkInputStates();
    };

    /**
     * Rule allowing to compare two numbers. In case the rule is violated the input control will be flagged with the respective error state. Number of provided baseValues
     * 
     * @param {array}
     *            aBaseNumber - Array which can contain one or several numbers which can be compared with nCompareNumber
     * @param {numerical}
     *            nCompareNumber - Number which is needed as the basenumber will be compared against
     * @return {function} this.checkInputStates() - Function to check on value states of controls
     */

    this.compareNumbers = function(aBaseNumber, nCompareNumber) {
        var nBaseNumber;
        // Execute comparison and flag affected controls
        aControls.forEach(function(oInput, index) {
            // Prepare nBaseNumber variable for comparison
            // Hereby, consider the number of controls and baseNumbers provided
            if (aBaseNumber.length === 1) {
                nBaseNumber = aBaseNumber[0];
            } else if (aBaseNumber.length === aControls.length) {
                nBaseNumber = aBaseNumber[index];
            } else {
                return oInput.setValueState(sap.ui.core.ValueState.Error);
            }

            // Execute actual comparison for each control
            if (nBaseNumber < nCompareNumber) {
                oInput.setValueState(sap.ui.core.ValueState.None);
            } else {
                oInput.setValueState(sap.ui.core.ValueState.Error);
            }
        });
        // Check value states of input controls
        return this.checkInputStates();
    };

    /**
     * Check input states of affected controls and return boolean. This is needed to allow/stop function which is being validated.
     * 
     * @return {boolean} true/false - If true is returned all validation check was passed
     */
    this.checkInputStates = function() {
        var someInputControlInvalid = this.aControls.some(function(oInput) {
            return oInput.getVisible() === true && sap.ui.core.ValueState.Error === oInput.getValueState();
        });
        return !someInputControlInvalid;
    };

    /**
     * Reset the value state of all controls to none
     */
    this.resetValueStateOfControls = function() {
        this.aControls.forEach(function(oInputControl) {
            oInputControl.setValueState(sap.ui.core.ValueState.None);
        });
    };

    // Constructor code
    this.aControls = aControls.slice(0);
    this._attachValidatorsToAllControls();
};
