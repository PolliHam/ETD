jQuery.sap.declare("sap.secmon.ui.m.commons.AlertExceptionCreator");
jQuery.sap.require("sap.secmon.ui.m.commons.UIUtils");

sap.secmon.ui.m.commons.AlertExceptionCreator = function() {

    this.uiUtils = new sap.secmon.ui.m.commons.UIUtils();

    // show alert exemption creation dialog
    // provide either a pattern id or an alert id
    this.showAlertExceptionCreationDialog = function(sPatternId, sAlertId, oParentView, fnSuccessCallback) {
        function checkId(sId) {
            if (sId === undefined || sId === null) {
                return false;
            }
            return (sId.length === 32);
        }

        var patternProvided = checkId(sPatternId);
        var alertProvided = checkId(sAlertId);
        var requestOk = (patternProvided && !alertProvided) || (!patternProvided && alertProvided);
        if (!requestOk) {
            this.uiUtils.showAlert(oParentView, "Provide patternId or alertId as parameter");
            return;
        }

        if (!this.oController) {
            this.oController = sap.ui.controller("sap.secmon.ui.m.commons.alertexceptions.AlertExceptionCreatorDialog");
        }
        this.oController.openDialog(sPatternId, sAlertId, oParentView, fnSuccessCallback);
    };

};
