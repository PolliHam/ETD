jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.knowledgebase.util.Common");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.knowledgebase.view.Attributes", {

    /**
     * @memberOf sap.secmon.ui.m.knowledgebase.view.Attributes
     */
    onInit : function() {
        this.applyCozyCompact();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.ownCommons = new sap.secmon.ui.m.knowledgebase.util.Common();
        sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(this.onRouteMatched, this);

        var fnNavigation = function() {
            // no need to add URL params for sorting
        };
        sap.secmon.ui.m.commons.FilterBarHelper.initialize.call(this, "table", sap.secmon.ui.m.commons.ServiceConstants.ATTRIBUTES_SERVICE, fnNavigation);

    },

    /**
     * Row was selected. Navigates to execution result.
     */
    onItemPress : function(oEvent) {
        var source = oEvent.getSource(), data, id;
        if (source) {
            data = source.getBindingContext("Knowledgebase").getObject();
            id = this.oCommons.base64ToHex(data.hash);
            sap.ui.core.UIComponent.getRouterFor(this).navTo("attributesDetail", {
                id : id,
            });
        }
    },
    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    onRouteMatched : function(oEvent) {
        if (oEvent.getParameter("name") !== "attributes") {
            return;
        }
        var oView = this.getView();          
        var oTemplate = oView.byId("table").getBindingInfo("items").template;        
        var oSearchField = oView.byId("searchAttributes");
        if (oView.getModel("uiModel").getProperty("/clearSearch")) {
            oSearchField.setValue("");
            oView.byId("table").bindItems("Knowledgebase>/Attribute", oTemplate, new sap.ui.model.Sorter("lowerDisplayName"));
        } else if (oSearchField.getValue()) { 
            oSearchField.fireSearch({
                query: oSearchField.getValue()
            });
            oView.getModel("uiModel").setProperty("/clearSearch", true);
        }
        oView.byId("name").setVisible(false);
        oView.byId("createdBy").setVisible(false);
        oView.byId("namespace").setVisible(false);
    },

    /**
     * Event handler: Called when searching for an event in the events view
     * 
     * @param oEvent
     */
    onSearch : function(oEvent) {
        var columnNames = [ "displayName", "description", "dataType" ];
        var query = oEvent.getParameter("query");
        var combinedFilter = this.ownCommons.filterAllColumns(columnNames, query);

        // apply filter to binding
        this.getView().byId("table").getBinding("items").filter([ combinedFilter ]);

        // Persist filter value in FilterBarHelper to ensure filter is available in case sort operation is being executed
        sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, [ combinedFilter ]);
    },

    onNavBack : function() {
        window.history.go(-1);
    }

});
