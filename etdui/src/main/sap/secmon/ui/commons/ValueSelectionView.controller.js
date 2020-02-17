jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

sap.ui.controller("sap.secmon.ui.commons.ValueSelectionView", {

    commons : new sap.secmon.ui.commons.CommonFunctions(),

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf v1
     */
    oCommons : new sap.secmon.ui.commons.CommonFunctions(),

    onInit : function() {
    },

    /*
     * Sets the model, binding aggregation and column descriptions for the selection table.
     * 
     * Example:
     * 
     * aColumnInfo = [ { textKey : "Commons_SystemId", property : "Id" }, {textKey : "Commons_SystemType", property : "Type" }];
     * 
     * setData(oSystemModel, "/SystemHeader", aColumnInfo);
     */
    setData : function(oModel, aggregationName, aColumnInfo, aValueHelpModelFilter) {
        this.oSystemModel = oModel;
        var view = this.getView();
        view.setModel(oModel);
        view.setColumnInfo(aColumnInfo);
        view.bindModel(aggregationName, aValueHelpModelFilter);
    }

});
