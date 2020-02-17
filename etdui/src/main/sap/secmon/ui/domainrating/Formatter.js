/* globals oTextBundle */
jQuery.sap.declare("sap.secmon.ui.domainrating.Formatter");
$.sap.require("sap.secmon.ui.domainrating.Constants");
sap.secmon.ui.domainrating.Formatter = {

    getText : function(sTextKey) {
        return oTextBundle.getText(sTextKey);
    },

    formatConfirmationType : function(type) {
        var res;
        if (type === sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.BENIGN) {
            res = sap.secmon.ui.domainrating.Formatter.getText("DA_CL_Benign");
        } else if (type === sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.MALICIOUS) {
            res = sap.secmon.ui.domainrating.Formatter.getText("DA_CL_Malicious");
        }
        return res;
    },
    formatType : function(type) {
        var res = false;
        if (type === 'I') {
            res = true;
        }
        return res;
    },
    formatTypeVisibility : function(classification) {
        var res = false;
        if (classification === sap.secmon.ui.domainrating.Constants.C_CLASSIFICATION_TYPE.BENIGN) {
            res = true;
        }
        return res;
    },
    formatTimerange : function(utc, text, type, tr, trFrom, trTo) {
        if (type === "relative" && tr) {
            return sap.secmon.ui.domainrating.Formatter.getText("DA_" + tr);
        } else if (type === "absolute" && trFrom && trTo) {
            return sap.secmon.ui.commons.Formatter.timeRangeFormatterEx(utc, text, new Date(trFrom), new Date(trTo));
        }
    },
    formatIsConfirmed : function(bConfirmed) {
        if (bConfirmed === 1 || bConfirmed === true || bConfirmed === "1") {
            return sap.secmon.ui.domainrating.Formatter.getText("DA_Yes");
        } else if (bConfirmed === 0 || bConfirmed === false || bConfirmed === "0") {
            return sap.secmon.ui.domainrating.Formatter.getText("DA_No");
        }
    },
    formatDLVisibility : function(viewType) {
        var res = false;
        if (viewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.DOMAINLIST) {
            res = true;
        }
        return res;
    },
    formatDLVisibilityButton :function(viewType, bDomainRatingWrite){
        return viewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.DOMAINLIST && bDomainRatingWrite;
    },
    formatWLVisibility : function(viewType) {
        var res = false;
        if (viewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.WHITELIST) {
            res = true;
        }
        return res;
    },
    formatWLVisibilityButton : function(viewType, bDomainRatingWrite){
        return viewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.WHITELIST && bDomainRatingWrite;
    },
    formatSelectedButton : function(viewType) {
        var res = '';
        if (viewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.WHITELIST) {
            res = 'showWhiteListButton';
        } else if (viewType === sap.secmon.ui.domainrating.Constants.C_VIEW_TYPE.DOMAINLIST) {
            res = 'showDomainListButton';
        }
        return res;
    }
};
