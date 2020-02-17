sap.ui.controller("sap.secmon.ui.m.knowledgebase.view.App", {

    onInit : function() {

        if (!jQuery.support.touch || (jQuery.support.touch && sap.ui.Device.system.desktop)) {
            // apply compact mode if touch is not supported
            this.getView().addStyleClass("sapUiSizeCompact");
        }

        var oUIModel = new sap.ui.model.json.JSONModel({
            clearSearch : true
        });
        this.getView().setModel(oUIModel, "uiModel");
    }

});