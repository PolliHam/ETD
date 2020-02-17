jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.executionResultsfs.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.SelectionUtils");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.m.MessageBox");
sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.knowledgebase.view.AttributesDetail", {

    onInit : function() {
        this.applyCozyCompact();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);

    },

    onAfterRendering : function() {
        // this.attachTableCountListener();
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    onRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "attributesDetail") {
            return;
        }
        var oArguments = oEvent.getParameter("arguments");
        var oView = this.getView();

        oView.bindElement("Knowledgebase>/Attribute(X'" + oArguments.id + "')");
    },

    onNavBack : function() {
        this.getView().getModel("uiModel").setProperty("/clearSearch", false);
        window.history.go(-1);
    }

});
