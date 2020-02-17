/* globals oTextBundle */
$.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.commons.AjaxUtil");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.m.commons.EtdController");
$.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/FilterBarWithSameSizedItems.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.contentdelivery.view.contentDelivery", {

    oRouter : null,
    fnAutoRefresh : undefined,
    sImportedStatus : 'Imported',

    handleRouteMatched : function(oEvent) {
        if (oEvent.getParameters().name !== "main") {
            return;
        }

        this.getView().getModel().refresh();
    },

    onInit : function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);

        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/services/contentdelivery/ContentDelivery.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }));

        this.getView().setModel(new sap.ui.model.json.JSONModel({
            importEnabled : ""
        }), "UI");

        this.getView().getModel().attachRequestCompleted(this._setCount, this);
    },

    reportWarning : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Warning, sText, sText);
    },

    reportError : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sText);
    },

    reportSuccess : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, sText);
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    _setCount : function() {
        var oList = this.getView().byId("table");
        var count = oList.getBinding("items").getLength();
        this.getView().byId("page").setTitle(this.getView().getModel("i18n").getProperty("CD_TitleHeader") + " (" + count + ")");
        this.handleStatus();
    },

    onPressSettings : function(oEvent) {
        var oDialog = sap.ui.xmlfragment("sap.secmon.ui.contentdelivery.view.ImportHeaderSettingsDialog", this);
        this.getView().addDependent(oDialog);
        oDialog.open();
    },
    getReleaseConfirmationDialog : function() {
        if (!this.releaseConfirmationDialog) {
            this.releaseConfirmationDialog = sap.ui.xmlfragment("sap.secmon.ui.contentdelivery.view.ConfirmationDialog", this);
            this.getView().addDependent(this.releaseConfirmationDialog);
        }
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.releaseConfirmationDialog);

        return this.releaseConfirmationDialog;
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
        var oTable = oView.byId("table");
        var oBinding = oTable.getBinding("items");

        // apply filters to binding
        var aFilters = [];

        $.each(oEvent.getParameters().selectionSet, function(index, element) {
            var sPath;

            switch (index) {
            case 0:
                sPath = "Name";
                break;
            case 1:
                sPath = "Namespace";
                break;
            case 2:
                sPath = "Description";
                break;
            case 3:
                sPath = "Status";
                break;
            }

            if (element.getValue() !== "") {
                var oFilter = new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.Contains, element.getValue(), null);
                aFilters.push(oFilter);
            }
        });

        oBinding.filter(aFilters);
    },

    onItemPress : function(oEvent) {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("ImportItems", {
            "Id" : oEvent.getParameter("listItem").getBindingContext().getProperty("Id")
        });
    },

   
    handleStatus : function(){
        var aSelectedItems = this.getSelectedItems();
        function checkStatus(sStatus){
            return aSelectedItems.length > 0 && aSelectedItems.every(function(oItem){
                return oItem.getBindingContext().getProperty("Status") === sStatus;
            }.bind(this));
        }
        
        this.getView().getModel("UI").setProperty("/importEnabled" , checkStatus(this.sImportedStatus) ? 'statusReset' : checkStatus(null) ? 'importEnabled' : '');
    },

    onSelectionChange : function(oEvent) {
        this.handleStatus();
    },

    checkVersion : function(versionInformation) {
        function checkVersionIsEqual(compareVersion, version) {
            return compareVersion === version;
        }
        var duVersionInformation = this.getView().getModel("applicationContext").getData().version;
        var duVersion = [ "VERSION", "VERSION_SP", "VERSION_PATCH" ].map(function(property) {
            return duVersionInformation[property];
        }).join(".");
        var checkVersionFunction = checkVersionIsEqual.bind(checkVersionIsEqual, duVersion);
        return versionInformation.every(function(versionSupported) {
            return versionSupported.some(checkVersionFunction);
        });
    },
    getSelectedItems : function() {
        return this.getView().byId("table").getSelectedItems();
    },
    onPressImport : function(oEvent) {
        var aSelectedItems = this.getSelectedItems();

        var versions = aSelectedItems.map(function(item) {
            return item.getBindingContext().getProperty("Validity").split(",");
        });
        if (!this.checkVersion(versions)) {
            this.getReleaseConfirmationDialog().open();
        } else {
            this.sendIdsToServer(aSelectedItems);
        }
        return;
    },
    importConfirmed : function(oEvent) {
        var aSelectedItems = this.getSelectedItems();
        this.sendIdsToServer(aSelectedItems);
        this.getReleaseConfirmationDialog().close();
    },
    importCanceled : function(oEvent) {
        this.getReleaseConfirmationDialog().close();
    },
    sendIdsToServer : function(aSelectedItems) {
        var that = this;
        var oBody = {
            Ids : []
        };
        oBody.Ids = aSelectedItems.map(function(element) {
            return element.getBindingContext().getProperty("Id");
        });

        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/contentdelivery/importService.xsjs", JSON.stringify(oBody));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            var oError = JSON.parse(jqXHR.responseText);
            that.reportErrorMessage(oError.text);
        });
        promise.done(function(data, textStatus, jqXHR) {
            that.getView().getModel().refresh();
            that.reportSuccess(oTextBundle.getText("CD_ImportSuccess"));

            // wait 2sec then navigate to replication ui
            setTimeout(function() {
                that._NavigateToContentReplication("Import");
            }, 2000);
        });

    },
    onPressStatusLink : function(oEvent) {
        var sContentPackageId = oEvent.getSource().getBindingContext().getProperty("Name");
        this._NavigateToContentReplication("Import", sContentPackageId);
    },

    onPressReset : function(oEvent){
        var that = this;
        var oBody = {
            operation : 'resetStatus',
            Ids : this.getSelectedItems().map(function(oItem){
                return oItem.getBindingContext().getProperty('Id');
            }),
        };
        var oPromise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/services/contentdelivery/importService.xsjs", JSON.stringify(oBody));
        oPromise.fail(function(jqXHR, textStatus, errorThrown) {
            var oError = JSON.parse(jqXHR.responseText);
            that.reportErrorMessage(oError.text);
        });
        oPromise.done(function(data, textStatus, jqXHR) {
            that.getView().getModel().refresh();
            that.reportSuccess(oTextBundle.getText("CD_ResetSuccess"));
        });
        
    },

    _NavigateToContentReplication : function(sTarget, sContentPackageId) {
        // Navigate into content replication UI
        sap.secmon.ui.m.commons.NavigationService.openContentReplication(sTarget, sContentPackageId);
    }
});