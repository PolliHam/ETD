jQuery.sap.require("sap.secmon.ui.m.commons.EtdMasterController");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.secmon.ui.m.valuelist.util.Formatter");

sap.secmon.ui.m.commons.EtdMasterController.extend("sap.secmon.ui.m.valuelist.view.Master", {

    entityName : "ValuelistDetail",

    oCommons : null,
    oUtils : null,

    oRouter : null,

    sSessionUser : "",

    onInit : function() {

        this.oQueryParameters = {};
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.onRouteMatched, this);

        this.selectedValuelist = null;

        if (!sap.ui.Device.system.phone) {
            this.initialLoad = true;
            // Select one valuelist initially
            var oList = this.getView().byId("list");
            oList.attachEventOnce("updateFinished", function() {
                this.initialValueSelection();
            }, this);
        }
    },

    onRouteMatched : function(oEvent) {
        var sName = oEvent.getParameter("name");
        var oArguments = oEvent.getParameter("arguments");
        if (oArguments === null || oArguments === undefined) {
            return;
        }
        var oValuelistTable, oTemplate;
        var query = oArguments["?query"];
        var entityPath = oArguments[this.entityName];

        // On the empty hash select the first item
        if (sName === "main") {

            oValuelistTable = this.getView().byId("list");
            // bind valuelist table to model
            oTemplate = oValuelistTable.removeItem(0);
            if (oTemplate !== null) {
                // For server-side sorting use the ODATA function toupper.
                var oSorter = new sap.ui.model.Sorter("toupper(ListName)", false);
                oValuelistTable.bindAggregation("items", '/Header', oTemplate, oSorter);
            }

            if (!entityPath) {
                // no sub route with investigation present => show details
                // for first investigation
                this.selectedValuelist = null;
                if (!sap.ui.Device.system.phone) {
                    this.initialLoad = true;
                    // event (once) attached because list has to be updated
                    // first
                    // after deletion or adding a new valuelist
                    oValuelistTable.attachEventOnce("updateFinished", function() {
                        this.initialValueSelection();
                    }, this);
                }
            } else {
                this.selectedValuelist = entityPath.slice(entityPath.indexOf("(X'") + 3, entityPath.indexOf("')"));
                if (!sap.ui.Device.system.phone) {
                    this.initialLoad = false;
                }
                // event (once) attached because list has to be updated first
                // after deletion or adding a new valuelist
                oValuelistTable.attachEventOnce("updateFinished", function() {
                    this.selectDetail(this.selectedValuelist);
                    this.navigateToDetail(this.selectedValuelist, query.mode);
                }, this);
            }

        } else if (sName === "valuelist") { // navigation from subroute
            var valuelist;
            if (entityPath) {
                valuelist = entityPath.slice(entityPath.indexOf("(X'") + 3, entityPath.indexOf("')"));
            } else {
                return;
            }

            // navigation by browser URL-binding already exists if navigation
            // from subroute
            if (valuelist !== this.selectedValuelist) {
                oValuelistTable = this.getView().byId("list");
                this.selectDetail(valuelist);
                // bind valuelist table to model (but only once)
                if (!this.selectedValuelist) {
                    oTemplate = oValuelistTable.removeItem(0);
                    if (oTemplate !== null) {
                        oValuelistTable.bindAggregation("items", '/Header', oTemplate, new sap.ui.model.Sorter("toupper(ListName)", false));
                    }
                }
                this.selectedValuelist = valuelist;

            }
        }
    },

    /**
     * Determines first items in list and enforces selection. Not used on the phone.
     */
    initialValueSelection : function() {
        var oList = this.getView().byId("list");
        // select an alert on initial load
        var valuelistItems = oList.getItems();
        var firstItem = valuelistItems[0];

        if (firstItem && this.initialLoad === true) {
            this.initialLoad = false;// required to avoid endless loop
            var sValuelistId;
            if (this.selectedValuelist) {
                sValuelistId = this.selectedValuelist;
            } else {
                sValuelistId = firstItem.getBindingContextPath();
                sValuelistId = this.getIdFromBindingContextPath(sValuelistId);
                this.selectedValuelist = sValuelistId;
            }
            this.selectDetail(this.selectedValuelist);
            this.navigateToDetail(this.selectedValuelist);

        }
    },

    /**
     * Set the selection to specified item.
     */
    selectDetail : function(valuelistId) {
        if (!sap.ui.Device.system.phone) {
            var oList = this.getView().byId("list");
            var aItems;
            aItems = oList.getItems();
            for (var i = 0; i < aItems.length; i++) {
                if (aItems[i].getBindingContextPath() === "/Header(X'" + valuelistId + "')") {
                    this.lastSelectedItem = aItems[i];
                    oList.setSelectedItem(aItems[i]);
                    break;
                }

            }
        }
    },

    /** The select event registered in the view */
    onSelect : function(oEvent) {
        var oList = this.getView().byId("list");
        var oLastItem = this.lastSelectedItem;
        var that = this;
        var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        // Get the list item
        var oSource = oEvent.getSource();
        var bindingContextPath;
        var item = oEvent.getParameter("listItem");
        // desktop and tablet
        if (item) {
            bindingContextPath = oEvent.getParameter("listItem").getBindingContextPath();
        }
        // phone
        else {
            bindingContextPath = oSource.getBindingContextPath();
        }

        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            // if the investigations list is empty there is no detail
            if (bindingContextPath) {
                that.navigateToDetail(that.getIdFromBindingContextPath(bindingContextPath));
            } else {
                // If we're on a phone, include nav in history; if not, don't.
                var bReplace = sap.ui.Device.system.phone ? false : true;
                oRouter.navTo("empty", {
                    // from : "master",
                    query : this.aPresetParams + "&mode=display"
                }, bReplace);
            }
            that.lastSelectedItem = oList.getSelectedItem();
        }).fail(function() {
            if (oLastItem) {
                that.getView().byId("list").setSelectedItem(oLastItem);
            }
        });
    },

    /**
     * Eventhandler: Navigates to detail view for creation of new valuelist.
     */
    onNew : function(oEvent) {
        // Namespace Check
        if (!this.getComponent().checkNamespacesExist()) {
            return;
        }
        // If we're on a phone, include nav in history; if not, don't.
        var bReplace = sap.ui.Device.system.phone ? false : true;
        this.oRouter.navTo("createValuelist", {}, bReplace);
    },

    /**
     * Navigates to Detail view with selected item and mode (edit)
     */
    navigateToDetail : function(valuelistId, mode) {

        var query = "";
        if (mode !== undefined) {
            query = "?mode=" + mode;
        }
        this.navToValueList(valuelistId, query);
    },

    navToValueList : function(valuelistId, sQuery) {
        // If we're on a phone, include nav in history; if not, don't.
        var bReplace = sap.ui.Device.system.phone ? false : true;
        this.oRouter.navTo("valuelist", {
            ValuelistDetail : "Header(X'" + valuelistId + "')",
            query : sQuery
        }, bReplace);
    },

    /**
     * Eventhandler: Search for special lists (listName)
     */
    onSearch : function() {
        // clone default filter
        var filters = [];
        var searchString = this.getView().byId("searchField").getValue();
        if (searchString && searchString.length > 0) {
            // Strange: As soon as tolower is used in the filter, the
            // searchstring
            // itself must be enclosed in hyphens:
            searchString = "'" + searchString.toLowerCase() + "'";
            filters.push(new sap.ui.model.Filter('tolower(ListName)', sap.ui.model.FilterOperator.Contains, searchString));
        }

        // update list binding
        this.getView().byId("list").getBinding("items").filter(filters);
    },
    /**
     * Eventhandler for back button
     */
    onBackButtonPressed : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            window.history.go(-1);
        });
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    /**
     * Gets id form bindingcontext path. E.g. if specified bindingcontext is /Header(X'546331166C1F5A9BE15800000A4CF109') it will return 546331166C1F5A9BE15800000A4CF109
     */
    getIdFromBindingContextPath : function(bindingcontextPath) {
        var i = bindingcontextPath.indexOf("(X'");
        return bindingcontextPath.substr(i + 3, 32);
    },

/**
 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered (NOT before the first rendering! onInit() is used for that one!).
 * 
 * @memberOf sap.secmon.ui.m.valuelist.view.Master
 */
// onBeforeRendering: function() {
//
// },
/**
 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here. This hook is the same one that SAPUI5 controls get after
 * being rendered.
 * 
 * @memberOf sap.secmon.ui.m.valuelist.view.Master
 */
// onAfterRendering: function() {
//
// },
/**
 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
 * 
 * @memberOf sap.secmon.ui.m.valuelist.view.Master
 */
// onExit: function() {
//
// }
});
