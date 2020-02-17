/* globals oTextBundle*/
jQuery.sap.declare("sap.secmon.ui.systems.Formatter");
$.sap.require("sap.secmon.ui.systems.Constants");
sap.secmon.ui.systems.Formatter = {

    _getText : function(sTextKey) {
        return oTextBundle.getText(sTextKey);
    },

    formatStatus : function(sStatus) {
        if (sStatus === 'I') {
            return "Inactive";// sap.secmon.ui.domainrating.Formatter._getText("DA_Yes");
        } else if (sStatus === 'A') {
            return "Active";
        }
    }
};
