jQuery.sap.declare("sap.secmon.ui.commons.UIUtils");

sap.secmon.ui.commons.UIUtils = {

    /**
     * returns the View oControl belongs to or null
     */
    getView : function(oControl) {
        while (oControl !== null && !(oControl instanceof sap.ui.core.mvc.View)) {
            oControl = oControl.getParent();
        }
        return oControl;
    }

};
