$.sap.require("sap.secmon.ui.m.anomaly.ui.Constants");
$.sap.require("sap.secmon.ui.m.commons.EtdController");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.anomaly.ui.Analysis", {

    oRouter : null,
    outlierDetection : null,

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.m.anomaly.ui.Shell
     */
    onInit : function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
        // set UIModel
        var oModel = new sap.ui.model.json.JSONModel();
        var oData = {};
        oData.settingsBUTVisible = false;
        oData.outlierBUTVisible = false;
        this.getView().setModel(oModel);
        this.getView().addStyleClass("sapEtdBackgroundWhite");
        oModel.setData(oData);
    },

    onAfterRendering : function() {
        this.outlierDetection = this.getView().byId("featureSpace");
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
        var args = oEvent.getParameter("arguments");
        var sFromTimestamp, sToTimestamp;
        if (args === null || args === undefined) {
            return;
        }
        var name = oEvent.getParameter("name");
        if (name !== "analysePattern" && name !== "analysis") {
            return;
        }

        this.patternId = args.patternId;
        var oQueryParameters = args["?query"];
        if (oQueryParameters) {
            this.patternId = this.patternId || oQueryParameters.patternId;
            sFromTimestamp = oQueryParameters.fromTimestamp;
            sToTimestamp = oQueryParameters.toTimestamp;
            // if (sFromTimestamp && sToTimestamp) {
            // oFromTimestamp = new Date(sFromTimestamp);
            // oToTimestamp = new Date(sToTimestamp);
            // }
        }
        // initialize
        if (this.patternId) {
            this.outlierDetection.initialize(this.patternId, sFromTimestamp, sToTimestamp);
        } else {
            this.outlierDetection.initialize();
        }
    },
    navigateToObject : function(sPatternId, sFrom, sTo) {
        var navigationName = "analysePattern";
        var param = {};
        if (sPatternId && sFrom && sTo) {
            param = {
                patternId : sPatternId,
                query : {
                    fromTimestamp : sFrom,
                    toTimestamp : sTo
                }
            };
        }
        this.getComponent().getRouter().navTo(navigationName, param, false);
    },
});
