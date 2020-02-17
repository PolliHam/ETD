$.sap.require("sap.ui.commons.MessageBox");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.secmon.ui.loglearning.util.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

sap.ui.controller("sap.secmon.ui.loglearning.runs", {

    fnAutoRefresher : undefined,

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.loglearning.runs
     */
    onInit : function() {

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.getView().setModel(sap.ui.getCore().getModel("logDiscovery"));

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.getRoute("main").attachMatched(this.onMainRouteMatched, this);
    },

    onMainRouteMatched : function() {
        sap.ui.getCore().getModel("logDiscovery").refresh();
    },

    onAfterRendering : function() {

        var oBinding = this.getView().byId("tableRuns").getBinding("items");
        oBinding.attachDataReceived(function(oEvent) {
            var iCount = oBinding.getLength();
            var oCountModel = sap.ui.getCore().getModel("CountModel");
            if (oCountModel) {
                oCountModel.setProperty("/runCount", iCount);
            }
        });
    },

    onClear : function(oEvent) {
        var oFilterBar = this.getView().byId("filterBar");
        var oItems = oFilterBar.getAllFilterItems(true);
        for (var i = 0; i < oItems.length; i++) {
            var oControl = oFilterBar.determineControlByFilterItem(oItems[i]);
            if (oControl) {
                oControl.setValue("");
            }
        }
    },

    onSearch : function(oEvent) {
        var oView = this.getView();
        var oTable = oView.byId("tableRuns");
        var oBinding = oTable.getBinding("items");
        var oFilter;
        // apply filters to binding
        var aFilters = [];

        if (oEvent.getParameters().selectionSet[0] && oEvent.getParameters().selectionSet[0].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("RunName", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[0].getValue(), null);
            aFilters.push(oFilter);
        }

        if (oEvent.getParameters().selectionSet[1] && oEvent.getParameters().selectionSet[1].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[1].getValue(), null);
            aFilters.push(oFilter);
        }

        if (oEvent.getParameters().selectionSet[2] && oEvent.getParameters().selectionSet[2].getSelectedKey() !== "") {
            oFilter = new sap.ui.model.Filter("CommandType", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[2].getSelectedKey(), null);
            aFilters.push(oFilter);
        }

        if (oEvent.getParameters().selectionSet[3] && oEvent.getParameters().selectionSet[3].getSelectedKey() !== "") {
            oFilter = new sap.ui.model.Filter("Status", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[3].getSelectedKey(), null);
            aFilters.push(oFilter);
        }

        if (oEvent.getParameters().selectionSet[4] && oEvent.getParameters().selectionSet[4].getSelectedKey() !== "") {
            oFilter = new sap.ui.model.Filter("StagingRulesStatus", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[4].getSelectedKey(), null);
            aFilters.push(oFilter);
        }

        if (oEvent.getParameters().selectionSet[5] && oEvent.getParameters().selectionSet[5].getSelectedKey() !== "") {
            oFilter = new sap.ui.model.Filter("ProductiveRulesStatus", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[5].getSelectedKey(), null);
            aFilters.push(oFilter);
        }

        if (oEvent.getParameters().selectionSet[6] && oEvent.getParameters().selectionSet[6].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("CreatedBy", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[6].getValue(), null);
            aFilters.push(oFilter);
        }

        if (oEvent.getParameters().selectionSet[7] && oEvent.getParameters().selectionSet[7].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("ChangedBy", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[7].getValue(), null);
            aFilters.push(oFilter);
        }

        oBinding.filter(aFilters);
    },

    /**
     * Opens the given run
     * 
     * @param oRun
     *            The Run
     */
    openRun : function(oRun) {
        var sRunName = oRun.RunName;
        var oController = this;

        // get shell
        var oShell = this.getView().getParent().getParent().getController();
        var oRunTable = this.getView().byId("tableRuns");

        // The router has a "feature" not to dispatch to event handlers if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new value each
        // time.
        var oQueryParam = {
            lastNav : this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date())
        };

        if (oRun.StagingCount === 0 && oRun.CommandType === "Staging" && oRun.Status === "Successful") {
            console.debug("No entry types found for run, but status is successful, therefore invoking procedure");

            if (oRunTable) {
                oRunTable.setBusy(true);
            }
            // Ajax
            var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=buildEntryTypes&runName=" + encodeURIComponent(sRunName));
            sap.ui.getCore().getModel("logDiscovery").refresh();
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                if (oRunTable) {
                    oRunTable.setBusy(false);
                }
                oShell.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
                sap.ui.getCore().getModel("logDiscovery").refresh();

            });

            promise.done(function(data, textStatus, jqXHR) {
                if (oRunTable) {
                    oRunTable.setBusy(false);
                }
                if (data.status === "Ok") {
                    sap.ui.core.UIComponent.getRouterFor(oController).navTo("entryTypes", {
                        "run" : sRunName,
                        "query" : oQueryParam
                    });
                } else {
                    oShell.reportErrorMessage(decodeURIComponent(data.text));
                }
                sap.ui.getCore().getModel("logDiscovery").refresh();
            });
        } else {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("entryTypes", {
                "run" : sRunName,
                "query" : oQueryParam
            });
        }
    },

    /**
     * Invoked when user opens one run
     * 
     * @memberOf sap.secmon.ui.loglearning.runs
     */
    onPressOpenRun : function(oEvent) {
        // get selected run from text of link
        var oBindingContext = oEvent.getParameters().listItem.getBindingContext();
        if (oBindingContext) {
            this.openRun(oBindingContext.getObject(""));
        }
    },

    /**
     * Row selection change of run table
     * 
     * @param oEvent
     */
    onRowSelectionChange : function(oEvent) {
        var bRunIsSelected = oEvent.getSource().getSelectedItems().length > 0;
        this.getView().getParent().getModel("shellModel").setProperty("/runIsSelected", bRunIsSelected);
    },

    onPressSettings : function(oEvent) {
        var oDialog = sap.ui.xmlfragment("sap.secmon.ui.loglearning.runsSettingsDialog", this);
        this.getView().addDependent(oDialog);
        oDialog.open();
    },

    onConfirm : function(oEvent) {
        var oView = this.getView();
        var oTable = oView.byId("tableRuns");
        var mParams = oEvent.getParameters();
        var oBinding = oTable.getBinding("items");
        var aSorters = [];

        // apply sorter
        var sPath = mParams.sortItem.getKey();
        var bDescending = mParams.sortDescending;
        aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
        oBinding.sort(aSorters);
    }

});