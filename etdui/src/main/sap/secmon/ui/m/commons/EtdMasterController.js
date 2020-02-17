/**
 * This Controller aims to include common functions used by Controllers in Master/Detail applications. Please note that it requires a sap.secmon.ui.m.commons.EtdComponent.
 */
jQuery.sap.declare("sap.secmon.ui.m.commons.EtdMasterController");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.FilterSortUtil");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.commons.EtdMasterController", {

    /**
     * JavaScript constructor used for field initialization to prevent caching.
     */
    constructor : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
    },

    /**
     * Initializes the Master Controller. This function has to be called by controllers extending the EtdMasterController with the following configuration object: <br>
     * <code>
     * {
     *  {String} entityName: "The name of the entity as it appears in routing etc."
     *  {String} listControlId : "The Id of the sap.m.List as declared in the view."
     *  {String} searchProperty : "The Property of the entity considered by search control."
     *  {function} routeEnhancer (optional): "Called with the route object when navigation to detail view occurs"
     * }
     * </code>
     * 
     * @throws Error():
     *             Thrown if the configuration object or its mandatory properties are missing.
     */
    init : function(config) {

        if (!(this.getComponent() instanceof sap.secmon.ui.m.commons.EtdComponent)) {
            throw new Error("This controller requires an EtdComponent");
        }

        if (config === null || config === undefined) {
            throw new Error("Invalid or missing configuration object");
        }

        if (typeof config.entityName !== "string") {
            throw new Error("Invalid or missing configuration property 'entityName'");
        }

        if (typeof config.listControlId !== "string") {
            throw new Error("Invalid or missing configuration property 'listControlId'");
        }

        if (typeof config.searchProperty !== "string") {
            throw new Error("Invalid or missing configuration property 'searchProperty'");
        }

        this.entityName = config.entityName;
        this.listControlId = config.listControlId;
        this.searchProperty = config.searchProperty;
        this.routeEnhancer = config.routeEnhancer;

        this.aPresetFilters = [];
        this.getRouter().attachRouteMatched(this.onRouteMatched, this);
        this.initListEvents();
    },

    /**
     * Attaches one time event listeners to the list in order to be notified once the sap.m.List starts loading and has finished loading the entities.
     */
    initListEvents : function() {
        this.oUpdateStartedDeferred = jQuery.Deferred();
        this.getList().attachEventOnce("updateStarted", function() {
            this.oUpdateStartedDeferred.resolve();
        }, this);

        this.oUpdateFinishedDeferred = jQuery.Deferred();
        this.getList().attachEventOnce("updateFinished", function() {
            this.oUpdateFinishedDeferred.resolve();
        }, this);

        // Publish event in case of finished list updates
        var eventBus = sap.ui.getCore().getEventBus();
        this.getList().attachEvent("updateFinished", function() {
            eventBus.publish("EtdMasterController", "ListUpdateFinished");
        }, this);

    },

    /**
     * Returns the sap.m.List Control of the Master View.
     */
    getList : function() {
        return this.getView().byId(this.listControlId);
    },

    onRouteMatched : function(oEvent) {
        var sName = oEvent.getParameter("name");
        var oArguments = oEvent.getParameter("arguments");
        if (oArguments === null || oArguments === undefined) {
            return;
        }
        var oList = this.getList();
        // Wait for the list to be loaded once
        jQuery.when(this.oUpdateFinishedDeferred).then(jQuery.proxy(function() {
            var aItems;

            // On the empty hash select the first item
            if (!sap.ui.Device.system.phone && sName === "main") {
                if (!oArguments[this.entityName]) {
                    // no sub route with entity present => show details
                    // for first entity
                    this.selectFirstListItem();
                }
            }

            // Try to select the item in the list
            if (sName === this.entityName) {

                aItems = oList.getItems();
                for (var i = 0; i < aItems.length; i++) {
                    if (aItems[i].getBindingContext().getPath() === "/" + oArguments[this.entityName]) {
                        this.setSelectedItem(aItems[i]);
                        break;
                    }
                }
            }

        }, this));
    },

    /**
     * Show the detail page from beginning, if an item was already selected. This is not the selection event! See onSelect for that.
     */
    selectFirstListItem : function() {
        if (!sap.ui.Device.system.phone) {
            var oList = this.getList();
            var aItems = oList.getItems();
            if (aItems.length) {// && !oList.getSelectedItem()) {
                this.setSelectedItem(aItems[0]);
                this.showDetail(aItems[0]);
            }
        }
    },

    /**
     * Sets the given listItem as selected in the sap.m.List of the View.
     */
    setSelectedItem : function(listItem) {
        var oList = this.getList();
        oList.setSelectedItem(listItem, true);
        this.lastSelectedItem = listItem;
    },

    /**
     * Shows the given listItem in the Detail view by triggering a navigation to the Detail View and passing the BindingContext Path.
     */
    showDetail : function(oItem) {
        // If we're on a phone, include nav in history; if not, don't.
        var bReplace = sap.ui.Device.system.phone ? false : true;

        var navigationParameter = {
        // from : "master",
        // tab : "alerts",
        // query : this.oPresetParams
        };
        navigationParameter[this.entityName] = oItem.getBindingContext().getPath().substr(1);
        if (this.routeEnhancer) {
            this.routeEnhancer(navigationParameter);
        }

        this.getRouter().navTo(this.entityName, navigationParameter, bReplace);
    },

    /** The select event of the sap.m.List|ListItem as registered in the view */
    onSelect : function(oEvent) {
        var oList = this.getList();
        var oLastItem = this.lastSelectedItem;
        this.lastSelectedItem = oList.getSelectedItem();
        var controller = this;

        // Get the list item, either from the listItem parameter or from the
        // event's source itself (will depend on the device-dependent mode).
        var oSource = oEvent.getSource();
        var oItem = oEvent.getParameter("listItem");

        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            // if the list is empty there is no detail
            if (oItem || oSource) {
                controller.showDetail(oItem || oSource);
            } else {
                // If we're on a phone, include nav in history; if not, don't.
                var bReplace = sap.ui.Device.system.phone ? false : true;
                controller.getRouter().navTo("empty", {
                    // from : "master",
                    query : controller.oPresetParams
                }, bReplace);
            }
        }).fail(function() {
            if (oLastItem) {
                controller.setSelectedItem(oLastItem);
            }
        });
    },

    /**
     * Filters the sap.m.List according to the entered filter string with respect to the configured searchProperty of the entity.
     */
    onSearch : function() {
        // clone default filter
        var filters = this.aPresetFilters.slice(0);
        var searchString = this.getView().byId("searchField").getValue();
        if (typeof searchString === "string" && searchString.length > 0) {
            /*
             * As soon as 'tolower' is used in the filter, the searchstring itself must be enclosed in hyphens:
             */
            searchString = "'" + searchString.toLowerCase() + "'";
            filters.push(new sap.ui.model.Filter("tolower(" + this.searchProperty + ")", sap.ui.model.FilterOperator.Contains, searchString));
        }

        // update list binding
        this.getList().getBinding("items").filter(filters);
    },

    /**
     * If no Veto exists, this handler navigates one step back.
     */
    onBackButtonPressed : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            window.history.back();
        });
    }

});