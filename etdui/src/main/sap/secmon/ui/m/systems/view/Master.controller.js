jQuery.sap.require("sap.secmon.ui.m.commons.EtdMasterController");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.systems.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.commons.FilterSortUtil");
sap.secmon.ui.m.commons.EtdMasterController.extend("sap.secmon.ui.m.systems.view.Master", {
    serviceURL : "/sap/secmon/services/ui/systemcontext/SystemData.xsodata/SystemHeader/",
    onInit : function() {

        var component = this.getComponent();
        var fnRouteEnhancer = function(paramObject) {
            var oDetailController = component.oDetailController;
            if (!oDetailController) {
                paramObject.tab = "general";
            } else {
                paramObject.tab = oDetailController.getSelectedTab();
            }
        };

        this.init({
            entityName : "system",
            listControlId : "list",
            searchProperty : "Id",
            routeEnhancer : fnRouteEnhancer
        });
    },
    onAfterRendering : function() {
        this.attachTableCountListener();
    },

    /**
     * Attaches a listener to the table binding to update the count in the table title after every data receiving.
     */
    attachTableCountListener : function() {
        var controller = this;
        if (!this.fnSystemTitle) {
            var oView = this.getView();
            var oBinding = oView.byId("list").getBinding("items");

            this.fnSystemTitle = function() {
                var format = controller.getText("MSystems_App_Title_WC");
                var sNewTitle = sap.secmon.ui.commons.Formatter.i18nText(format, oBinding.getLength());
                oView.byId("page").setTitle(sNewTitle);
            };
            oBinding.attachDataReceived(this.fnSystemTitle);
        }
    },

});