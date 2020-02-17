jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.valuelist.view.App", {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.m.valuelist.view.Master
     */
    onInit : function() {
        // apply compact mode if touch is not supported
        if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
            this.getView().addStyleClass("sapUiSizeCompact");
        }
    },

});