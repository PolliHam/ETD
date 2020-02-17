jQuery.sap.require("sap.secmon.ui.m.commons.alerts.AlertsBaseController");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.commons.UrlParameterMappings");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.ui.model.odata.CountMode");
sap.secmon.ui.m.commons.alerts.AlertsBaseController.extend("sap.secmon.ui.m.alertsfs.view.AlertGraph", {
    ALERT_SOURCE_TARGET_SYSTEM : "/sap/secmon/services/ui/m/alerts/AlertSourceTargetSystems.xsodata/",

    onInit : function() {
        this.applyCozyCompact();
        // explicitly request JSON format
        this.oDataModel = new sap.ui.model.odata.ODataModel(this.ALERT_SOURCE_TARGET_SYSTEM, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.oFilterKeys = {
            user : true,
            terminal : true,
            system : true,
            color : false,
            symbol : true
        };
        this.graph = this.getView().byId("forceDirectedGraph");
    },

    /**
     * Setter for oDataModel filter. Used by other controllers to dispatch filters. This triggers (re)reading the oData model and therefore (re)drawing the graph.
     * 
     * @param aFilters -
     *            Array of SAPUI5 filter objects.
     */
    setAlertFilters : function(aFilters) {
        this.alertFilters = aFilters;
        this.readOData();
    },
    getAlertFilters : function() {
        return this.alertFilters;
    },

    setGraphFilters : function(oFilters) {
        this.oFilterKeys = oFilters;
        this.graph.setFilterKeys(oFilters);
    },

    readOData : function() {
        var controller = this;
        var filters = this.getAlertFilters();

        this.graph.clear();
        sap.ui.core.BusyIndicator.show(0);

        // The alert source target service should accept the same filter
        // parameters as the alerts service.
        // This is achieved setting the filters on association "Alert".
        var filtersWithNavigation = filters.map(function(filter) {
            return new sap.ui.model.Filter({

                path : filter.sPath,
                operator : filter.sOperator,
                value1 : filter.oValue1,
                value2 : filter.oValue2,
                and : filter.bAnd
            });
        });
        this.oDataModel.read("AlertData", {
            filters : filtersWithNavigation,
            success : $.proxy(controller.startGraph, this),
            error : $.proxy(controller.handleLoadingError, this)
        });
    },

    handleLoadingError : function() {
        sap.ui.core.BusyIndicator.hide();
        sap.m.MessageBox.alert(this.getText("MConnectedSys_Error"), {
            title : this.getCommonText("Error_TIT")
        });
    },

    handleGraphSettingsConfirm : function(oEvent) {
        this.oFilterKeys = oEvent.getParameter("filterKeys");
        this.graph.setFilterKeys(this.oFilterKeys);
        this.graph.createGraphData();
    },

    startGraph : function(response) {
        sap.ui.core.BusyIndicator.hide();
        this.graph.setAlertData(response.results);
        this.graph.setFilterKeys(this.oFilterKeys);
        this.graph.setAlertFilter(this.getAlertFSFilter());
        this.graph.createGraphData();
    },

    getAlertFSFilter : function() {
        var URL_PARAMETER_MAPPINGS = new sap.secmon.ui.m.commons.UrlParameterMappings(sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE);
        var filters = this.getAlertFilters();
        var alertFSFilters = [];
        var supportedDbValues = URL_PARAMETER_MAPPINGS.getSupportedDbFieldValues(true);

        filters.forEach(function(filter) {
            if (supportedDbValues.indexOf(filter.sPath) >= 0) {
                var oFilter = {};
                oFilter.Name = URL_PARAMETER_MAPPINGS.convertFromDBFieldName(filter.sPath, true);
                oFilter.Value = filter.oValue1;
                if (oFilter.Name === "creationDate") {
                    oFilter.Value2 = filter.oValue2;
                }
                alertFSFilters.push(oFilter);
            }
        });
        return alertFSFilters;
    },

    getShowLegend : function() {
        return this.graph.getShowLegend();
    },

    setShowLegend : function(bShowLegend) {
        this.graph.setShowLegend(bShowLegend);
    }
});
