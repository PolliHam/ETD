jQuery.sap.require("sap.secmon.ui.m.settings.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.m.commons.UIUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.SelectionUtils");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.ui.model.odata.CountMode");

jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.settings.view.PatternFilter", {

    PATTERN_FILTER_URL : "/sap/secmon/services/patternfilter/PatternFilter.xsjs",

    constructor : function() {
        sap.ui.core.mvc.Controller.apply(this, arguments);
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.oUiUtils = new sap.secmon.ui.m.commons.UIUtils();
    },

    onInit : function() {
        this.oModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/patternfilter/PatternFilter.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.oModel.attachRequestFailed(this.oCommons.handleRequestFailed);
        this.getView().setModel(this.oModel);
        this.enableButtonsIfAtLeastOneRowIsSelected(this.getPatternFilterTable(), [ "deleteButton" ]);
    },

    onBackButtonPressed : function() {
        window.history.go(-1);
    },

    onAddPatternFilter : function() {
        if (!this.addPatternFilterDialog) {
            this.createAddPatternFilterDialog();
        }
        this.oEditModel = new sap.ui.model.json.JSONModel({
            name : ""
        });
        this.addPatternFilterDialog.setModel(this.oEditModel);
        this.oInputValidationService.resetValueStateOfControls();
        this.addPatternFilterDialog.open();
    },

    onDeletePatternFilter : function() {
        var that = this;
        var confirmationText = this.getText("PatFil_confirmDel_XMSG");
        var confirmationTitle = this.getCommonText("Delete_TIT");
        sap.m.MessageBox.confirm(confirmationText, {
            title : confirmationTitle,
            icon : sap.m.MessageBox.Icon.WARNING,
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.DELETE) {
                    that.deleteSelectedPatternFilters();
                }
            }
        });
    },

    deleteSelectedPatternFilters : function() {
        var controller = this;
        var aContexts = this.getPatternFilterTable().getSelectedContexts();
        var aIds = aContexts.map(function(oContext) {
            return oContext.getProperty("Id");
        });
        var csrfToken = this.getComponent().getCsrfToken();
        $.ajax({
            type : "DELETE",
            url : this.PATTERN_FILTER_URL,
            contentType : "application/json",
            data : JSON.stringify(aIds),
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : controller.getCommonText("Error_TIT")
                });
            },
            success : function() {
                sap.m.MessageToast.show(controller.getText("PatFil_deleteOK_XMSG"));
            },
            complete : function() {
                controller.oModel.refresh();
            }
        });
    },

    getPatternFilterTable : function() {
        return this.getView().byId("patternFilterTable");
    },

    createAddPatternFilterDialog : function() {
        this.addPatternFilterDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.settings.view.AddPatternFilterDialog", this);
        this.addPatternFilterDialog.setModel(this.baseI18nModel, "i18n");
        var oView = this.getView();
        oView.addDependent(this.addPatternFilterDialog);
        var aInputs = [ oView.byId("nameInput") ];
        this.oInputValidationService = new sap.secmon.ui.commons.InputValidationService(aInputs);
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.addPatternFilterDialog);
    },

    onAddPatternFilterDialogOk : function() {
        if (!this.oInputValidationService.checkControls()) {
            return;
        }
        var oData = this.oEditModel.getData();
        var patternFilterName = oData.name;
        var controller = this;
        var url = this.PATTERN_FILTER_URL;
        var csrfToken = this.getComponent().getCsrfToken();
        $.ajax({
            type : "POST",
            url : url,
            contentType : "application/json",
            data : JSON.stringify({
                name : patternFilterName
            }),
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : controller.getCommonText("Error_TIT")
                });
            },
            complete : function() {
                controller.addPatternFilterDialog.close();
                controller.oModel.refresh();
            }
        });
    },

    onAddPatternFilterDialogCancel : function() {
        this.addPatternFilterDialog.close();
    },

    onPatternFilterClicked : function(e) {
        var sId = e.getSource().getBindingContext().getProperty("Id");
        sap.ui.core.UIComponent.getRouterFor(this).navTo("patternFilterDetails", {
            id : sId,
        }, false);
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/d9d4647d3a7b42598c3ac1ecd24e1998.html");
    },
});
