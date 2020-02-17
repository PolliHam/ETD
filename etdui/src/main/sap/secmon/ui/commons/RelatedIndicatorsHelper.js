var ADependencies =
        [ "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/secmon/ui/commons/CommonFunctions", "sap/ui/model/odata/CountMode", "sap/ui/model/odata/ODataModel",
                "sap/ui/model/odata/ODataUtils" ];

sap.ui.define(ADependencies, function(Filter, FilterOperator, CommonFunctions, CountMode, ODataModel, ODataUtils) {
    "use strict";

    sap.secmon.ui.commons.RelatedIndicatorsHelper =
            (function() {

                var alertsModel;
                var knowledgeBaseModel;
                var patternsInScenarioModel;
                var relatedIndicatorsModel;

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

                function getPatternsInScenarioModel() {
                    if (!patternsInScenarioModel) {
                        patternsInScenarioModel = new ODataModel("/sap/secmon/services/ui/m/alerts/AlertDetailsWithCounts.xsodata", {
                            json : true,
                            defaultCountMode : CountMode.Inline
                        });
                    }

                    return patternsInScenarioModel;
                }

                function getRelatedIndicatorsModel() {
                    if (!relatedIndicatorsModel) {
                        relatedIndicatorsModel = new ODataModel("/sap/secmon/services/RelatedIndicators.xsodata", {
                            json : true,
                            defaultCountMode : CountMode.Inline
                        });
                    }

                    return relatedIndicatorsModel;
                }

                /**
                 * Get pattern IDs of patterns in the same pattern scenarios
                 */
                function retrieveTriggerNameActing(sAlertId, patternId, callback) {

                    getPatternsInScenarioModel().read("Alerts(X'" + sAlertId + "')", {

                        async : false,

                        success : function(oData2) {
                            var aTriggerNameActing = [];
                            var arrayLength = oData2.PatternInScenario.results.length;
                            
                            if (arrayLength > 0) {
                                aTriggerNameActing = oData2.PatternInScenario.results.map(function(result) {
                                    return oCommons.base64ToHex(result.PatternIdInScenario);
                                });
                            } else {
                                if (patternId) {
                                    aTriggerNameActing.push(patternId);
                                }
                            }
                            callback(aTriggerNameActing);
                        },

                        urlParameters : {
                            "$expand" : "PatternInScenario",
                            "$format" : "json",
                            "$select" : "PatternInScenario"
                        }
                    });
                }

                /**
                 * Subtracts the indicatorTimeframe from the alert start time stamp and adds the indicatorTimeframe to the alert end time stamp if the indicator time frame is set
                 */
                function retrieveIsPatternTimeFrameSet(indicatorTimeframe, fromDate, toDate) {
                    var isPatternTimeframeSet = true;
                    if (indicatorTimeframe === null || indicatorTimeframe === 0) {
                        isPatternTimeframeSet = false;
                    } else {                        
                        fromDate.setTime(fromDate.getTime() - indicatorTimeframe);
                        toDate.setTime(toDate.getTime() + indicatorTimeframe);
                    }

                    return isPatternTimeframeSet;
                }

                /**
                 * Filter the related events for the the patternIds in the same pattern scenario
                 */
                function filterForTriggerNameActing(sAlertId, sFilter, patternId, sFilterCount) {

                    var aTriggerNameActing;
                    // Get the patterns IDs in the same pattern scenarios
                    retrieveTriggerNameActing(sAlertId, patternId, function(filterTriggerNameActing) {
                        aTriggerNameActing = filterTriggerNameActing;
                    });
                    var aTriggerNameActingLength = aTriggerNameActing.length;
                    if (aTriggerNameActingLength > 0) {
                        sFilterCount += encodeURIComponent(" and (TriggerNameActing eq ");
                        sFilter += "&TriggerNameActing=";
                        for (var i = 0; i < aTriggerNameActingLength; i++) {
                            sFilterCount += "'" + aTriggerNameActing[i] + "'";
                            sFilter += aTriggerNameActing[i];
                            if (i < aTriggerNameActingLength - 1) {
                                sFilterCount += encodeURIComponent(" or TriggerNameActing eq ");
                                sFilter += "%25252C%25252C";
                            }
                        }
                        sFilterCount += ")";
                    }
                    var response = [ sFilter, sFilterCount ];

                    return response;
                }

                return {
                    getRelatedIndicatorsFilterAsDeferred : function(sAlertId) {
                        var deferred = $.Deferred();

                        getAlertsModel().read(
                                "Alerts(X'" + sAlertId + "')",
                                {
                                    success : function(oData) {
                                        var mTechnicalKeyToFieldNameAndValue = {
                                            queryStartTimestamp : oData.QueryStartTimestamp,
                                            queryEndTimestamp : oData.QueryEndTimestamp,
                                            indicatorTimeframe : oData.IndicatorTimeframe,// in milliseconds,
                                            patternId : oData.PatternId,
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

                                                            var isPatternTimeframeSet = retrieveIsPatternTimeFrameSet(mTechnicalKeyToFieldNameAndValue.indicatorTimeframe, fromDate, toDate);

                                                            var sFilter =
                                                                    "relIndicator=true&timeSelectionType=absolute&timeFromDate=" + fromDate.getTime() + "&timeToDate=" + toDate.getTime() +
                                                                            "&orderBy=Timestamp&orderDesc=true";
                                                            var sFilterCount =
                                                                    encodeURIComponent("(Timestamp ge datetime'" + fromDate.toISOString().substr(0, 19) + "' and Timestamp le datetime'" +
                                                                            toDate.toISOString().substr(0, 19) + "')");

                                                            /**
                                                             * Filter the related events for the EventLogType = Indicator and the patternIds in the same pattern scenario
                                                             */
                                                            var patternId = "";
                                                            if (mTechnicalKeyToFieldNameAndValue.patternId.length === 24) {
                                                                patternId = oCommons.base64ToHex(mTechnicalKeyToFieldNameAndValue.patternId);
                                                            }

                                                            var filterForTriggerNameActingResponse = filterForTriggerNameActing(sAlertId, sFilter, patternId, sFilterCount);
                                                            sFilter = filterForTriggerNameActingResponse[0];
                                                            sFilterCount = filterForTriggerNameActingResponse[1];

                                                            // Get number of related indicators
                                                            getRelatedIndicatorsModel();
                                                            $.ajax({
                                                                url : "/sap/secmon/services/RelatedIndicators.xsodata/IndicatorsWithUserPseudonyms/$count?$filter=" + sFilterCount,
                                                                type : "GET",
                                                                dataType : "text",
                                                                async : false,
                                                                success : function(count) {
                                                                    deferred.resolve(count, sFilter, isPatternTimeframeSet, true);
                                                                }
                                                            });
                                                        },
                                                    });
                                        } else {
                                            deferred.reject();
                                        }
                                    },
                                    urlParameters : {
                                        "$expand" : "Details",
                                        "$select" : "Details,QueryEndTimestamp,QueryStartTimestamp,AlertMeasureContext,IndicatorTimeframe,PatternId"
                                    }
                                });

                        return deferred;
                    }

                };
            })();

    return sap.secmon.ui.commons.RelatedIndicatorsHelper;
});
