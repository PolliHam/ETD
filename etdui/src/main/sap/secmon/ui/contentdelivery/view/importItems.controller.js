jQuery.sap.require("sap.ui.model.odata.CountMode");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.contentdelivery.view.importItems", {

    oRouter : null,
    fnAutoRefresh : undefined,

    handleRouteMatched : function(oEvent) {
        if (oEvent.getParameters().name !== "ImportItems") {
            return;
        }
        this.getView().bindObject("/ImportHeader('" + oEvent.getParameters().arguments.Id + "')");
    },

    onInit : function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);

        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/services/contentdelivery/ContentDelivery.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }));

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

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    _setCount : function() {
        var oList = this.getView().byId("table");
        var count = oList.getBinding("items").getLength();
        this.getView().byId("page").setTitle(this.getView().getModel("i18n").getProperty("CD_TitleItems") + " (" + count + ")");
    },

    onPressSettings : function(oEvent) {
        var oDialog = sap.ui.xmlfragment("sap.secmon.ui.contentdelivery.view.ImportItemsSettingsDialog", this);
        this.getView().addDependent(oDialog);
        oDialog.open();
    },

    onConfirm : function(oEvent) {
        var oView = this.getView();
        var oTable = oView.byId("table");
        var mParams = oEvent.getParameters();
        var oBinding = oTable.getBinding("items");
        var aSorters = [], sPath, bDescending;

        // apply sorter
        if (mParams.groupItem) {
            sPath = mParams.groupItem.getKey();
            bDescending = mParams.groupDescending;
            aSorters.push(new sap.ui.model.Sorter(sPath, bDescending, true));
        }
        sPath = mParams.sortItem.getKey();
        bDescending = mParams.sortDescending;
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
                sPath = "Id";
                break;
            case 1:
                sPath = "Name";
                break;
            case 2:
                sPath = "Namespace";
                break;
            case 3:
                sPath = "Description";
                break;
            case 4:
                sPath = "Status";
                break;
            }

            if (element.getValue() !== "") {
                var oFilter = new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.Contains, element.getValue(), null);
                aFilters.push(oFilter);
            }
        });

        oBinding.filter(aFilters);
    }
});