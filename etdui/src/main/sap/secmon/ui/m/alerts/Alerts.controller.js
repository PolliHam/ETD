jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.alerts.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.FilterSortUtil");
jQuery.sap.require("sap.secmon.ui.m.commons.UrlParameterMappings");
jQuery.sap.require("sap.secmon.ui.m.commons.MappedViewSettingsHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.ViewSettingsExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");
jQuery.sap.require("sap.secmon.ui.m.commons.SelectionUtils");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/alerts/css/alerts.css");
sap.ui.controller("sap.secmon.ui.m.alerts.Alerts", {

    URL_PARAMETER_MAPPINGS : null,

    oCommons : null,

    oRouter : null,

    oAlertModel : null,

    sSessionUser : "",

    DEFAULT_ORDER_BY : "creationDate",
    DEFAULT_ORDER_DESC : true,

    onInit : function() {
        /**
         * Save the URL query parameters and forward them during navigation, such that they do not get lost during navigation.
         */
        this.oQueryParameters = {};
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);

        this.initialLoad = true;
        this.selectedAlert = null;
        this.URL_PARAMETER_MAPPINGS = new sap.secmon.ui.m.commons.UrlParameterMappings(sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE);

        this.oAlertModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/patterndefinitionToAlerts.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.oAlertModel.attachRequestFailed(this.oCommons.handleRequestFailed);
        this.oAlertModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
        this.oAlertModel.attachRequestCompleted(this.getAlertCount, this);

        this.getView().setModel(this.oAlertModel);

        var oList = this.getView().byId("idAlertList");
        oList.attachEventOnce("updateFinished", function() {
            this.initialAlertSelection();
        }, this);
        this.setAlertListMode();
    },

    getAlertCount : function(oEvent) {
        var oList = this.getView().byId("idAlertList");
        var alertCount = oList.getBinding("items").getLength();
        this.setPageTitleCount(alertCount);
    },

    initialAlertSelection : function() {
        var oList = this.getView().byId("idAlertList");
        // select an alert on initial load
        var alertList = oList.getItems();
        var firstItem = alertList[0];
        if (firstItem && this.initialLoad === true) {
            this.initialLoad = false;// required to avoid endless loop
            var sAlertId = null;
            if (this.selectedAlert) {
                sAlertId = this.selectedAlert;
            } else {
                if (!sap.ui.Device.system.phone) {
                    sAlertId = firstItem.getBindingContext().getProperty("AlertId");
                    sAlertId = this.oCommons.base64ToHex(sAlertId);
                }
            }
            this.selectInitialAlert(sAlertId);
            if (sAlertId) {
                this.alertSelected(sAlertId);
            }
        }
    },

    handleRouteMatched : function(oEvent) {
        /*
         * This event is called if the route itself matches, but also if a "subroute" matches. In our case, the subroute for alert contains also the URL-query parameters, where this view should be
         * filtered to.
         */
        var args = oEvent.getParameter("arguments");
        if (args === null || args === undefined) {
            return;
        }
        var name = oEvent.getParameter("name");

        var oQueryParameters = args["?query"];

        // select alert with id specified in URL
        if (name === "alert") {
            this.selectedAlert = oQueryParameters.alert;
        }
        this.oQueryParameters = oQueryParameters;

        var that = this;
        sap.secmon.ui.m.commons.MappedViewSettingsHelper.applyUrlParametersToBindingAndViewSettings(this.getSettingsDialog(), sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE,
                oQueryParameters, this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC).done(function(aFilters, oSorter) {
            sap.secmon.ui.commons.FilterSortUtil.applyFiltersAndSorterToTable(that.getAlertsList(), aFilters, oSorter);
        });

    },

    alertSelected : function(sAlertId) {
        /*
         * Add the original query parameters, such that they do not get lost by navigation
         */
        var oQuery = this.oCommons.clone(this.oQueryParameters);
        if (sAlertId === null || sAlertId === undefined) {
            delete oQuery.alert;
        } else {
            oQuery.alert = sAlertId;
        }
        this.navToAlert(oQuery);
    },

    navToAlert : function(oQuery) {
        // If we're on a phone, include nav in history; if not, don't.

        // If there is no alert ID supplied:
        // For a phone, do not navigate away from alerts list, otherwise show
        // empty view
        var bReplace = sap.ui.Device.system.phone ? false : true;
        var routeName = oQuery.alert ? "alert" : (sap.ui.Device.system.phone ? "alerts" : "noAlert");
        this.oRouter.navTo(routeName, {
            query : oQuery
        }, bReplace);
    },

    onBackButtonPressed : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    getComponent : function() {
        return sap.ui.getCore().getComponent(sap.ui.core.Component.getOwnerIdFor(this.getView()));
    },

    getAlertsList : function() {
        return this.getView().byId("idAlertList");
    },

    getAlertsPage : function() {
        return this.getView().byId("idAlertsPage");
    },

    getAlertsListBinding : function() {
        return this.getAlertsList().getBinding("items");
    },

    /**
     * Set the count in the page title directly from the controller. Currently binding to a second model (using a model-ID) does not work, when the View runs in a component.
     */
    setPageTitleCount : function(count) {
        var title = this.getView().getModel("i18n").getProperty("MobAlert_Alerts_Title");
        this.getAlertsPage().setTitle(title + " (" + count + ")");
    },

    /**
     * Select alert on initial load. Either alert id is specified in URL or first available alert will be selected.
     */
    selectInitialAlert : function(sAlertId) {
        sap.secmon.ui.m.commons.SelectionUtils.selectItems([ sAlertId ], this.getAlertsList(), "AlertId");
    },

    setAlertListMode : function() {
        var mode = sap.ui.Device.system.phone ? sap.m.ListMode.None : sap.m.ListMode.SingleSelectMaster;
        this.getAlertsList().setMode(mode);
    },

    onAlertSelected : function(oEvent) {
        var sAlertId = oEvent.getParameter("listItem").getBindingContext().getProperty("AlertId");
        sAlertId = this.oCommons.base64ToHex(sAlertId);
        this.alertSelected(sAlertId);
    },

    handleViewSettingsDialogButtonPressed : function(oEvent) {
        this.getSettingsDialog().open();
    },

    getSettingsDialog : function() {
        if (!this.settingsDialog) {
            this.settingsDialog = sap.ui.xmlfragment("sap.secmon.ui.m.alerts.AlertsSettingsDialog", this);
            this.getView().addDependent(this.settingsDialog);
        }
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.settingsDialog);

        return this.settingsDialog;
    },

    /**
     * callback for view settings dialog
     * 
     * this function builds a query object of the selected filter- and order- settings and triggers a navigation with the query object (note: a navigation allows that the URL reflects the current
     * state of the displayed objects and the view can be reconstructed at 'any' time). the corresponding handler in handleRouteMatched builds the filter items and applies them to the binding. the
     * binding-handler in the bottom of the coding ensures that the first element of the new dataset is selected.
     * 
     * @param oEvent
     */
    handleSettingsConfirm : function(oEvent) {
        var extractor = new sap.secmon.ui.m.commons.ViewSettingsExtractor(sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE, this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC);

        var oNewQueryParameters = extractor.extractQueryObjectFromEvent(oEvent);

        var oOldQueryParameters = this.oQueryParameters;

        // take over only when not in edit mode
        this.getComponent().getNavigationVetoCollector().noVetoExists().done($.proxy(function() {
            this.oQueryParameters = oNewQueryParameters;
            if (oOldQueryParameters.ageInHours) {
                this.oQueryParameters.ageInHours = oOldQueryParameters.ageInHours;
            }

            // reset initial element
            this.initialLoad = true;
            this.selectedAlert = null;

            // trigger navigation
            this.navToAlert(oNewQueryParameters);

            // select first element if data-loading is finished
            var oBinding = this.getAlertsListBinding();
            var fnDataReceived = function() {
                oBinding.detachDataReceived(fnDataReceived, this);
                this.initialAlertSelection();
            };
            oBinding.attachDataReceived(fnDataReceived, this);
        }, this)).fail(
                $.proxy(function() {
                    // restore selection
                    sap.secmon.ui.m.commons.MappedViewSettingsHelper.applyUrlParametersToBindingAndViewSettings(this.getSettingsDialog(), sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE,
                            oOldQueryParameters, this.DEFAULT_ORDER_BY, this.DEFAULT_ORDER_DESC).done();
                }, this));
    }

});
