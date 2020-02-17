jQuery.sap.declare("sap.secmon.ui.m.commons.InvestigationAddendum");

sap.secmon.ui.m.commons.InvestigationAddendum = function() {

    /*-
     * Shows a dialog for adding alerts to an investigation. aAlerts has to
     * contain alert ids. Example: [{AlertId: "53EA5EBC08DC066CE10000000A4CF109"}]
     *
     * These alerts must not be assigned to investigations.
     *
     * The following models are expected to be available on the given parent
     * view:
     *
     * 'enums' : containing the required enums. Must contain the enums of object
     *           sap.secmon.services.ui.m.invest/Investigation
     *
     * fnSuccessCallback is called if adding alerts to investigation is
     * successful.
     */
    this.showInvestigationAddendumDialog = function(aAlerts, oParentView, fnSuccessCallback) {
        if (!this.oController) {
            this.oController = sap.ui.controller("sap.secmon.ui.m.commons.InvestigationAddendumDialog");
        }
        this.oController.openDialog(aAlerts, oParentView, function() {
            fnSuccessCallback();
        });
    };
    this.showGeneralInvestigationAddendumDialog = function(aObjects, oParentView, fnSuccessCallback, fnTokenProvider) {
        if (!this.oController) {
            this.oController = sap.ui.controller("sap.secmon.ui.m.commons.InvestigationAddendumDialog");
        }
        this.oController.openDialogEx(aObjects, oParentView, fnSuccessCallback, fnTokenProvider);
    };

};
