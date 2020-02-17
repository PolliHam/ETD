jQuery.sap.require("sap.secmon.ui.m.invest.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.commons.FilterSortUtil");
sap.ui.core.mvc.Controller.extend("sap.secmon.ui.m.invest.view.Master", {

    DEFAULT_ORDER_BY : "number",
    DEFAULT_ORDER_DESC : true,

    constructor : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.filterAlreadySet = null;
        /**
         * The selection filters that are set externally via component parameters
         */
        this.aPresetFilters = [];
        /** The parameters passed as URL parameters or component parameters */
        this.oPresetParams = {};

        this.sSessionUser = [];

        // IMPORTANT: all programmatic selection has to change this member!
        this.lastSelectedItem = null;
        sap.ui.core.mvc.Controller.apply(this, arguments);
    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.m.invest.view.Master
     */
    onInit : function() {
        this.oUpdateStartedDeferred = jQuery.Deferred();
        this.getView().byId("list").attachEventOnce("updateStarted", function() {
            this.oUpdateStartedDeferred.resolve();
        }, this);

        this.oUpdateFinishedDeferred = jQuery.Deferred();
        this.getView().byId("list").attachEventOnce("updateFinished", function() {
            this.oUpdateFinishedDeferred.resolve();
        }, this);

        this.filterAlreadySet = false;
        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);

        this.queryExtractor = new sap.secmon.ui.m.commons.QueryExtractor(sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE, this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC);
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    setSelectedItem : function(oItem) {
        var oList = this.getView().byId("list");
        oList.setSelectedItem(oItem, true);
        this.lastSelectedItem = oItem;
    },

    /**
     * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered (NOT before the first rendering! onInit() is used for that one!).
     * 
     * @memberOf sap.secmon.ui.m.invest.view.Master
     */
    // onBeforeRendering: function() {
    //
    // },
    /**
     * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here. This hook is the same one that SAPUI5 controls get
     * after being rendered.
     * 
     * @memberOf sap.secmon.ui.m.invest.view.Master
     */
    // onAfterRendering: function() {
    //
    // },
    /**
     * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
     * 
     * @memberOf sap.secmon.ui.m.invest.view.Master
     */
    // onExit: function() {
    //
    // }
    onRouteMatched : function(oEvent) {
        var sName = oEvent.getParameter("name");
        var oArguments = oEvent.getParameter("arguments");
        if (oArguments === null || oArguments === undefined) {
            return;
        }
        var oList = this.getView().byId("list");
        // Wait for the list to be loaded once
        jQuery.when(this.oUpdateFinishedDeferred).then(jQuery.proxy(function() {
            var aItems;

            // On the empty hash select the first item
            if (!sap.ui.Device.system.phone && sName === "main") {
                if (!oArguments.investigation) {
                    // no sub route with investigation present => show details
                    // for first investigation
                    this.selectDetail();
                }
            }

            // Try to select the item in the list
            if (sName === "investigation") {

                aItems = oList.getItems();
                for (var i = 0; i < aItems.length; i++) {
                    if (aItems[i].getBindingContext().getPath() === "/" + oArguments.investigation) {
                        this.setSelectedItem(aItems[i]);
                        break;
                    }
                }
            }

        }, this));

        // filter according to parameters
        if (sName === "main") {
            var oQueryParameters = oArguments["?query"];
            this.aPresetFilters.length = 0;
            var oSorter;
            if (oQueryParameters !== undefined && oQueryParameters !== null && oQueryParameters !== "") {
                this.oPresetParams = oQueryParameters;

                this.aPresetFilters = this.queryExtractor.extractFilters(this.oPresetParams);
                oSorter = this.queryExtractor.extractSorter(this.oPresetParams);
            }

            // The binding is still undefined in event "routeMatched", the view
            // is
            // not fully initialized yet.
            jQuery.when(this.oUpdateStartedDeferred).then(jQuery.proxy(function() {
                if (this.aPresetFilters.length > 0 && this.filterAlreadySet !== true) {
                    this.filterAlreadySet = true;
                    sap.secmon.ui.commons.FilterSortUtil.applyFiltersAndSorterToTable(oList, this.aPresetFilters, oSorter);
                }
            }, this));
        }
    },

    /**
     * Show the detail page from beginning, if an item was already selected. This is not the selection event! See onSelect for that.
     */
    selectDetail : function() {
        if (!sap.ui.Device.system.phone) {
            var oList = this.getView().byId("list");
            var aItems = oList.getItems();
            if (aItems.length && !oList.getSelectedItem()) {
                this.setSelectedItem(aItems[0]);
                this.showDetail(aItems[0]);
            }
        }
    },

    onSearch : function() {
        // clone default filter
        var filters = this.aPresetFilters.slice(0);
        var searchString = this.getView().byId("searchField").getValue();
        if (searchString && searchString.length > 0) {
            // Strange: As soon as tolower is used in the filter, the
            // searchstring
            // itself must be enclosed in hyphens:
            searchString = "'" + searchString.toLowerCase() + "'";
            filters.push(new sap.ui.model.Filter('tolower(Description)', sap.ui.model.FilterOperator.Contains, searchString));
        }

        // update list binding
        this.getView().byId("list").getBinding("items").filter(filters);
    },

    /** The select event registered in the view */
    onSelect : function(oEvent) {
        var oList = this.getView().byId("list");
        var oLastItem = this.lastSelectedItem;
        this.lastSelectedItem = oList.getSelectedItem();
        var that = this;

        // Get the list item, either from the listItem parameter or from the
        // event's
        // source itself (will depend on the device-dependent mode).
        var oSource = oEvent.getSource();
        var oItem = oEvent.getParameter("listItem");

        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            // if the investigations list is empty there is no detail
            if (oItem || oSource) {
                that.showDetail(oItem || oSource);
            } else {
                // If we're on a phone, include nav in history; if not, don't.
                var bReplace = sap.ui.Device.system.phone ? false : true;
                sap.ui.core.UIComponent.getRouterFor(that).navTo("empty", {
                    // from : "master",
                    query : that.oPresetParams
                }, bReplace);
            }
        }).fail(function() {
            if (oLastItem) {
                that.setSelectedItem(oLastItem);
            }
        });
    },

    showDetail : function(oItem) {
        // If we're on a phone, include nav in history; if not, don't.
        var bReplace = sap.ui.Device.system.phone ? false : true;
        // var sAlertId = oItem.getBindingContext().getProperty("AlertId");
        // sAlertId = this.oCommons.base64ToHex(sAlertId);
        // var alertId = oItem.getBindingContext().getPath().substr(1);
        sap.ui.core.UIComponent.getRouterFor(this).navTo("investigation", {
            // from : "master",
            investigation : oItem.getBindingContext().getPath().substr(1),
            tab : "discussion",
            query : this.oPresetParams
        }, bReplace);
    },

    onBackButtonPressed : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            window.history.go(-1);
        });
    },

});
