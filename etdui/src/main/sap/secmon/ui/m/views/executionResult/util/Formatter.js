jQuery.sap.declare("sap.secmon.ui.m.views.executionResult.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

sap.secmon.ui.m.views.executionResult.util.Formatter = {

    O_COMMONS : new sap.secmon.ui.commons.CommonFunctions(),

    assignmentTypeFormatter : function(assignmentType) {
        var text = assignmentType;
        var oModel = this.getModel("i18n");
        if (assignmentType === "NEW_ALERT") {
            text = oModel.getProperty("Yes");
        } else if (assignmentType === "OLD_ALERT") {
            text = oModel.getProperty("No");
        }
        return text;
    },

    statusFormatter : function(sStatus, sExecutionResultIdBase64) {
        if (sStatus === null || sStatus === undefined || sExecutionResultIdBase64 === null || sExecutionResultIdBase64 === undefined) {
            return "";
        }
        if (sStatus !== "Error") {
            return sStatus;
        }
        var id = sap.secmon.ui.m.views.executionResult.util.Formatter.O_COMMONS.base64ToHex(sExecutionResultIdBase64);
        var sMessage = this.getModel("i18n").getProperty("ExecutionError");
        return sap.secmon.ui.commons.Formatter.i18nText(sMessage, id);
    },

    executionOutputFormatter : function(sExecutionOutput) {
        var sKey;
        if (sExecutionOutput === "ALERT") {
            sKey = "ExecutionOutputAlerts";
        } else if (sExecutionOutput === "INDICATOR") {
            sKey = "ExecutionOutputEvents";
        } else {
            return "Illegal value " + sExecutionOutput;
        }
        var sMessage = this.getModel("i18n").getProperty(sKey);
        return sMessage;
    },

    isAlertsOutput : function(sExecutionOutput, bPatternWrite) {
        return sExecutionOutput === "ALERT" && bPatternWrite;
    },

    isEventsOutput : function(sExecutionOutput) {
        return sExecutionOutput === "INDICATOR";
    }

};
