jQuery.sap.declare("sap.secmon.ui.m.commons.LoglearningRunCreator");

sap.secmon.ui.m.commons.LoglearningRunCreator = function() {

    /*-
     * Shows a dialog for entering run properties.
     * Afterwards a run is created.
     * @param oParentView the parent view from which the dialog is opened
     * @param aSampleLogs optional. if supplied, a run is created with given sample logs (array of strings).
     * If not, the popup dialog shows a file upload.
     * @param fnSuccessCallback callback which is executed on success
     */
    this.showRunCreationDialog = function(oParentView, aSampleLogs, fnSuccessCallback) {
        
        this.oController = sap.ui.controller("sap.secmon.ui.m.commons.dialogs.CreateRunDialog");        
        this.oController.openDialog(oParentView, aSampleLogs, function(oCreatedRun) {
            fnSuccessCallback(oCreatedRun);
        });
    };

};
