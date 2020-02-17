sap.ui.controller("sap.secmon.ui.loglearning.runOverview", {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf sap.secmon.ui.loglearning.runOverview
     */
    onInit : function() {
        this.getView().setModel(sap.ui.getCore().getModel("RunJSONModel"));
        this.getView().bindObject("/run");

    },

    /**
     * Handles the change event of the description text area
     * 
     * @param oEvent
     * @memberOf sap.secmon.ui.loglearning.runOverview
     */
    onChangeDescription : function(oEvent) {
        sap.ui.getCore().getModel("RunModel").setProperty("/isSaveNeeded", true);
        sap.ui.getCore().getModel("RunModel").setProperty("/description", oEvent.getParameter("value"));
        sap.ui.getCore().getModel("RunJSONModel").setProperty("/run/Description", oEvent.getParameter("value"));
    }
});