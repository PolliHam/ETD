sap.ui.controller("sap.secmon.ui.loglearning.protocol", {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.loglearning.protocol
     */
    onInit : function() {
        var oModel = sap.ui.getCore().getModel("logDiscovery");
        this.getView().setModel(oModel);
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.getRoute("protocol").attachMatched(this.onRouteMatched, this);
    },

    onRouteMatched : function(oEvent) {
        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }

        var sRunName = args.run;
        var sPath = "/Run('" + encodeURIComponent(sRunName) + "')";
        this.getView().bindObject(sPath);

        // Do not set selectedRunName here: It is done centally in ShellRun.controller (used in caching condition)
        // sap.ui.getCore().getModel("RunModel").setProperty("/selectedRunName", sRunName);

    }
});