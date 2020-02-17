/* globals oTextBundle */
$.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");
$.sap.require("sap.secmon.ui.m.commons.EtdController");
$.sap.require("sap.secmon.ui.commons.NavigationHelper");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.domainrating.DomainGraph", {

    oRouter : null,
    oGraph : null,
    oNavigationHelper : new sap.secmon.ui.commons.NavigationHelper(3600),

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.domainrating.DomainGraph
     */
    onInit : function() {
        this.applyCozyCompact();
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
        // set Models
        var oModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oModel, "UIModel");
        var oGraphModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oGraphModel, "GraphModel");
        this.getView().addStyleClass("sapEtdBackgroundWhite");
        this.oGraph = this.getView().byId("domainForceDirectedGraph");
    },

    onAfterRendering : function() {
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    handleRouteMatched : function(oEvent) {
        /*
         * This event is called if the route itself matches, but also if a "subroute" matches. In our case, the subroute for alert contains also the URL-query parameters, where this view should be
         * filtered to.
         */
        var that = this;
        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }
        var name = oEvent.getParameter("name");
        if (name !== "analysis") {
            return;
        }
        
        this.nid = args.nid;
        // initialize
        if (this.nid) {
            this.oNavigationHelper.getNavigation(this.nid, function(data) {
                var oData = JSON.parse(data);
                that._loadData(oData);
            }, function(error) {
                that.reportError(that.getText("DA_URLExpired"));
            });
        }
    },
    navigateToObject : function(id, sFrom, sTo) {
        var navigationName = "analysis";
        var param = {};
        if (id && sFrom && sTo) {
            param = {
                nid : id,
                query : {
                    from : sFrom,
                    to : sTo
                }
            };
        }
        this.getComponent().getRouter().navTo(navigationName, param, false);
    },
    startGraph : function(data) {
        // sap.ui.core.BusyIndicator.hide();
        // this.graph.setAlertData(response.results);
        // this.graph.setFilterKeys(this.oFilterKeys);
        // this.graph.setAlertFilter(this.getAlertFSFilter());
        this.oGraph.createGraphData(data);
    },
    getShowLegend : function() {
        return this.oGraph.getShowLegend();
    },
    setShowLegend : function(bShowLegend) {
        this.oGraph.setShowLegend(bShowLegend);
    },
    getText : function(sTextKey, aValues) {
        return oTextBundle.getText(sTextKey, aValues);
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
    _loadData : function(data) {
        this.getView().setBusy(true);
        // TestData
        // new sap.secmon.ui.commons.AjaxUtil().postJson(sap.secmon.ui.domainrating.Constants.C_DOMAIN_RATING_PATH, JSON.stringify(oPayload)).done(function(response, textStatus, XMLHttpRequest) {
        // that.getView().setBusy(false);
        // that.startGraph(response.data);
        // }).fail(function(jqXHR, textStatus, errorThrown) {
        // that.getView().setBusy(false);
        // that.reportError(jqXHR.responseText);
        // });
    }
});
