jQuery.sap.declare("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
/**
 * Make some formatters globally available. Currently only the examples from the Developer Guide are contained.
 */
sap.secmon.ui.m.invest.util.Formatter = {

    titleFormatter : function(number, enums, severity) {
        var severityText = sap.secmon.ui.m.commons.Formatter.enumFormatter(enums, severity);
        return number + " (" + severityText + ")";
    },

    removeAlertActionVisibility : function(bDisplayMode, sStatus, bAlertWrite, bLinkEnabled) {
        if(!bAlertWrite){
            return false;
        }
        if (bLinkEnabled === true) {
            return false;
        }
        if (!bDisplayMode) {
            return false;
        }
        if (sStatus === null || sStatus === undefined) {
            return false;
        }
        if (sStatus === 'COMPLETED' || sStatus === 'CANCELLED') {
            return false;
        }
        return true;
    },

    reopenVisibleFormatter : function(status, displayMode) {
        if (displayMode === true && (status === 'COMPLETED' || status === 'CANCELLED')) {
            return true;
        }
        return false;
    },

    editVisibleFormatter : function(status, displayMode, bInvestigationWrite) {
        if (!bInvestigationWrite) {
            return false;
        }
        if (displayMode === true && status !== 'COMPLETED' && status !== 'CANCELLED') {
            return true;
        }
        return false;
    },

    objectTypeFormatter : function(objectType) {
        var i18nModel = this.getModel("i18nInvest");
        if (i18nModel === undefined) {
            return objectType;
        }
        if (objectType === "ALERT") {
            return i18nModel.getProperty("MInvest_ObjAlert");
        } else if (objectType === "EVENT") {
            return i18nModel.getProperty("MInvest_ObjEvent");
        } else if (objectType === "SNAPSHOT") {
            return i18nModel.getProperty("MInvest_ObjSnap");
        } else if (objectType === "HEALTHCHECK") {
            return i18nModel.getProperty("MInvest_ObjHealth");
        } else if (objectType === "FSPACE") {
            return i18nModel.getProperty("MInvest_ObjFSpace");
        }
    },

    objectLinkFormatter : function(objectId, objectType) {
        if (objectType === "ALERT") {
            return sap.secmon.ui.m.commons.NavigationService.alertURL(objectId);
        } else if (objectType === "SNAPSHOT") {
            return sap.secmon.ui.m.commons.NavigationService.snapshotURL(objectId);
        } else if (objectType === "FSPACE") {
            return sap.secmon.ui.m.commons.NavigationService.casefileURL(objectId);
        } else {
            return null;
        }
    },

    objectNavigationLinkEnabledFormatter : function(displayMode, objectType) {
        if (displayMode !== true) {
            return false;
        }
        if (objectType === "HEALTHCHECK" || objectType === "EVENT") {
            return false;
        }
        return true;

    },

    nameFormatter : function(name, objectType, type) {
        if (objectType === "ALERT") {
            return name + " (" + type + ")";
        } else {
            return name;
        }
    },
    iconFormatter : function(objectType) {
        switch (objectType) {
        case 'ALERT':
            return "sap-icon://alert";
        case 'EVENT':
            return "sap-icon://Fiori4/F0576";
        case "HEALTHCHECK":
            return "sap-icon://electrocardiogram";
        case "SNAPSHOT":
            return "sap-icon://add-photo";
        case "FSPACE":
            return "sap-icon://folder";
        default:
            return "";
        }
    },

    columnListItemTypeFormatter : function(objectType) {
        if (objectType === "FSPACE") {
            return "Navigation";
        }
        return "Inactive";
    },

    displayStartTriggeringEventsJobFormatter : function(alertCount, status, displayMode) {
        if (parseInt(alertCount) > 0 && status === "COMPLETED" && displayMode === true) {
            return true;
        }
        return false;
    },

    commentIconFormatter : function(commentType) {
        switch (commentType) {
        case 'COMMENT':
            return "sap-icon://notes";
        case 'TICKET':
            return "sap-icon://tags";
        default:
            return "sap-icon://hint";
        }
    },

    commentTitleFormatter : function(commentType, commentText, changedText) {
        switch (commentType) {
        case 'COMMENT':
            return commentText;
        case 'CHANGE':
            return changedText;
        default:
            return commentType;
        }
    },

    logonUserNotSetAsProcessor : function(processor) {
        var applContextModel = this.getModel("applicationContext");
        var logonUser = applContextModel.getData().userName;

        return processor !== logonUser;
    }
};
