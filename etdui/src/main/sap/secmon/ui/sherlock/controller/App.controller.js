$.sap.require("sap.secmon.ui.m.commons.NavigationService");

sap.ui.controller("sap.secmon.ui.sherlock.controller.App", {
    onInit : function() {
        var oList = sap.ui.view({
            id : "idSearchList",
            viewName : "sap.secmon.ui.sherlock.view.List",
            type : sap.ui.core.mvc.ViewType.XML
        });
        var oApp = this.getView().byId("app");
        oApp.insertPage(oList);
        oApp.setInitialPage(oList);
    }

});