jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ClickableElementStyle.css");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.changelog.view.Record", {

    PROTOCOL_HEADER_SERICE : "/sap/secmon/services/protocol/ProtocolHeader.xsjs",

    onInit : function() {
        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);
        this.uiModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(this.uiModel, "uiModel");
    },

    onNavBack : function() {
        window.history.go(-1);
    },

    onRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "record") {
            return;
        }

        var sRecordId = oEvent.getParameters().arguments.id;

        var oData = {};
        var p1 = $.ajax({
            url : this.PROTOCOL_HEADER_SERICE + "/" + sRecordId + "/" + "SerializedObjectOld",
            type : "GET",
            success : function(data, textStatus, XMLHttpRequest) {
                oData.SerializedObjectOld = data;
            }
        });
        var p2 = $.ajax({
            url : this.PROTOCOL_HEADER_SERICE + "/" + sRecordId + "/" + "SerializedObjectNew",
            type : "GET",
            success : function(data, textStatus, XMLHttpRequest) {
                oData.SerializedObjectNew = data;
            }
        });

        var that = this;
        $.when(p1, p2).done(function() {
            that.uiModel.setData({
                oldState : oData.SerializedObjectOld,
                newState : oData.SerializedObjectNew
            });
        });

    },

});