sap.ui.controller("sap.secmon.ui.m.alerts.App", {

    onInit : function() {

        if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
            // apply compact mode if touch is not supported
            this.getView().addStyleClass("sapUiSizeCompact");
        }
    }

});