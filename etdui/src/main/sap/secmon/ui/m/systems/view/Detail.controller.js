jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationUtils");
jQuery.sap.require("sap.secmon.ui.m.systems.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.systems.view.Detail", {

    entityName : "system",

    onInit : function() {

        var view = this.getView();

        this.getComponent().oDetailController = this;

        this.getRouter().attachRouteMatched(function(oEvent) {
            // when detail navigation occurs, update the binding context
            if (oEvent.getParameter("name") === this.entityName) {

                var oArguments = oEvent.getParameter("arguments");

                var entityName = oArguments[this.entityName];

                // decodeURI() ignores %2F, do it manually
                // ABAP systems can include client part , e.g. YI3/200
                var entityPath = "/" + entityName.replace("%2F", "/");

                var params = oArguments["?query"] || {};
                if (params.hasOwnProperty("fullscreen") && params.fullscreen === "true") {
                    this.adaptBackButtonToFullscreenMode();
                }

                // reset previous binding context
                view.unbindElement();

                view.bindElement(entityPath);

                // Make sure the master is here
                var oIconTabBar = view.byId("idIconTabBar");

                // Which tab? (Default is 'General')
                var sTabKey = oEvent.getParameter("arguments").tab || "general";
                if (oIconTabBar.getSelectedKey() !== sTabKey) {
                    oIconTabBar.setSelectedKey(sTabKey);
                }

                var fnShowTabDetails;

                if (sTabKey === "eventTrend") {
                    // inject Event Trend Analysis with current selected
                    // systemId
                    fnShowTabDetails = function() {
                        var systemId = view.getBindingContext().getProperty("Id");
                        var eventTrendView = view.byId("eventTrendView");
                        eventTrendView.getController().setSystem(systemId);
                    };
                } else if (sTabKey === "connectedSystems") {
                    // inject current selected systemId
                    fnShowTabDetails = function() {
                        var systemId = view.getBindingContext().getProperty("Id");
                        var connectedSystemsView = view.byId("connectedSystemsView");
                        connectedSystemsView.getController().setSystem(systemId);

                    };
                }
                if (fnShowTabDetails) {
                    if (view.getBindingContext()) {
                        // data already available
                        fnShowTabDetails();
                    } else {
                        view.getElementBinding().attachChange(function() {
                            fnShowTabDetails();
                        }, this);
                    }
                }
            }
        }, this);
    },

    getSelectedTab : function() {
        return this.byId("idIconTabBar").getSelectedKey();
    },

    adaptBackButtonToFullscreenMode : function() {
        // full screen mode: back button is always shown and back performs a
        // browser back
        var controller = this;
        var oPage = this.getView().byId("systemDetailsContainer");
        oPage.setShowNavButton(true);
        oPage.detachNavButtonPress(this.onNavBack, this);

        oPage.attachNavButtonPress(function() {
            controller.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
                window.history.go(-1);
            });
        });
    },

    onTabSelected : function(event) {
        this.getRouter().navTo("system", {
            system : event.getSource().getBindingContext().getPath().slice(1),
            tab : event.getParameter("selectedKey")
        }, true);
    },

    /**
     * Back navigation when running on phone devices.
     */
    onNavBack : function() {
        var oRouter = this.getRouter();
        this.getComponent().getNavigationVetoCollector().noVetoExists().then(function() {
            sap.secmon.ui.m.commons.NavigationUtils.myNavBack(oRouter, "main");
        });
    }

});
