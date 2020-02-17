jQuery.sap.require("sap.secmon.ui.m.commons.EtdMasterController");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.FilterSortUtil");
jQuery.sap.require("sap.secmon.ui.m.semanticEventViewer.util.Formatter");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.secmon.ui.m.commons.EtdMasterController.extend("sap.secmon.ui.m.semanticEventViewer.view.Master", {
    DEFAULT_RANGE_VALUE_IN_MINUTES : 15,
    ALERT_SERVICE_URL : '/sap/secmon/services/patterndefinitionToAlerts.xsodata',
    QUBE_SERVICE_URL : '/sap/secmon/ui/browse/services2/Qube.xsodata',
    RAW_DATA_SERVICE_URL : '/sap/secmon/ui/browse/services2/queryBuilder.xsjs',

    alertService : null,
    qubeService : null,
    logDataService : null,

    oCommons : new sap.secmon.ui.commons.CommonFunctions(),

    onInit : function() {
        this.init({
            entityName : "SemanticEventViewer",
            listControlId : "list",
            searchProperty : "Timestamp"
        });
        this.uiModel = new sap.ui.model.json.JSONModel({
            alertId : null,
            alertInfo : {},
            serializedData : {},
            showTimeRangeTitle : true,
            dataRequested : false,
            requestStarted : false,
        });

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        this.getView().setModel(this.uiModel, "uiModel");
        this.alertService = new sap.ui.model.odata.ODataModel(this.ALERT_SERVICE_URL, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.qubeService = new sap.ui.model.odata.ODataModel(this.QUBE_SERVICE_URL, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.getRouter().attachRouteMatched(this.onRouteMatched, this);
    },
    onRouteMatched : function(oEvent) {

        var routeName = oEvent.getParameter("name");
        var oArguments = oEvent.getParameter("arguments");
        var params = oArguments["?query"] || {};
        if (routeName !== "main") {
            return;
        }
        if (params.hasOwnProperty("type")) {
            this.uiModel.setProperty("/type", params.type);
        }
        if (params.hasOwnProperty("chartId")) {
            this.uiModel.setProperty("/chartId", params.chartId);
        }
        if (params.hasOwnProperty("alert")) {
            this.uiModel.setProperty("/alertId", params.alert);
            if (params.hasOwnProperty("triggeringEventCount")) {
                this.uiModel.setProperty("/triggeringEventCount", params.triggeringEventCount);
            }
            this.handleParameters();
        }

    },

    getRouteParameter : function(sName) {
        return this.oQueryObject[sName];
    },

    // @TODO whoy do we need the parameter <oModel> never been used
    initTableBinding : function(oModel) {

        var aFilter = [];
        var aData = this.uiModel.getProperty('/rawData');
        (aData || []).forEach(function(oData, idx) {
            aFilter.push(new sap.ui.model.Filter({
                filters : [ new sap.ui.model.Filter({
                    path : "MapId",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : oData.headerId.value
                }), new sap.ui.model.Filter({
                    path : "AlertId",
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : oData.alertInformation.AlertId
                }), new sap.ui.model.Filter({
                    path : "Timestamp",
                    operator : sap.ui.model.FilterOperator.BT,
                    value1 : oData.alertInformation.MinTimestamp,
                    value2 : oData.alertInformation.MaxTimestamp
                }), new sap.ui.model.Filter({
                    path : "TechnicalTimestampOfInsertion",
                    operator : sap.ui.model.FilterOperator.LT,
                    value1 : oData.alertInformation.QueryEndTimestamp
                }) ],
                and : true
            }));
        });
        var oFilter = new sap.ui.model.Filter(aFilter, false);

        var oSorter = new sap.ui.model.Sorter('Timestamp', true);

        var list = this.getView().byId("list");
        var oTemplate = this.getView().byId("itemTemplate");
        list.bindItems({
            path : '/RawEventsWithoutUser',
            sorter : oSorter,
            filters : oFilter,
            template : oTemplate,
            parameters : {
                select : 'Timestamp,SystemIdReporter,SystemTypeReporter,EventSemantic,SystemIdActor,SystemTypeActor,UserPseudonymActing,ServiceOutcome,GenericOutcomeReason'
            }
        });

        var bindingInfo = list.getBinding("items");
        bindingInfo.attachDataReceived(bindFirstItem, this);
        function bindFirstItem() {
            this.selectFirstListItem();
            bindingInfo.detachDataReceived(bindFirstItem, this);
        }

    },
    showDetail : function(oItem) {
        // If we're on a phone, include nav in history; if not,
        // don't.
        var bReplace = sap.ui.Device.system.phone ? false : true;

        var navigationParameter = {};
        var bindingContext = oItem.getBindingContext();
        if (bindingContext) {
            navigationParameter[this.entityName] = bindingContext.getPath().substr(1);
            navigationParameter.query = {
                alert : this.uiModel.getProperty("/alertId")
            };

            this.getRouter().navTo(this.entityName, navigationParameter, bReplace);

        }
    },

    handleParameters : function() {
        var that = this, url = "/sap/secmon/services/ui/m/alerts/TriggeringEventsForAlertsService.xsjs";
        if (this.uiModel.getProperty("/alertId") && !this.uiModel.getProperty("/dataRequested") && !this.uiModel.getProperty("/requestStarted")) {
            url += "?AlertId=" + this.uiModel.getProperty("/alertId");
            if (this.uiModel.getProperty("/chartId")) {
                url += "&ChartId=" + this.uiModel.getProperty("/chartId");
            }
            jQuery.ajax({
                url : url,
                type : "GET",
                success : function(data, textStatus, XMLHttpRequest) {
                    that.uiModel.setProperty("/dataRequested", true);
                    that.uiModel.setProperty("/rawData", data);
                    that.initTableBinding(that.uiModel);
                },
                async : true,
                error : function(xhr, textStatus, errorThrown) {
                    console.log(textStatus + " " + errorThrown);
                }
            });
            this.uiModel.setProperty("/requestStarted", true);
        }

    },

});