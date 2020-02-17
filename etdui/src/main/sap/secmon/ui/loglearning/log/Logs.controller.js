/* globals oTextBundle, oDateFormatterEx */
$.sap.require("sap.secmon.ui.loglearning.Helper");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.log.Logs", {

    oRouter : null,

    handleRouteMatched : function(oEvent) {
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    onInit : function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
        
        // Model for filters and sorters
        var oModelFiltersAndSorters = new sap.ui.model.json.JSONModel({
            "TimerangeType" : "Relative",
            "TimerangeRelative" : "lastHour",
            "TimerangeTo" : null,
            "TimerangeFrom" : null,
            "ESPInstanceId" : null,
            "SourceIPAddress" : null,
            "TechnicalLogCollectorIPAddress" : null,
            "TechnicalLogCollectorPort" : null,
            "ShortMessage" : null,
            "ReasonCode" : null
        });
        this.getView().setModel(oModelFiltersAndSorters, 'ModelFiltersAndSorters');

        this.getView().setModel(new sap.ui.model.odata.ODataModel("/sap/secmon/loginterpretation/logDiscoveryAPI.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        }));
        this.getView().setModel(new sap.ui.model.json.JSONModel({
            filterText : ""
        }), "UI");

        var oFilterBar = this.getView().byId("filterBar");
        var oItems = oFilterBar.getAllFilterItems(true);

        var oControl = oFilterBar.determineControlByFilterItem(oItems[0]);
        if (oControl) {
            oControl.setValue("lastHour");
        }

        var oDate = new Date();
        oDate.setHours(oDate.getHours() - 1);
        this._timeFrom = oDate;
        this._timeTo = new Date();

        var oFilter = new sap.ui.model.Filter("Timestamp", sap.ui.model.FilterOperator.BT, this._timeFrom, this._timeTo);
        var oSorter = new sap.ui.model.Sorter("Timestamp", true);
        this.getView().byId("table").getBinding("items").filter([ oFilter ]);
        this.getView().byId("table").getBinding("items").sort([ oSorter ]);

        this.getView().getModel().attachRequestCompleted(this._setCount, this);

        var txt =
                oTextBundle.getText("Interpret_Timestamp") + " (" + oDateFormatterEx.dateFormatterEx(this.getComponent().getModel("applicationContext").getProperty("/UTC"), oFilter.oValue1) + " - " +
                        oDateFormatterEx.dateFormatterEx(this.getComponent().getModel("applicationContext").getProperty("/UTC"), oFilter.oValue2) + ")";
        this.getView().getModel("UI").setProperty("/filterText", txt);

        this._selectedRelativeTimeRange = "lastHour";
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
        var count = oList.getBinding("items").getLength();
        this.getView().byId("page").setTitle(this.getView().getModel("i18n").getProperty("Interpret_Trace") + " (" + count + ")");
    },

    onPressSettings : function(oEvent) {
        var oDialog = sap.ui.xmlfragment("sap.secmon.ui.loglearning.log.LogsSettingsDialog", this);
        this.getView().addDependent(oDialog);
        oDialog.open();
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
        var sText = "";

        // apply filters to binding
        var aFilters = [];

        var oTimeFilter;
        var oFilter;

        if (this._selectedRelativeTimeRange) {
            this._timeFrom = new Date();
            this._timeTo = new Date();
            switch (this._selectedRelativeTimeRange) {
            case "lastMinute":

                this._timeFrom.setMinutes(this._timeFrom.getMinutes() - 1);
                break;
            case "last2Minutes":

                this._timeFrom.setMinutes(this._timeFrom.getMinutes() - 2);
                break;
            case "last5Minutes":

                this._timeFrom.setMinutes(this._timeFrom.getMinutes() - 5);
                break;
            case "last10Minutes":

                this._timeFrom.setMinutes(this._timeFrom.getMinutes() - 10);
                break;
            case "last15Minutes":

                this._timeFrom.setMinutes(this._timeFrom.getMinutes() - 15);
                break;
            case "last20Minutes":

                this._timeFrom.setMinutes(this._timeFrom.getMinutes() - 20);
                break;
            case "last30Minutes":

                this._timeFrom.setMinutes(this._timeFrom.getMinutes() - 30);
                break;
            case "last45Minutes":

                this._timeFrom.setMinutes(this._timeFrom.getMinutes() - 45);
                break;
            case "lastHour":

                this._timeFrom.setHours(this._timeFrom.getHours() - 1);
                break;
            case "last2Hours":

                this._timeFrom.setHours(this._timeFrom.getHours() - 2);
                break;
            case "last8Hours":

                this._timeFrom.setHours(this._timeFrom.getHours() - 8);
                break;
            case "lastDay":

                this._timeFrom.setHours(this._timeFrom.getHours() - 24);
                break;
            case "lastWeek":

                this._timeFrom.setDate(this._timeFrom.getDate() - 7);
                break;
            case "lastMonth":

                this._timeFrom.setMonth(this._timeFrom.getMonth() - 1);
                break;
            case "lastYear":

                this._timeFrom.setFullYear(this._timeFrom.getFullYear() - 1);
                break;
            }
        }

        if (this._timeTo) {
            oTimeFilter = new sap.ui.model.Filter("Timestamp", sap.ui.model.FilterOperator.BT, this._timeFrom, this._timeTo);
        } else {
            oTimeFilter = new sap.ui.model.Filter("Timestamp", sap.ui.model.FilterOperator.GE, this._timeFrom);
        }

        aFilters.push(oTimeFilter);
        sText =
                sText + oTextBundle.getText("Interpret_Timestamp") + " (" +
                        oDateFormatterEx.dateFormatterEx(this.getComponent().getModel("applicationContext").getProperty("/UTC"), oTimeFilter.oValue1) + " - " +
                        oDateFormatterEx.dateFormatterEx(this.getComponent().getModel("applicationContext").getProperty("/UTC"), oTimeFilter.oValue2) + ")";

        if (oEvent.getParameters().selectionSet[1] && oEvent.getParameters().selectionSet[1].getSelectedKey() !== "") {
            oFilter = new sap.ui.model.Filter("LogLevel", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[1].getSelectedKey(), null);
            aFilters.push(oFilter);
            sText = sText + "  " + oTextBundle.getText("Interpret_Level") + " (" + oFilter.oValue1 + ")";
        }

        if (oEvent.getParameters().selectionSet[2] && oEvent.getParameters().selectionSet[2].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("LoggerName", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[2].getValue(), null);
            aFilters.push(oFilter);
            sText = sText + "  " + oTextBundle.getText("Interpret_LoggerName") + " (" + oFilter.oValue1 + ")";
        }

        if (oEvent.getParameters().selectionSet[3] && oEvent.getParameters().selectionSet[3].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("ThreadName", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[3].getValue(), null);
            aFilters.push(oFilter);
            sText = sText + "  " + oTextBundle.getText("Interpret_ThreadName") + " (" + oFilter.oValue1 + ")";
        }

        if (oEvent.getParameters().selectionSet[4] && oEvent.getParameters().selectionSet[4].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("Location", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[4].getValue(), null);
            aFilters.push(oFilter);
            sText = sText + "  " + oTextBundle.getText("Interpret_Location") + " (" + oFilter.oValue1 + ")";
        }

        if (oEvent.getParameters().selectionSet[5] && oEvent.getParameters().selectionSet[5].getValue() !== "") {
            oFilter = new sap.ui.model.Filter("Message", sap.ui.model.FilterOperator.Contains, oEvent.getParameters().selectionSet[5].getValue(), null);
            aFilters.push(oFilter);
            sText = sText + "  " + oTextBundle.getText("Interpret_MessageText") + " (" + oFilter.oValue1 + ")";
        }

        oBinding.filter(aFilters);

        this.getView().getModel("UI").setProperty("/filterText", sText);
    },

    onShowDateTimeDialog : function(oEvent) {
        this._getDialog().open();
    },

    _getDialog : function() {
    	if (!this._oDialog) {
            this._oDialog = sap.ui.xmlfragment("sap.secmon.ui.loglearning.log.timerangeFilterDialog", this);
            this.getView().addDependent(this._oDialog);

            var oModelFilterAndSorterData = this.getView().getModel("ModelFiltersAndSorters").getData();

            var oTimeFrom = new Date();
            this._getDialog().getContent()[0].setModel(new sap.ui.model.json.JSONModel({
                "isRelative" : true,
                "selectedRelativeTimeRange" : oModelFilterAndSorterData.TimerangeRelative,
                "selectedAbsoluteDateFrom" : new Date(),
                "selectedAbsoluteTimeFrom" : "00:00:00",
                "selectedAbsoluteDateTo" : new Date(),
                "selectedAbsoluteTimeTo" : "23:59:59",
                "timeFrom" : oTimeFrom,
                "timeTo" : null
            }));
        }
        return this._oDialog;
    },

    onCloseTimeRangeFilterDialog : function(oEvent) {
        var oData = this._getDialog().getContent()[0].getModel().getData();
        var bUtc = this.getComponent().getModel("applicationContext").getProperty("/UTC");

        this._timeFrom = oData.timeFrom;
        this._timeTo = oData.timeTo;

        if (oData.isRelative) {
            this.getView().byId("dateTimeFilterInput").setValue(oData.selectedRelativeTimeRange);
            this.getView().byId("dateTimeFilterInput").setTooltip(oData.selectedRelativeTimeRange);
            this._selectedRelativeTimeRange = oData.selectedRelativeTimeRange;
        } else {
            delete this._selectedRelativeTimeRange;
            if (this._timeTo) {
                var nCurrentTimezone = bUtc ? this._timeTo.getTimezoneOffset() * 60000 : 0;
                this._timeFrom = new Date(this._timeFrom.getTime() - nCurrentTimezone);
                this._timeTo = new Date(this._timeTo.getTime() - nCurrentTimezone);

                this.getView().byId("dateTimeFilterInput").setValue(oDateFormatterEx.dateFormatterEx(bUtc, this._timeFrom) + " - " + oDateFormatterEx.dateFormatterEx(bUtc, this._timeTo));
                this.getView().byId("dateTimeFilterInput").setTooltip(oDateFormatterEx.dateFormatterEx(bUtc, this._timeFrom) + " - " + oDateFormatterEx.dateFormatterEx(bUtc, this._timeTo));
            } else {
                this.getView().byId("dateTimeFilterInput").setValue(oData.selectedRelativeTimeRange);
                this.getView().byId("dateTimeFilterInput").setTooltip(oData.selectedRelativeTimeRange);
            }
        }
        this._getDialog().close();
    }
});