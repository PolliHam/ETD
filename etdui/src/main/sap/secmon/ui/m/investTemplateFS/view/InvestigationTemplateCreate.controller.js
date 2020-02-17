jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.investTemplateFS.util.ODataErrorHandler");
jQuery.sap.require("sap.m.MessageBox");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.investTemplateFS.view.InvestigationTemplateCreate", {

    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    editModel : null,

    onInit : function() {

        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        oRouter.getRoute("create").attachMatched(this.onRouteMatched, this);

        this.editModel = new sap.ui.model.json.JSONModel({
            PatternId : null,
            TemplateDescription : "",
            Description : "",
            Severity : null,
            Attack : null,
            ManagementVisibility : null,
            Comment : "",
            // Dummy GUID. OData expects an entry for every field and validates the format. Will be replaced on server with unique one.
            Id : "0000000000000000"
        });
        this.getView().setModel(this.editModel, "editModel");
    },

    onRouteMatched : function(oEvent) {
        var oQuery = oEvent.getParameter("arguments")["?query"];
        // optional URL param
        if (oQuery && oQuery.pattern) {
            var patternId = this.oCommons.hexToBase64(oQuery.pattern);
            this.editModel.setProperty("/PatternId", patternId);
        }
    },

    onSave : function(oEvent) {
        var controller = this;
        var input1 = this.getView().byId("templateName");
        var input2 = this.getView().byId("description");

        if (this.checkLength(input1) && this.checkLength(input2)) {
            saveTemplate();
        }

        function saveTemplate() {
            var data = controller.editModel.getData();
            // the user can select a pattern, and later remove the pattern. This results in a blank string
            if (!data.PatternId || data.PatternId.length === 0) {
                data.PatternId = null;
            }
            var oModel = controller.getView().getModel();

            oModel.create("InvestigationTemplate", data, {
                success : function(data) {
                    sap.m.MessageToast.show(controller.getText("Saved_MSG"));

                    var id = controller.oCommons.base64ToHex(data.Id);
                    sap.ui.core.UIComponent.getRouterFor(controller).navTo("display", {
                        id : "InvestigationTemplate(X'" + id + "')",
                    }, true);
                },
                error : function(oError) {
                    var oI18nModel = controller.getView().getModel("i18n");
                    var oI18nCommonModel = controller.getView().getModel("i18nCommon");
                    sap.secmon.ui.m.investTemplateFS.util.ODataErrorHandler.showAlert(oError, oI18nModel, oI18nCommonModel);
                }
            });
        }
    },

    onDisplay : function(oEvent) {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("display", {
            id : oEvent.getSource().getBindingContext().getPath().slice(1)
        }, true);
    },

    onCancel : function(oEvent) {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    onCheckLength : function(oEvent) {
        var input = oEvent.getSource();
        this.checkLength(input);
    },
    /**
     * workaround for standard input validation. The SAPUI5 validation seems to be broken
     * 
     * @param input
     *            a SAPUI5 control
     * @return true if input validation was successful (no restraints violated)
     */
    checkLength : function(oInput) {

        var value = oInput.getValue();
        if (!value || value.length === 0) {
            oInput.setValueState(sap.ui.core.ValueState.Error);
            oInput.setValueStateText(this.getText("NameMustNotBeEmpty_MSG"));
            return false;
        } else {
            oInput.setValueState(sap.ui.core.ValueState.None);
            oInput.setValueStateText("");
            return true;
        }
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/a36c4563b44448009e3545fe64130eca.html");
    },

});
