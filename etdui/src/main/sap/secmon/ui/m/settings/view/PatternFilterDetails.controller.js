jQuery.sap.require("sap.secmon.ui.m.settings.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.InputValidationService");
jQuery.sap.require("sap.secmon.ui.m.commons.UIUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.SelectionUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.ui.model.odata.CountMode");

jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.settings.view.PatternFilterDetails", {

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
        this.enableButtonsIfAtLeastOneRowIsSelected(this.getPatternTable(), [ "deleteButton" ]);

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
    },

    handleRouteMatched : function(oEvent) {
        var name = oEvent.getParameter("name");
        if (name === "patternFilterDetails") {
            this.sHeaderId = oEvent.getParameters().arguments.id;
            var sPath = "/PatternFilterHeader('" + this.sHeaderId + "')";
            this.getView().bindElement(sPath);
        }
    },

    onBackButtonPressed : function() {
        window.history.go(-1);
    },

    onAddPattern : function() {
        if (!this.patternSelectDialog) {
            this.patternSelectDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.commons.patternSuggestion.PatternSelectDialog", this);
            // set growing threshold to same size as patterns model in
            // EtdComponent which is 5000
            this.patternSelectDialog.setGrowingThreshold(this.getComponent().getModel("Patterns").iSizeLimit || 5000);
            this.getView().addDependent(this.patternSelectDialog);
        }
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.patternSelectDialog);

        // Read patterns of current pattern filter.
        // These patterns are excluded from the pattern selection dialog
        var query = "PatternFilterHeader('" + this.sHeaderId + "')/Details?$select=PatternId";
        var aCurrentPatters;
        var that = this;
        this.oModel.read(query, {
            success : function(oData) {
                aCurrentPatters = oData.results.map(function(o) {
                    return o.PatternId;
                });
                that.hidePatternsInDialog(aCurrentPatters);
                that.patternSelectDialog.open();
            }
        });

    },

    onSearchPatternSelectDialog : function(oEvent) {
        var sValue = oEvent.getParameter("value");
        var oFilter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sValue);
        var oBinding = oEvent.getSource().getBinding("items");
        oBinding.filter([ oFilter ]);
    },

    hidePatternsInDialog : function(aPatternIds) {
        this.patternSelectDialog.getItems().forEach(function(oItem) {
            var sPatternId;
            for (var i = 0; i < oItem.getCustomData().length; i++) {
                if (oItem.getCustomData()[i].getKey() === "patternId") {
                    sPatternId = this.oCommons.base64ToHex(oItem.getCustomData()[i].getValue());
                    break;
                }
            }

            if (aPatternIds.includes(sPatternId)) {
                oItem.setVisible(false);
            }
        }, this);
    },

    onConfirmPatternSelectDialog : function(oEvent) {
        var aContexts = oEvent.getParameter("selectedContexts");

        var aNewSelectedPatternFilterItems = aContexts.map(function(oContext) {
            return this.oCommons.base64ToHex(oContext.getObject().Id);
        }, this);
        this.addPatternsToPatternFilter(aNewSelectedPatternFilterItems);
    },

    getEntriesUrl : function() {
        return this.PATTERN_FILTER_URL + "/" + this.sHeaderId + "/FilterEntries";
    },

    addPatternsToPatternFilter : function(aPatternIds) {
        var controller = this;
        var csrfToken = this.getComponent().getCsrfToken();
        $.ajax({
            type : "POST",
            url : this.getEntriesUrl(),
            contentType : "application/json",
            data : JSON.stringify(aPatternIds),
            beforeSend : function(xhr) {
                xhr.setRequestHeader("X-CSRF-Token", csrfToken);
            },
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.m.MessageBox.alert(controller.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : controller.getCommonText("Error_TIT")
                });
            },
            complete : function() {
                // controller.patternSelectDialog.close();
                controller.oModel.refresh();
            }
        });
    },

    onRemovePattern : function() {
        var that = this;
        var confirmationText = this.getText("PatFil_confirmDelPat_XMSG");
        var confirmationTitle = this.getCommonText("Delete_TIT");
        sap.m.MessageBox.confirm(confirmationText, {
            title : confirmationTitle,
            icon : sap.m.MessageBox.Icon.WARNING,
            actions : [ sap.m.MessageBox.Action.DELETE, sap.m.MessageBox.Action.CANCEL ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.DELETE) {
                    that.deleteSelectedEntries();
                }
            }
        });
    },

    deleteSelectedEntries : function() {
        var controller = this;
        var aContexts = this.getPatternTable().getSelectedContexts();
        var aIds = aContexts.map(function(oContext) {
            return oContext.getProperty("Id");
        });
        var csrfToken = this.getComponent().getCsrfToken();
        $.ajax({
            type : "DELETE",
            url : this.getEntriesUrl(),
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
            done : function() {
                sap.m.MessageToast.show(controller.getText("PatFil_deleteOK_XMSG"));
            },
            complete : function() {
                controller.oModel.refresh();
            }
        });
    },

    getConfigurationURI : function(sKey) {
        return "Configuration(X'" + sKey + "')";
    },

    getPatternTable : function() {
        return this.getView().byId("patternTable");
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/a3a81dfef7524dc19cc3ea6186c39e39.html");
    },

});
