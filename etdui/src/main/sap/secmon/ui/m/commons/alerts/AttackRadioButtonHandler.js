jQuery.sap.declare("sap.secmon.ui.m.commons.alerts.AttackRadioButtonHandler");

/**
 * This class encapsulates some restrictions for the field "attack": The attack
 * value depends on the status value. In status OPEN, any attack value is
 * allowed, it is even allowed not to check an attack value. In the other
 * statuses, an attack value must be selected. In statuses FALSE_POSTIVE,
 * NO_REACTION_NEEDED, and NO_RACTION_NEEDED_T the only allowed attack value is
 * NO. Therefore, it must be preselected.
 */
sap.secmon.ui.m.commons.alerts.AttackRadioButtonHandler = {

    /**
     * depending on the status, only certain values are allowed and can be
     * preset: In status FALSE_POSITIVE, NO_REACTION_NEEDED and
     * NO_RACTION_NEEDED_T the only possible attack value is NO.
     * 
     * @param radioButtonGroup:
     *            instance of
     *            sap.secmon.ui.m.commons.alerts.AttackRadioButtonGroup
     * @param sStatus
     *            string the status
     */
    getOnlyAllowedAttackValue : function(sStatus) {
        if (sStatus === 'FALSE_POSITIVE' || sStatus === 'NO_REACTION_NEEDED' || sStatus === 'NO_REACTION_NEEDED_T') {
            return "NO";
        }
    },

    attackRadioButtonsEnablerPopup : function(sAttack, sStatus, bUpdateStatus) {
        if (bUpdateStatus === true && (sStatus === 'FALSE_POSITIVE' || sStatus === 'NO_REACTION_NEEDED' || sStatus === 'NO_REACTION_NEEDED_T')) {
            if (sAttack === 'NO') {
                return true;
            } else {
                return false;
            }
        } else if (bUpdateStatus === true) {
            return true;
        } else {
            return false;
        }

    },

    attackRadioButtonsEnabler : function(sAttack, sStatus) {
        if (sStatus === 'FALSE_POSITIVE' || sStatus === 'NO_REACTION_NEEDED' || sStatus === 'NO_REACTION_NEEDED_T') {
            if (sAttack === 'NO') {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    },

};
