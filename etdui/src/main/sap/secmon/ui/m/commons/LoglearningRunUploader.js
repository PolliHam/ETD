jQuery.sap.declare("sap.secmon.ui.m.commons.LoglearningRunUploader");

sap.secmon.ui.m.commons.LoglearningRunUploader = function() {

    /*-
     * Shows a dialog for uploading a run
     * 
     * @param oParentView the parent view from which the dialog is opened
     * @param fnSuccessCallback callback which is executed on success
     */
    this.showRunUploadDialog = function(oParentView, fnSuccessCallback) {
        
        this.oController = sap.ui.controller("sap.secmon.ui.m.commons.dialogs.UploadRunDialog");      
        this.oController.openDialog(oParentView, function(oUploadedRun) {
            fnSuccessCallback(oUploadedRun);
        });
    };

};
