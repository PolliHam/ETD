jQuery.sap.declare("sap.secmon.ui.m.commons.BookmarkCreator");

sap.secmon.ui.m.commons.BookmarkCreator = function() {

    /**
     * Shows a dialog for entering a bookmark description. Afterwards a bookmark
     * is created for the component from which the bookmark creator is called.
     * 
     * The following models are expected to be available on the given parent
     * view: device, i18n
     * 
     * Parameters:
     * 
     * @param 'oParentView' :
     *            needed for popup
     * @param 'sTitle' :
     *            suggested bookmark title (may be empty)
     * @param 'oParameters' :
     *            parameter object. Example: {status:[HIGH, VERY_HIGH]}
     * @param sObjectType
     *            either "Investigation" or "Alert"; Used to select the icon and
     *            count-service. Parameter is optional, default is "Alert".
     * 
     */
    this.showBookmarkCreationDialog = function(oParentView, sTitle, oParameters, sObjectType) {
        if (!this.oController) {
            this.oController = sap.ui.controller("sap.secmon.ui.m.commons.BookmarkCreatorDialog");
        }
        this.oController.openDialog(oParentView, sTitle, oParameters, sObjectType);
    };

};