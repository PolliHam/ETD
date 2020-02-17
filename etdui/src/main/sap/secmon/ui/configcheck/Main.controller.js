$.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.configcheck.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.BookmarkCreator");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.ColumnClickableTable");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.configcheck.Main", {

    oRouter : null,
    DEFAULT_ORDER_BY : "mainSystemId",
    DEFAULT_ORDER_DESC : false,
    FILTERVALUES_SERVICE : "/sap/secmon/services/configcheck/FilterValues.xsjs",

    onInit : function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
        this.initModels();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.getComponent().getModel().attachRequestCompleted(this._setCount, this);

        var fnNavigation = function() {
            this.navToWithAggregatedParameters("main");
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "table", sap.secmon.ui.m.commons.ServiceConstants.CONFIGURATIONCHECK_SERVICE, fnNavigation, [ "mainSystemIdFilterInput",
                "systemIdFilterInput", "roleFilterInput", "dataSourceFilterInput" ], [ this.getComponent().getModel(), this.getView().getModel("FilterValues") ]);
        this.oBookmarkCreator = new sap.secmon.ui.m.commons.BookmarkCreator();
    },

    initModels : function() {
        this.getView().setModel(new sap.ui.model.json.JSONModel(), 'FilterValues');
        this.getFilterValues();
        this.getView().setModel(new sap.ui.model.json.JSONModel({
            itemSelected : false,
            filterText : ""
        }), "UI");
    },

    getFilterValues : function() {
        var that = this;
        $.ajax({
            type : "GET",
            url : this.FILTERVALUES_SERVICE,
            async : true,
            contentType : "application/json; charset=UTF-8",
            error : function(XMLHttpRequest, textStatus, errorThrown) {
                sap.ui.core.BusyIndicator.hide();
                sap.m.MessageBox.alert(that.oCommons.constructAjaxErrorMsg(XMLHttpRequest, textStatus, errorThrown), {
                    title : that.getView().getModel("i18nCommon").getProperty("Error_TIT")
                });

            },
            success : function(oData) {
                that.getView().getModel("FilterValues").setData(oData);
            },
        });
    },

    handleRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "main") {
            return;
        }
        var oArguments = oEvent.getParameter("arguments");
        var params = oArguments["?query"];
        var oQueryObject = {};
        if (params) {
            oQueryObject = params;
        }
        this.oQueryParams = oQueryObject;

        var queryExtractor = new sap.secmon.ui.m.commons.QueryExtractor(sap.secmon.ui.m.commons.ServiceConstants.CONFIGURATIONCHECK_SERVICE, this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC);
        var oSorter = queryExtractor.extractSorter(oQueryObject);
        var aFilters = queryExtractor.extractFilters(oQueryObject);

        sap.secmon.ui.m.commons.FilterBarHelper.applySorting.call(this, oSorter.sPath, oSorter.bDescending);
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersToFilterBar.call(this, aFilters);

        sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, aFilters);

        // apply the filter and sorter
        sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersAndSorter.call(this, {
            filters : aFilters,
            sorter : oSorter
        });
    },

    navToWithAggregatedParameters : function(sRouteName) {
        var oNewQueryParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oNewQueryParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oNewQueryParameters);

        // The router has a "feature" not to dispatch to event handlers if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new value each
        // time.
        oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

        sap.ui.core.UIComponent.getRouterFor(this).navTo("main", {
            query : oNewQueryParameters
        }, true);
    },

    setRouteName : function(sRouteName) {
        this.routeName = sRouteName;
    },

    getRouteName : function() {
        return this.routeName;
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
        var oList = this.getConfigCheckTable();
        var count = oList.getBinding("items").getLength();
        this.getView().byId("page").setTitle(this.getView().getModel("i18n").getProperty("CfgCheck_Header") + " (" + count + ")");
    },

    getConfigCheckTable : function() {
        this.oConfigCheckTable = this.oConfigCheckTable || this.getView().byId("table");
        return this.oConfigCheckTable;
    },

    onItemPress : function(oEvent) {
        sap.ui.core.UIComponent.getRouterFor(this).navTo("Detail", {
            "SystemId" : encodeURIComponent(oEvent.getParameter("listItem").getBindingContext().getProperty("SystemId")),
            "DataSource" : encodeURIComponent(oEvent.getParameter("listItem").getBindingContext().getProperty("DataSource"))
        });
    },

    handleBookmarkDialogButtonPressed : function(oEvent) {
        var oParameters = {};
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromTableSorting.call(this, oParameters);
        sap.secmon.ui.m.commons.FilterBarHelper.extendQueryParameterFromFilterBar.call(this, oParameters);
        oParameters.doNotEncode = true;

        var sTitle = this.getText("CfgCheck_Header");
        this.oBookmarkCreator.showBookmarkCreationDialog(this.getView(), sTitle, oParameters, "ConfigurationCheck");
    },

});