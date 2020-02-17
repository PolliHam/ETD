jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.settings.view.WorkloadManagement", {

    CHANGE_SERVICE_URL : "/sap/secmon/services/workloadManager/workloadClassService.xsjs",

    constructor : function() {
        sap.ui.core.mvc.Controller.apply(this, arguments);
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.oModel = new sap.ui.model.json.JSONModel();
    },

    onInit : function() {
        sap.ui.core.UIComponent.getRouterFor(this).attachRoutePatternMatched(this.handleRoute, this);
        this.getView().setModel(this.oModel);
    },

    handleRoute : function(oEvent) {
        var routeName = oEvent.getParameter("name");
        if (routeName !== 'workloadManagement') {
            return;
        }

        this.loadData();
    },

    loadData : function() {
        this.oModel.loadData(this.CHANGE_SERVICE_URL, null, false);
        var isEnabled = this.oModel.getData().isEnabled;
        var uiData;
        if (isEnabled === "true") {
            uiData = {
                wlmState : "Activated",
                wlmStateText : this.getText("WlmActivated_LBL"),
                wlmButtonText : this.getText("WlmDeactivate_LBL")
            };
        } else {
            uiData = {
                wlmState : "Deactivated",
                wlmStateText : this.getText("WlmDeactivated_LBL"),
                wlmButtonText : this.getText("WlmActivate_LBL")
            };
        }

        this.oModel.setData(uiData);
    },

    onWlmButtonPressed : function() {
        var oData = this.oModel.getData();

        // update
        this.showBusyIndicator();
        var status;
        if (oData.wlmState === 'Activated') {
            status = false;
        } else if (oData.wlmState === 'Deactivated') {
            status = true;
        }

        var csrfToken = this.getComponent().getCsrfToken();
        var controller = this;
        $.ajax({
            type : "POST",
            url : this.CHANGE_SERVICE_URL,
            data : JSON.stringify({
                status : status
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

    onBackButtonPressed : function() {
        window.history.go(-1);
    },

    onSave : function() {

    },

    showBusyIndicator : function() {
        this.getView().byId("WorkloadManagementPage").setBusy(true);
    },

    hideBusyIndicator : function() {
        this.getView().byId("WorkloadManagementPage").setBusy(false);
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/a3a81dfef7524dc19cc3ea6186c39e39.html");
    },

});