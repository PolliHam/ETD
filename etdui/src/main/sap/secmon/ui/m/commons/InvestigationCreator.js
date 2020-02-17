jQuery.sap.declare("sap.secmon.ui.m.commons.InvestigationCreator");

sap.secmon.ui.m.commons.InvestigationCreator = function() {

    /*-
     * Shows a dialog for entering investigation properties.
     * Afterwards an investigation is created whether for the given alerts or
     * for alerts within specified PatternExecutionResult
     * Alerts are provided in an array:
     *          Alerts:
     *          [{
     *              AlertId : 'FE154636262...'
     *          }]
     *  
     *  PatternExecutionResult is provided as Object
     *          PatternExecutionResult:  
     *          {
     *              PatternExecutionResultId: "53FBB9311C42E6EDE10000000A4CF109",
     *          }
     * 
     * The following models are expected to be available on the given parent view:
     * 
     * 'component'  : containing common component preferences (e.g. csrf token)
     * 'enums'      : containing the required enums. Must contain the enums of object
     *                  sap.secmon.services.ui.m.invest/Investigation
     *                  
     * fnSuccessCallback is called if investigation creations is successful. The created investigation
     * is passed as object.
     */
    this.showInvestigationCreationDialog = function(aParameter, oParentView, fnSuccessCallback, oDefaultValues) {
        if (!this.oController) {
            this.oController = sap.ui.controller("sap.secmon.ui.m.commons.InvestigationCreatorDialog");
        }
        this.oController.openDialog(aParameter, oParentView, function(oCreatedInvestigation) {
            fnSuccessCallback(oCreatedInvestigation);
        }, null, oDefaultValues);
    };

    /**
     * show a menu with investigation templates (and an option to create an investigation free-style).
     * 
     * @param aAlerts
     *            array of Alert objects with AlertId
     * @param aPatternIds
     *            array of pattern IDs
     * @param oParentView
     *            the view from which the menu is shown
     * @param the
     *            button from which the menu is triggered, the menu is shown relative to it
     * 
     */
    this.showInvestigationCreationFromTemplateMenu = function(aAlerts, aPatternIds, oParentView, oButton, fnSuccessCallback) {
        if (!this.menuController) {
            this.menuController = sap.ui.controller("sap.secmon.ui.m.commons.InvestigationCreatorMenu");
        }
        var creator = this;
        this.menuController.openMenu(aPatternIds, oParentView, oButton, function(oInvestigationDefaults) {
            creator.showInvestigationCreationDialog(aAlerts, oParentView, fnSuccessCallback, oInvestigationDefaults);
        });
    };
};
