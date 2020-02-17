jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.settings.view.Master", {

    constructor : function() {

        // IMPORTANT: all programmatic selection has to change this member!
        this.lastSelectedItem = null;
        sap.ui.core.mvc.Controller.apply(this, arguments);
    },

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     */
    onInit : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        sap.ui.core.UIComponent.getRouterFor(this).attachRoutePatternMatched(this.onRouteMatched, this);
        this.enableContentSync();
    },

    enableContentSync : function() {
        var bShowContentSync = jQuery.sap.getUriParameters().get("sap-etd-sync-content") === "true";
        this.getView().byId("contentSyncItem").setVisible(bShowContentSync);
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    /**
     * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered (NOT before the first rendering! onInit() is used for that one!).
     * 
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
    // },
    /**
     * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
     * 
     */
    // onExit: function() {
    //
    // }
    onRouteMatched : function(oEvent) {
        var sName = oEvent.getParameter("name");
        this.setRouteName(sName);

        if (!sap.ui.Device.system.phone) {
            if (sName === "main") {
                this.selectFirstListItem();
            } else {
                this.selectListItemByRouteName(sName);
            }
        }

    },

    retrieveRouteName : function(oListItem) {
        var aCustomData = oListItem.getCustomData();
        var i;
        for (i = 0; i < aCustomData.length; i++) {
            if (aCustomData[i].getKey() === "route") {
                return aCustomData[i].getValue();
            }
        }
        return this.getRouteName();
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
        var oSource = oEvent.getParameter("listItem") || oEvent.getSource();

        var routeName = this.retrieveRouteName(oSource);
        this.setRouteName(routeName);

        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            that.showDetail(routeName, {});
        }).fail(function() {
            if (oLastItem) {
                that.setSelectedItem(oLastItem);
            }
        });

    },

    selectFirstListItem : function() {
        var oList = this.getView().byId("list");
        var aItems = oList.getItems();
        this.setSelectedItem(aItems[0]);
        if (!(sap.ui.Device.system.phone && sap.ui.orientation.portrait)) {
            var routeName = this.retrieveRouteName(aItems[0]);
            this.showDetail(routeName, {});
        }
    },

    selectListItemByRouteName : function(sRouteName) {
        var oList = this.getView().byId("list");
        var aItems = oList.getItems();
        var that = this;
        aItems.forEach(function(oListItem) {
            var aCustomData = oListItem.getCustomData();
            var i;
            for (i = 0; i < aCustomData.length; i++) {
                if (aCustomData[i].getKey() === "route" && aCustomData[i].getValue() === sRouteName) {
                    that.setSelectedItem(oListItem);
                    that.showDetail(sRouteName, {});
                }
            }
        });
    },

    showDetail : function(routeName, oParams) {
        // If we're on a phone, include nav in history; if not, don't.
        var bReplace = sap.ui.Device.system.phone ? false : true;
        sap.ui.core.UIComponent.getRouterFor(this).navTo(routeName, oParams, bReplace);
    },

    setSelectedItem : function(oItem) {
        var oList = this.getView().byId("list");
        oList.setSelectedItem(oItem, true);
        this.lastSelectedItem = oItem;
    },

    onBackButtonPressed : function() {

        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            window.history.go(-1);
        });
    },

    setRouteName : function(sRouteName) {
        this.routeName = sRouteName;
    },

    getRouteName : function() {
        return this.routeName;
    }

});
