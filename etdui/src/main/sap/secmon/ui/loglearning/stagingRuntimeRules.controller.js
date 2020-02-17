jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("sap.secmon.ui.loglearning.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.stagingRuntimeRules", {

    constructor : function() {
        sap.secmon.ui.m.commons.EtdController.apply(this, arguments);
    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.loglearning.stagingRuntimeRules
     */
    onInit : function() {

        this.getView().setModel(sap.ui.getCore().getModel("RunJSONModel"));
        this.getView().setModel(new sap.ui.model.json.JSONModel({
            busyRulesTable : false,
            busyExtractionTable : false,
            selectedEntryType : null
        }), "uiModel");

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.getRoute("runtimeRules").attachMatched(this.onRouteMatched, this);
    },

    onRouteMatched : function(oEvent) {
        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }
    },

    /**
     * Handles the selection event of the header table
     * 
     * @param oEvent
     */
    onHeaderSelection : function(oEvent) {
        var oView = this.getView();
        var uiModel = oView.getModel("uiModel");
        var oTableExtraction = sap.ui.core.Fragment.byId(this.getView().createId("extractions"), "tableExtraction");
        uiModel.setProperty("/busyExtractionTable", true);

        var entryType = oEvent.getParameter("rowContext");
        if (oEvent.getSource().getSelectedIndices() && oEvent.getSource().getSelectedIndices().length > 0) {

            var oBinding = oTableExtraction.getBinding("rows");
            if (oBinding) {
                oBinding.filter([ new sap.ui.model.Filter({
                    path : "Id",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : oEvent.getParameter("rowContext").getProperty("Id")
                }) ]);
            }
            // Load value mapping for selected rule
            oView.byId("viewStagingRulesValueMapping").getController().setSelectedEntryType(entryType);
            uiModel.setProperty("/selectedEntryType", entryType);
        } else {
            oView.byId("viewStagingRulesValueMapping").getController().setSelectedEntryType();
            uiModel.setProperty("/selectedEntryType", null);
        }

        uiModel.setProperty("/busyExtractionTable", false);
    },

    /**
     * Handles the change event of the pattern input field
     * 
     * @param oEvent
     */
    onChangeCustomRegex : function(oEvent) {
        this._setSaveNeeded(true);
    },

    validateCustomRegex : function(oEvent) {
        var input = oEvent.getSource();
        var oBindingContext = input.getBindingContext();
        var sCustomRegex = oBindingContext.getProperty("CustomRegex");
        var sMarkup = oBindingContext.getProperty("Markup");

        if (sCustomRegex && sCustomRegex.length > 0) {
            try {
                // User will input regex for Java (with named groups and negative lookbehind).
                // But validation happens in browser with JS Regex.
                var sDowngradedRegex = sap.secmon.ui.loglearning.util.Formatter.downgradeRegex(sCustomRegex);
                var oRegex = new RegExp(sDowngradedRegex);
                oRegex.exec(sMarkup);

                input.setValueState(sap.ui.core.ValueState.None);
                input.setValueStateText("");

            } catch (e) {
                input.setValueState(sap.ui.core.ValueState.Error);
                input.setValueStateText(e.toLocaleString());
            }
        }
    },

    /**
     * Sets the save needed flag
     * 
     * @param bSaveNeeded
     */
    _setSaveNeeded : function(bSaveNeeded) {
        sap.ui.getCore().getModel("RunModel").setProperty("/isSaveNeeded", bSaveNeeded);
    }
});