var ADependencies =
        [ "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/secmon/ui/commons/CommonFunctions", "sap/ui/model/odata/CountMode", "sap/ui/model/odata/ODataModel",
                "sap/ui/model/odata/ODataUtils" ];

sap.ui.define(ADependencies, function(Filter, FilterOperator, CommonFunctions, CountMode, ODataModel, ODataUtils) {
    "use strict";

    sap.secmon.ui.commons.RelatedEventsHelper =
            (function() {

                var alertsModel;
                var knowledgeBaseModel;
                var eventsModel;

                var oCommons = new CommonFunctions();

                function getAlertsModel() {
                    if (!alertsModel) {
                        alertsModel = new ODataModel("/sap/secmon/services/patterndefinitionToAlerts.xsodata", {
                            json : true,
                            defaultCountMode : CountMode.Inline
                        });
                    }

                    return alertsModel;
                }

                function getKnowledgeBaseModel() {
                    if (!knowledgeBaseModel) {
                        knowledgeBaseModel = new ODataModel("/sap/secmon/services/KnowledgeBase.xsodata", {
                            json : true,
                            defaultCountMode : CountMode.Inline
                        });
                    }

                    return knowledgeBaseModel;
                }

                function forAMetaDataProperty(fnFilter, model) {
                    var oMetadata = model.getServiceMetadata();

                    oMetadata.dataServices.schema.some(function(schema) {
                        return schema.entityType.some(function(entityType) {
                            if (entityType.name === "LogEventsType") {
                                return entityType.property.some(function(property) {
                                    return fnFilter(property);
                                });
                            } else {
                                return false;
                            }
                        });

                    });

                }

                function getEventsModel() {
                    if (!eventsModel) {
                        eventsModel = new ODataModel("/sap/secmon/services/ui/m/semanticEvents/logEvents.xsodata", {
                            json : true,
                            defaultCountMode : CountMode.Inline
                        });
                    }

                    return eventsModel;
                }

                return {
                    getRelatedEventCountAsDeferred : function(sAlertId) {
                        var deferred = $.Deferred();

                        getAlertsModel().read(
                                "Alerts(X'" + sAlertId + "')",
                                {
                                    success : function(oData) {
                                        var mTechnicalKeyToFieldNameAndValue = {
                                            queryStartTimestamp : oData.QueryStartTimestamp,
                                            queryEndTimestamp : oData.QueryEndTimestamp,
                                        };

                                        if (oData.AlertMeasureContext === "Log") {
                                            oData.Details.results.forEach(function(oDetail) {
                                                mTechnicalKeyToFieldNameAndValue[oCommons.base64ToHex(oDetail.DimensionId)] = {
                                                    value : oDetail.Value
                                                };
                                            });

                                            var aFiltersForKnowledgeBase = [];
                                            Object.keys(mTechnicalKeyToFieldNameAndValue).forEach(function(sTechnicalKey) {
                                                aFiltersForKnowledgeBase.push(new sap.ui.model.Filter({
                                                    path : "techKey",
                                                    value1 : sTechnicalKey,
                                                    operator : FilterOperator.EQ
                                                }));
                                            });

                                            getKnowledgeBaseModel().read(
                                                    "Attribute",
                                                    {
                                                        filters : aFiltersForKnowledgeBase,
                                                        success : function(oData) {
                                                            var fromDate = mTechnicalKeyToFieldNameAndValue.queryStartTimestamp;
                                                            fromDate.setSeconds(fromDate.getSeconds() - 1);

                                                            var toDate = mTechnicalKeyToFieldNameAndValue.queryEndTimestamp;
                                                            toDate.setSeconds(toDate.getSeconds() + 1);

                                                            var aFilters = [ new Filter({
                                                                filters : [ new Filter({
                                                                    path : "Timestamp",
                                                                    value1 : fromDate,
                                                                    operator : FilterOperator.GE
                                                                }), new Filter({
                                                                    path : "Timestamp",
                                                                    value1 : toDate,
                                                                    operator : FilterOperator.LE
                                                                }) ],
                                                                and : true
                                                            }) ];

                                                            var sFilter =
                                                                    "relIndicator=false&timeSelectionType=absolute&timeFromDate=" + fromDate.getTime() + "&timeToDate=" + toDate.getTime() +
                                                                            "&orderBy=Timestamp&orderDesc=true";
                                                            var key, value;
                                                            var model = getEventsModel();
                                                            var operator = null;
                                                            oData.results.forEach(function(oResult) {
                                                                mTechnicalKeyToFieldNameAndValue[oResult.techKey].name = oResult.name;

                                                                if (oResult.name !== "Timestamp") {
                                                                    key = oResult.name;
                                                                    value = mTechnicalKeyToFieldNameAndValue[oResult.techKey].value;
                                                                    operator = FilterOperator.EQ;

                                                                    // If the property is a string, use
                                                                    // contains, rather than equal
                                                                    forAMetaDataProperty(function(oProperty) {
                                                                        if (key === oProperty.name && oProperty.type === "Edm.String") {
                                                                            operator = FilterOperator.Contains;
                                                                            return true;
                                                                        }
                                                                    }, model);

                                                                    // if a value is null then do not
                                                                    // include it as filter:
                                                                    // 1. service has to allow filtering by
                                                                    // null-values (gets very slow)
                                                                    // 2. event fs has to allow filtering by
                                                                    // null-values
                                                                    if (value) {
                                                                        aFilters.push(new sap.ui.model.Filter({
                                                                            path : (operator === FilterOperator.Contains ? "tolower(" + key + ")" : key),
                                                                            value1 : (operator === FilterOperator.Contains ? "'" + value.toLowerCase().replace(new RegExp("'", 'g'), "''") + "'"
                                                                                    : value),
                                                                            operator : operator
                                                                        }));
                                                                        sFilter += "&" + key + "=" + encodeURIComponent(value);
                                                                    }
                                                                }
                                                            });
 
                                                            // due to performance issues, we avoid calculating the count for related events
                                                            deferred.resolve(sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/alerts/i18n/UIText.hdbtextbundle", "MobAlert_RelEventShow"),
                                                                    sFilter, true);
                                                        },
                                                        urlParameters : {
                                                            "$select" : "name,techKey"
                                                        },
                                                    });
                                        } else {
                                            deferred.reject();
                                        }
                                    },
                                    urlParameters : {
                                        "$expand" : "Details",
                                        "$select" : "Details,QueryEndTimestamp,QueryStartTimestamp,AlertMeasureContext"
                                    }
                                });
                        return deferred;
                    }
                };
            })();

    return sap.secmon.ui.commons.RelatedEventsHelper;
});