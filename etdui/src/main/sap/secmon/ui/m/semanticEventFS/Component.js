// This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages
jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.declare("sap.secmon.ui.m.semanticEventFS.Component");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.secmon.ui.commons.TextUtils");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");

jQuery.sap.registerModulePath("sap.secmon.ui.browse", "/sap/secmon/ui/browse/ui");
jQuery.sap.require("sap.secmon.ui.browse.Constants");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ViewSettingsStyle.css");

sap.secmon.ui.m.commons.EtdComponent.extend("sap.secmon.ui.m.semanticEventFS.Component", {

    metadata : {
        name : "Semantic Events",
        version : new sap.secmon.ui.commons.CommonFunctions().getVersion(),
        includes : [],
        dependencies : {
            libs : [ "sap.ui.layout", "sap.ui.core", "sap.m", "sap.ui.fl", "sap.ui.comp", "sap.ui.table" ],
            components : []
        },
        rootView : "sap.secmon.ui.m.semanticEventFS.view.App",
        config : {
            // Will be used by the FLP as title in browser
            title : sap.secmon.ui.commons.TextUtils.getText("/sap/secmon/ui/m/semanticEventFS/i18n/UIText.hdbtextbundle", "SemanticEventsTitle"),
            resourceBundle : "/sap/secmon/ui/m/semanticEventFS/i18n/UIText.hdbtextbundle",
            semanticEventsConfig : {
                serviceUrl : "/sap/secmon/ui/browse/services2/logEntries.xsjs"
            },
            relatedIndicatorsConfig : {
                serviceUrl : "/sap/secmon/services/RelatedIndicators.xsodata"
            },
            backendConfig : {
                loadHanaUsers : false,
                loadKnowledgeBaseTexts : true
            }
        },
        routing : {
            config : {
                routerClass : sap.ui.core.routing.Router,
                viewType : "XML",
                viewPath : "sap.secmon.ui.m.semanticEventFS.view",
                targetAggregation : "pages",
                clearTarget : false
            },
            routes : [ {
                pattern : ":?query:",
                name : "main",
                view : "SemanticEvents",
                viewLevel : 0,
                targetControl : "idAppControl",
            } ]
        },
    },

    _aaNameKeyMap : {},

    getNameKeyMap : function() {
        return this._aaNameKeyMap;
    },

    /**
     * Calling PseudoOData service with two steps:
     * <ul>
     * <li>HTTP POST to upload the query</li>
     * <li>OData service call with queryId as OData service filter</li>
     * </ul>
     * 
     */

    callPseudoODataService : function(fnCallback, aFilters) {

        // default query template
        // queryOptions are set in backend service logEntries.xsjs
        // Only filters($filter) are provided with QueryBuilder (datasets.filters)
        var oQuery = {
            context : "Log",
            dataSets : [],
            now : new Date().toISOString(), // "2018-04-11T12:18:19Z",
            operation : "getData",
            original : false,
            period : {
                operator : "=",
                searchTerms : [ "last15Minutes" ]
            },
            startDatasets : [ {
                name : "Path1"
            } ],
            verbose : false,
        /*
         * queryOptions : { orderby : [ { field : "SystemIdActor", // System Id, Actor desc : true } ], "top" : 50, // integer "skip" : 0, // integer select : [ "Id", "Timestamp", "EventLogType",
         * "UserPseudonymActing" ] },
         */
        };

        if (aFilters) {
            var aDataSets = [ {
                name : "Path1.Subset" + aFilters.length,
                context : "Log",
                dependsOn : [],
                filters : []
            } ];

            var regexp = /tolower\(['"]*([^'"\(\)]+)['"]*\)/i;
            var aaNameKeyMap = this._aaNameKeyMap;

            // Local function to convert all the filters in OData service
            // into QueryBuilder format by using "and" / "or" flags
            var bAnd = false, sKey, oFoundFilter;
            var _applyFiltersRecursively = function(aFilters) {
                aFilters.forEach(function(oFilter) {
                    if (oFilter._bMultiFilter) {
                        bAnd = true;
                        _applyFiltersRecursively(oFilter.aFilters);
                    } else {
                        // check if the filter already exists
                        sKey = aaNameKeyMap[oFilter.sPath.indexOf("tolower(") < 0 ? oFilter.sPath : regexp.exec(oFilter.sPath)[1]];
                        if (sKey) {
                            if (oFilter.sOperator === "BT") {
                                // Modify the global period
                                oQuery.period = {
                                    operator : "BETWEEN",
                                    searchTerms : [ oFilter.oValue1.toISOString(), oFilter.oValue2.toISOString() ]
                                };
                            } else {
                                var _findFilterWithSameKey = function(aFilters, sKey) {
                                    var oFoundFilter = null;
                                    aFilters.some(function(oFilter) {
                                        if (oFilter.key === sKey) {
                                            oFoundFilter = oFilter;
                                            return true;
                                        }
                                    });
                                    return oFoundFilter;
                                };

                                // Collect the values of the same field and put them into one filter with "IN" operator
                                var sVal = oFilter.oValue1.indexOf("tolower(") < 0 ? oFilter.oValue1 : regexp.exec(oFilter.oValue1)[1];
                                oFoundFilter = _findFilterWithSameKey(aDataSets[0].filters, sKey);
                                if (oFoundFilter) {
                                    oFoundFilter.valueRange.searchTerms.push(sVal);
                                } else {
                                    // Last filter in the same field but different roles is set to be or=false
                                    if (bAnd && aDataSets[0].filters.length > 0) {
                                        aDataSets[0].filters[aDataSets[0].filters.length - 1].or = !bAnd;
                                        bAnd = !bAnd;
                                    }
                                    aDataSets[0].filters.push({
                                        key : sKey,
                                        valueRange : {
                                            operator : "IN",
                                            searchTerms : [ sVal ]
                                        },
                                        or : true
                                    });
                                }
                            }
                        }
                    }
                });
            };

            _applyFiltersRecursively(aFilters);

            oQuery.dataSets = aDataSets;
            oQuery.startDatasets = [ {
                name : aDataSets[0].name
            } ];
        }

        var sLocale = sap.ui.getCore().getConfiguration().getLanguage();

        var oTextBundle = jQuery.sap.resources({
            url : "/sap/secmon/ui/domainrating/i18n/UIText.hdbtextbundle",
            locale : sLocale
        });

        var xhr = new XMLHttpRequest();
        xhr.open('POST', sap.secmon.ui.browse.Constants.C_ODATA_LOGS_PATH_XSJS, true);
        xhr.setRequestHeader("X-CSRF-Token", this.oCommons.getXCSRFToken());
        xhr.onload = function() {
            if (this.status === 200) {
                // call the callback
                if (fnCallback) {
                    fnCallback(this.response);
                }
            } else {
                jQuery.sap.require("sap.ui.commons.MessageBox");
                sap.ui.commons.MessageBox.show(oTextBundle.getText("Commons_FailedCallBackend"), sap.ui.commons.MessageBox.Icon.ERROR, "Error");
            }
        };
        xhr.setRequestHeader('Content-type', 'application/json');
        xhr.send(JSON.stringify(oQuery));
    },

    init : function() {
        this.relatedIndicatorsODataModelSet = false;

        var oDataModel;
        sap.secmon.ui.m.commons.EtdComponent.prototype.init.apply(this, arguments);

        // Create and set domain model to the component
        this.setDefaultODataModel("semanticEventsConfig");
        this.setModel(new sap.ui.model.json.JSONModel(), "currentSemanticEvent");
        oDataModel = this.getModel();
        oDataModel.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
        this.oRouteMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter());

        //
        var oAttributeMappingModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oAttributeMappingModel, "AttributeMappingModel");

        oAttributeMappingModel.loadData("/sap/secmon/ui/m/semanticEventFS/attributes.json", null, false);

        var aaData = oAttributeMappingModel.getData();
        for ( var sKey in aaData) {
            if (!this._aaNameKeyMap[aaData[sKey].name]) { // There exist TWO Timestamps!
                this._aaNameKeyMap[aaData[sKey].name] = sKey;
            }
        }
    },

    onComponentReady : function() {
        this.setupRouting();
        this.getRouter().initialize();
    },

    setupRouting : function() {
        var that = this;
        this.getRouter().attachRouteMatched(function(oEvent) {
            var oView = oEvent.mParameters.view;
            var oController = oView.getController();
            if (oEvent.getParameter("name") === "semanticEvent") {
                var semanticEventId = oEvent.getParameters().arguments.id;
                oController.bindSemanticEvent(that.getModel(), semanticEventId, this.navigateToSemanticEvent);
            }
            // set related indicators model if the user selects the related indicators link
            var oQueryParam = oEvent.getParameters().arguments["?query"];
            if (!this.relatedIndicatorsODataModelSet && oQueryParam && oQueryParam.relIndicator === "true") {
                this.relatedIndicatorsODataModelSet = true;
                this.setODataModel("relatedIndicatorsConfig");
            }
        }, this);
    },

    navigateToSemanticEvent : function(semanticEventId) {
        this.getRouter().navTo("semanticEvent", {
            id : semanticEventId,
        }, false);
    },

    onAfterRendering : function() {
        // set FS mode on desktop if the requirements are met
        if (this.oContainer) {
            var oParent = (this.oContainer.getParent ? this.oContainer.getParent() : null);
            if (oParent) {
                oParent = (oParent.getParent ? oParent.getParent() : null);

                if (oParent.setAppWidthLimited) {
                    oParent.setAppWidthLimited(!sap.ui.Device.system.desktop);
                }
            }

        }
    },

    setContainer : function(oContainer) {
        // remember container for FS mode
        this.oContainer = oContainer;
        sap.secmon.ui.m.commons.EtdComponent.prototype.setContainer.apply(this, arguments);
    }

});
