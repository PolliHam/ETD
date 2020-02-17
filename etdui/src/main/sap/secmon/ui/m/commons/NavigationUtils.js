jQuery.sap.declare("sap.secmon.ui.m.commons.NavigationUtils");

sap.secmon.ui.m.commons.NavigationUtils = {

    /**
     * @public navigate back to previous view. This only works if the component
     *         embeds a navigable UI control like sap.m.NavContainer or
     *         sap.m.SplitContainer. In other cases, a call to this function
     *         does not have any effect.
     */
    myNavBack : function(oRouter, sRoute, mData) {
        var oHistory = sap.ui.core.routing.History.getInstance();
        var sPreviousHash = oHistory.getPreviousHash();

        // The history contains a previous entry
        if (sPreviousHash !== undefined) {
            window.history.go(-1);
        } else {
            var bReplace = true; // otherwise we go backwards with a forward
            // history
            oRouter.navTo(sRoute, mData, bReplace);
        }
    }

};
