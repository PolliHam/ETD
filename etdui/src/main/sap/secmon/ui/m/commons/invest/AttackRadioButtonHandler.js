jQuery.sap.declare("sap.secmon.ui.m.commons.invest.AttackRadioButtonHandler");

/**
 * This class encapsulates some restrictions for the field "attack": The attack
 * value depends on the status value. In status COMPLETED an attack value is
 * mandatory.
 */
sap.secmon.ui.m.commons.invest.AttackRadioButtonHandler = {

    isRequired : function(sStatus) {
        return (sStatus === 'COMPLETED');
    }

};
