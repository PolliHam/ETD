jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
$.sap.require("sap.secmon.ui.configcheck.Formatter");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.configcheck.Detail", {

    oRouter : null,

    handleRouteMatched : function(oEvent) {
        if (oEvent.getParameters().name !== "Detail") {
            return;
        }
        var args = oEvent.getParameters().arguments;
        var sSystemId = decodeURIComponent(args.SystemId);
        var sDataSource = decodeURIComponent(args.DataSource);

        var sPath = "/Header(SystemId='" + sSystemId + "' ,DataSource='" + sDataSource + "')";

        this.getView().bindElement(sPath);
        this.filterData(sSystemId, sDataSource);
        this.getView().getModel("ModelHeaderInformation").setData({
            DataSource : sDataSource
        });
    },

    onInit : function() {
        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);
        var oModel = new sap.ui.model.json.JSONModel({
            DataSource : ""
        });
        this.getView().setModel(oModel, 'ModelHeaderInformation');
    },

    getConfigCheckDetailsTable : function() {
        this.oConfigCheckDetailsTable = this.oConfigCheckDetailsTable || this.getView().byId("tableDetails");
        return this.oConfigCheckDetailsTable;
    },

    filterData : function(system, dataSource) {
        var aFilters = [];
        var oBinding = this.getConfigCheckDetailsTable().getBinding("items");
        aFilters.push(new sap.ui.model.Filter("SystemId", sap.ui.model.FilterOperator.EQ, system, null));
        aFilters.push(new sap.ui.model.Filter("DataSource", sap.ui.model.FilterOperator.EQ, dataSource, null));
        oBinding.filter(aFilters);
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

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

});