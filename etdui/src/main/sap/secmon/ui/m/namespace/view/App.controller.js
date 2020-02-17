sap.ui.core.mvc.Controller.extend("sap.secmon.ui.m.namespace.view.App", {

    onInit : function() {
        // apply compact mode if touch is not supported
        if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
            this.getView().addStyleClass("sapUiSizeCompact");
        }
    },

});