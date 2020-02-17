jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.settings.view.AnomalyDetail", {

    CHANGE_SERVICE_URL : "/sap/secmon/services/configuration/ConfigurationParameters.xsjs",

    constructor : function() {
        sap.ui.core.mvc.Controller.apply(this, arguments);
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.uiModel = new sap.ui.model.json.JSONModel();
    },

    onInit : function() {
        sap.ui.core.UIComponent.getRouterFor(this).attachRoutePatternMatched(this.handleRoute, this);
        this.getView().setModel(this.uiModel);
    },

    handleRoute : function(oEvent) {
        var routeName = oEvent.getParameter("name");
        if (routeName !== 'anomaly') {
            return;
        }

        this.loadData();
    },

    loadData : function() {
        var that = this;
        var oModel = this.getComponent().getModel("ConfigurationParameters");
        oModel.read("/ConfigurationParameters('AnomalyDataCollection')", {
            success : function(oData) {
                var sAnomalyDataCollection = oData.ValueVarChar;
                var uiData = {
                    All : sAnomalyDataCollection === "All",
                    ActiveOnly : sAnomalyDataCollection === "ActiveOnly"
                };
                that.uiModel.setData(uiData);
            },
            error : function(oError) {
                sap.m.MessageBox.alert(oError.response.statusText, {
                    title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/CommonUIText.hdbtextbundle", "Error_TIT")
                });
            }
        });
    },

    onBackButtonPressed : function() {
        window.history.go(-1);
    },

    onSave : function() {
        var oData = this.uiModel.getData();

        // update
        this.showBusyIndicator();
        var sAnomalyDataCollection;
        if (oData.All) {
            sAnomalyDataCollection = "All";
        } else {
            sAnomalyDataCollection = "ActiveOnly";
        }

        var csrfToken = this.getComponent().getCsrfToken();
        var controller = this;
        $.ajax({
            type : "POST",
            url : this.CHANGE_SERVICE_URL,
            data : JSON.stringify({
                AnomalyDataCollection : sAnomalyDataCollection
            }),
            contentType : "application/json; charset=UTF-8",
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            success : function() {
                sap.m.MessageToast.show(controller.getText("MngAl_Saved_MSG"));
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : controller.getCommonText("Error_TIT")
                });
            },
            complete : function() {
                controller.hideBusyIndicator();
                controller.loadData();
            }
        });
    },

    showBusyIndicator : function() {
        this.getView().byId("AnomalyPage").setBusy(true);
    },

    hideBusyIndicator : function() {
        this.getView().byId("AnomalyPage").setBusy(false);
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/a3a81dfef7524dc19cc3ea6186c39e39.html");
    },

});
