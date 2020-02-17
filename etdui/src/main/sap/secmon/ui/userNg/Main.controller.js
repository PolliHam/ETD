sap.ui.define([ "sap/secmon/ui/m/commons/EtdController", "sap/ui/model/json/JSONModel", "sap/ui/core/UIComponent" ], function(EtdController, JSONModel, UIComponent) {
    "use strict";

    // TODO: Maybe move this outside? Is there a good playe for this?
    var sHelpUrl = "/sap/secmon/help/504af8783de345f9ae5a0ebdf2768618.html";

    var MainController = EtdController.extend("sap.secmon.ui.userNg.Main", {

        // ////////////////////////////// General Section ///////////////////////////////

        onInit : function() {
            this._oViewModel = new JSONModel({
                "bUserDetailsAvailable" : false,
                "bUserSystemDataAvailable" : false,
                "sSelectedTabKey" : "resolve",
                "sHelpUrl" : sHelpUrl
            });
            this.getView().setModel(this._oViewModel, "viewModel");
            this.getRouter().getRoute("main").attachMatched(this._onRouteMatched.bind(this));

            this.getView().byId("userng-resolve").attachEvent("countChange", this._onLogCountChange.bind(this, "userNg-tabfilter-resolve"));
            this.getView().byId("userng-resolvereverse").attachEvent("countChange", this._onLogCountChange.bind(this, "userNg-tabfilter-resolvereverse"));
            this.getView().byId("userng-log").attachEvent("countChange", this._onLogCountChange.bind(this, "userNg-tabfilter-log"));

            var applicationContext = this.getComponent().getModel("applicationContext").getData();
            if (applicationContext && applicationContext.userPrivileges.resolveUser === false && applicationContext.userPrivileges.reverseResolveUser === true) {
                this._navigateToTab("reverse");
            }
        },

        onTabSelected : function(oEvent) {
            this._navigateToTab(oEvent.getParameter("selectedKey"));
        },

        getRouter : function() {
            return UIComponent.getRouterFor(this);
        },

        onHelpPress : function(oEvent) {
            // this._navigateToTab("help");
            window.open(sHelpUrl, "_blank");
        },

        onBackButtonPressed : function() {
            this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
                window.history.go(-1);
            });
        },

        // ///////////////////////////// Private Functions //////////////////////////////

        _onLogCountChange : function(sTabFilterId, oEvent) {
            this.getView().byId(sTabFilterId).setCount(oEvent.getParameter("count"));

            if (sTabFilterId !== "userNg-tabfilter-log") {
                // Something changed that affects the log
                this.getView().byId("userng-log").byId("userNg-log-table").getBinding("items").refresh();
            }
        },

        _onRouteMatched : function(oEvent) {
            var oQuery = oEvent.getParameter("arguments")["?query"];
            if (oQuery) {
                this._oViewModel.setProperty("/sSelectedTabKey", oQuery.tab);
            }
        },

        _navigateToTab : function(sTabName) {
            var mTarget = {
                query : {
                    tab : sTabName
                }
            };
            this.getRouter().navTo("main", mTarget, false);
        }

    });

    return MainController;

});