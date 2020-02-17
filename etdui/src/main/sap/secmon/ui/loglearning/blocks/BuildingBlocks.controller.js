/* globals oTextBundle */
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.m.MessageBox");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.blocks.BuildingBlocks", {

    oRouter : null,
    _oCommonFunctions : null,

    handleRouteMatched : function(oEvent) {
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    onInit : function() {
        this._oCommonFunctions = new sap.secmon.ui.commons.CommonFunctions();

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);

        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/loginterpretation/logDiscoveryAPI.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }));

        this.getView().setModel(new sap.ui.model.json.JSONModel({
            isSelected : false
        }), "UI");

        this.getView().byId("table").getBinding("items").sort([ new sap.ui.model.Sorter("GroupName", false) ]);

        this.getView().getModel().attachRequestCompleted(this._setCount, this);
    },

    reportWarning : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Warning, sText, sText);
    },

    reportErrorMessage : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sText);
    },

    reportSuccess : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, sText);
    },

    _setCount : function() {
        var oList = this.getView().byId("table");
        return oList.getBinding("items").getLength();
    },

    onPressSettings : function(oEvent) {
        if (!this.oSettingsDialog) {
            this.oSettingsDialog = sap.ui.xmlfragment("sap.secmon.ui.loglearning.blocks.BuildingBlocksSettingsDialog", this);
            this.getView().addDependent(this.oSettingsDialog);
        }        
        this.oSettingsDialog.open();
    },

    onConfirm : function(oEvent) {
        var oView = this.getView();
        var oTable = oView.byId("table");
        var mParams = oEvent.getParameters();
        var oBinding = oTable.getBinding("items");
        var aSorters = [];

        // apply sorter
        var sPath = mParams.sortItem.getKey();
        var bDescending = mParams.sortDescending;
        aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
        oBinding.sort(aSorters);
    },

    onPressRefresh : function(oEvent) {
        this.getView().getModel().refresh();
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
        var oView = this.getView(), oFilter;
        var oTable = oView.byId("table");
        var mParams = oEvent.getParameters();
        var oBinding = oTable.getBinding("items");

        // apply filters to binding
        var aFilters = [];

        if (oEvent.getParameters().selectionSet[0] && mParams.selectionSet[0].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("GroupName", sap.ui.model.FilterOperator.Contains, mParams.selectionSet[0].getValue(), null);
            aFilters.push(oFilter);
        }

        if (oEvent.getParameters().selectionSet[1] && mParams.selectionSet[1].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("GroupNameSpace", sap.ui.model.FilterOperator.Contains, mParams.selectionSet[1].getValue(), null);
            aFilters.push(oFilter);
        }

        oBinding.filter(aFilters);
    },

    onItemPress : function(oEvent) {
        var bLogLearningWrite = this.getView().getModel("applicationContext").getProperty("/userPrivileges/logLearningWrite");
        if (bLogLearningWrite) {
            var sGroupHashHex = this._oCommonFunctions.base64ToHex(oEvent.getParameter("listItem").getBindingContext().getProperty("GroupHash"));
            sap.ui.core.UIComponent.getRouterFor(this).navTo("BuildingBlockDetails", {
                "GroupHash" : sGroupHashHex
            });
        } else {
            sap.m.MessageBox.show(oTextBundle.getText("PrivilegesErrorMessage"), sap.m.MessageBox.Icon.ERROR, "Error");
        }
    },

    onSelectionChange : function(oEvent) {
        this.getView().getModel("UI").setProperty("/isSelected", this.getView().byId("table").getSelectedItems().length > 0 ? true : false);
    },

    onPressDelete : function(oEvent) {
        var that = this;
        var oView = this.getView();
        var oTable = oView.byId("table");
        var oModel = oView.getModel();
        var aItems = oTable.getSelectedItems();
        var oData = {
            "names" : []
        };

        if (!aItems || aItems.length === 0) {
            new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, oTextBundle.getText("Interpret_SelectARun"));
            return;
        }

        // Confirmation Dialog
        sap.m.MessageBox.confirm(oTextBundle.getText("Interpret_DelBBReally"), function(oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                // Collect paths
                $.each(aItems, function(iIndex, oItem) {
                    oData.names.push({
                        "GroupName" : oItem.getBindingContext().getProperty("GroupName"),
                        "GroupNameSpace" : oItem.getBindingContext().getProperty("GroupNameSpace")
                    });
                });

                if (oData.names.length > 0) {
                    oView.setBusy(true);
                    var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=deleteConstantValueBuildingBlocks", JSON.stringify(oData));
                    promise.fail(function(jqXHR, textStatus, errorThrown) {
                        oModel.refresh();
                        oView.setBusy(false);
                        that.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
                    });
                    promise.done(function(data, textStatus, jqXHR) {
                        oModel.refresh();
                        oView.setBusy(false);
                        oTable.removeSelections(true);
                        oView.getModel("UI").setProperty("isSelected", false);
                        that.reportSuccess(oTextBundle.getText("Interpret_BBDeleted"));
                    });
                }
            }
        }, "{i18n>Interpret_DeleteRun}");
    }
});