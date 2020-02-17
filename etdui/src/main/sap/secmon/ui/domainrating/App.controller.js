sap.ui.controller("sap.secmon.ui.domainrating.App", {
    onInit : function() {
        if (!jQuery.support.touch) { // apply compact mode if touch is not
            // supported
            this.getView().addStyleClass("sapUiSizeCompact");
        }
    }

});