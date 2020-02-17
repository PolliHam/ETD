jQuery.sap.require("sap.ui.comp.personalization.Controller");
jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");
jQuery.sap.require("sap.secmon.ui.m.commons.BookmarkCreator");
jQuery.sap.require("sap.secmon.ui.m.commons.TileURLUtils");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.util.OnSapEnterEnhancer");
jQuery.sap.require("sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper");
jQuery.sap.require("sap.secmon.ui.m.semanticEventViewer.util.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
jQuery.sap.require("sap.secmon.ui.m.semanticEventFS.utils.ControllerHelper");
jQuery.sap.require("sap.secmon.ui.m.semanticEventFS.view.SuggestionHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.SortableColumn");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.secmon.ui.m.commons.InvestigationAddendum");

jQuery.sap.require("sap.secmon.ui.browse.utils");
jQuery.sap.require("sap.secmon.ui.m.commons.semanticEvents.LogDetailHelper");

jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/FilterBarWithSameSizedItems.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/DateTimeTable.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ClickableElementStyle.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.semanticEventFS.view.SemanticEvents", {

    ROUTES : {
        MAIN : "main",

        hasRoute : function(sRoute) {
            for ( var prop in this) {
                if (this[prop] === sRoute) {
                    return true;
                }
            }
            return false;
        }
    },

    selectedId : null,

    // Save the selected log entry in the master table
    // will be updated in method handleSelect
    lastSelectedObject : undefined,
    promise4OriginalData : undefined,
    logDetail : undefined,

    constructor : function() {
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        sap.secmon.ui.m.commons.EtdController.apply(this, arguments);
    },

    onInit : function() {
        this.getDateTimeSelectionDialog();
        this.setRouteName(this.ROUTES.MAIN);
        this.oBookmarkCreator = new sap.secmon.ui.m.commons.BookmarkCreator();
        this.oQueryParameters = {};
        this.oInvestigationAddendum = new sap.secmon.ui.m.commons.InvestigationAddendum();
        var langModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/m/commons/semanticEvents/i18n/UIText.hdbtextbundle"
        });
        this.model = this.getComponent().getModel();
        this.getView().setModel(langModel, "lang");
        var uiModel = new sap.ui.model.json.JSONModel({
            userExpanded : false,
            userCollapsed : true,
            systemExpanded : false,
            systemCollapsed : true,
            serviceExpanded : false,
            serviceCollapsed : true,

            // fields selected for OData service $select property
            selectedFields : [ "Id",
            // General
            "Timestamp", "EventSemantic", "EventLogType",
            // User
            "UserPseudonymInitiating", "UserPseudonymActing", "UserPseudonymTargeting", "UserPseudonymTargeted",
            // SystemId
            "SystemIdActor", "SystemIdInitiator", "SystemIdIntermediary", "SystemIdReporter", "SystemIdTarget",
            // SystemType
            "SystemTypeActor", "SystemTypeInitiator", "SystemTypeIntermediary", "SystemTypeReporter", "SystemTypeTarget",
            // Service
            "ServiceTransactionName", "ServiceProgramName" ],
        });
        this.getView().setModel(uiModel, "uiModel");
        var oUIModel = new sap.ui.model.json.JSONModel();
        this.getView().setModel(oUIModel, "UIModel");
        this._setRefreshMode("onLogEvents");
        this.controllerHelper = new sap.secmon.ui.m.semanticEventFS.utils.ControllerHelper();
        this.getRouter().attachRouteMatched(this.onRouteMatched, this);

        var oTable = this.getSemanticEventsTable();
        this.enableButtonsIfAtLeastOneRowIsSelected(oTable, [ "addToInvestButton" ]);
        this.enableButtonsIfAtLeastOneRowIsSelected(oTable, [ "addToCaseFile" ]);
        this.UTC = this.getComponent().getModel("applicationContext").getData().UTC;
    },

    onRouteMatched : function(oEvent) {
        // this is needed, because otherwise the table is refreshed
        // after selecting one entry.
        // navTo triggers a roundtrip and enters the query parameter
        // into the URL.
        // But in this case only the URL needs to be adjusted
        if (this.doNotHandleRouteMatching) {
            delete this.doNotHandleRouteMatching;
            return;
        }
        var that = this;
        var routeName = oEvent.getParameter("name");
        this.setRouteName(routeName);
        if (!this.ROUTES.hasRoute(routeName)) {
            return;
        }

        var oArguments = oEvent.getParameter("arguments"), params = oArguments["?query"] || {};

        if (Object.keys(params).length === 0) {
            var oNewQueryParams = {
                orderBy : "Timestamp",
                orderDesc : true
            };
            oNewQueryParams = jQuery.extend(true, this.getDefaultSelectionTimeRange(), oNewQueryParams);
            this.oQueryParameters = oNewQueryParams;

            this.navTo(this.getRouteName(), {
                query : oNewQueryParams
            }, true);
        } else {
            var oFilteredParams = {}, oDecodedParams = {};
            Object.keys(params).forEach(function(key) {
                if (!jQuery.sap.startsWith(key, "time")) {
                    if (key === "selectedEvent") {
                        that.selectedId = params[key];
                    } else {
                        oFilteredParams[key] = params[key];
                    }
                } else {
                    oDecodedParams[key] = decodeURIComponent(params[key]);
                }
            });

            // If related indicators link selected
            if (oFilteredParams.relIndicator === "true") {
                this.isRelIndicatorsLinkSelected = true;
                // Do not show columns "EventSemantic" and "EventLogType" in the table
                this.getSemanticEventsTable().getColumns()[1].setVisible(false);
                this.getSemanticEventsTable().getColumns()[3].setVisible(false);
                // Show columns "EventMessage" and "EventSourceId" in the table
                this.getSemanticEventsTable().getColumns()[32].setVisible(true);
                this.getSemanticEventsTable().getColumns()[36].setVisible(true);
            }

            this.getDateTimeHandler().selectFromObject(oDecodedParams);
            var dateTimeFilter = this.getCurrentDateTimeFilter();

            var aFilters = [];
            if (dateTimeFilter && dateTimeFilter.filters && dateTimeFilter.filters.length > 0) {
                aFilters = aFilters.concat(dateTimeFilter.filters);

                var aTimeRange = this.getDateTimeHandler().getTimeRangeUnderConsideration();
                var sNewTitle = this._getDateTimeTextFromTimeRange(aTimeRange);

                this.byId("timeRangeLabelInToolbarOfEventsTable").setText(sNewTitle);
            }
            aFilters = aFilters.concat(this.buildFiltersOf(oFilteredParams));
            this.applyFiltersToFilterBar(aFilters);
            this.oQueryParameters = params;

            var oSorter = this.buildSorterOf(oFilteredParams);

            this.applyFiltersAndSorter({
                filters : aFilters,
                sorter : oSorter
            });

            if (this.selectedId !== undefined && this.selectedId !== null) {
                var selectedIdbase64 = this.oCommons.hexToBase64(this.selectedId);
                var table = this.getView().byId("semanticEventsTable");
                table.attachEventOnce("updateFinished", function() {
                    var oItems = this.getItems();
                    oItems.some(function(item) {
                        if (item.getBindingContext().getObject().Id === selectedIdbase64) {
                            table.setSelectedItemById(item.getId());
                            table.fireItemPress({
                                listItem : item,
                                srcControl : table
                            });
                            return true;

                        } else {
                            return false;
                        }
                    });
                });
            }
        }
    },

    getDefaultSelectionTimeRange : function() {
        return {
            timeSelectionType : "relative",
            timeLast : "1",
            timeType : "minutes"
        };
    },

    applyFiltersAndSorter : function(oFiltersAndSorter) {
        var deferred = new $.Deferred();

        var aFilters = oFiltersAndSorter.filters || this.aFilters || [];
        var oSorter = oFiltersAndSorter.sorter;

        var oTemplate = this.controllerHelper.getTemplate();
        var oTable = this.getSemanticEventsTable();

        var uiModel = this.getView().getModel("uiModel");
        var relatedIndicatorsSelectedFields = this.getRelatedIndicatorsFields();

        // Select service for related events or indicators, depending on chosen link
        if (!this.isRelIndicatorsLinkSelected) {
            this.getComponent().callPseudoODataService(function(queryId) {
                var aQueryIdFilters = [];
                aQueryIdFilters.push(new sap.ui.model.Filter({
                    path : 'Id',
                    operator : sap.ui.model.FilterOperator.EQ,
                    value1 : queryId
                }));

                oTable.bindItems({
                    path : "/NormalizedLog",
                    template : oTemplate,
                    sorter : oSorter,
                    filters : aQueryIdFilters,
                    parameters : {
                        select : uiModel.getProperty("/selectedFields").toString(), // ;that.selectedFields.toString()
                    }
                });

                // Won't show the number of events since we won't fetch the count due to performance

                // binding.attachDataReceived(function() {
                // var sFormat = that.getText("SemanticEventsCountLbl");
                // var sNewTitle = sap.secmon.ui.commons.Formatter.i18nText(sFormat, binding.getLength());
                // that.getView().byId("toolbarOfEventsTable").setText(sNewTitle);
                // deferred.resolve();
                // });
            }, aFilters);
        } else {
            $.ajax({
                url : "/sap/secmon/services/RelatedIndicators.xsodata",
                type : "GET",
                success : function() {
                    oTable.bindItems({
                        path : "/IndicatorsWithUserPseudonyms",
                        template : oTemplate,
                        sorter : oSorter,
                        filters : aFilters,
                        parameters : {
                            select : relatedIndicatorsSelectedFields.toString(),
                        }
                    });
                },
                error : function(request, status, error) {
                    deferred.reject();
                }
            });
        }

        this.aFilters = aFilters;
        return deferred;
    },

    getRelatedIndicatorsFields : function() {

        // fields selected for OData service $select property
        var selectedFields = [ "Id",
        // General
        "Timestamp", "TechnicalTimestampOfInsertion",
        // Event
        "EventMessage", "EventScenarioRoleOfActor", "EventScenarioRoleOfInitiator", "EventSourceId",
        // Generic
        "GenericExplanation",
        // Network
        "NetworkHostnameActor", "NetworkHostnameInitiator", "NetworkHostnameIntermediary", "NetworkHostnameReporter", "NetworkHostnameTarget",
        // Network IP
        "NetworkIPAddressActor", "NetworkIPAddressInitiator", "NetworkIPAddressIntermediary", "NetworkIPAddressReporter", "NetworkIPAddressTarget",
        // Resource
        "ResourceName", "ResourceType", "ResourceSumCriteria", "ResourceSumOverTime",
        // User
        "UserPseudonymInitiating", "UserPseudonymActing", "UserPseudonymTargeting", "UserPseudonymTargeted",
        // Service
        "ServiceFunctionName",
        // SystemId
        "SystemIdActor", "SystemIdInitiator", "SystemIdIntermediary", "SystemIdReporter", "SystemIdTarget" ];

        return selectedFields;
    },

    setRouteName : function(sRouteName) {
        this.routeName = sRouteName;
    },

    getRouteName : function() {
        return this.routeName;
    },

    navTo : function(sRouteName, oParameters, bNoEntryInBrowserHistory) {
        // URL must be encoded to the RFC standard
        for ( var p in oParameters.query) {
            if (oParameters.query.hasOwnProperty(p)) {
                oParameters.query[p] = encodeURIComponent(oParameters.query[p]);
            }
        }
        this.getRouter().navTo(sRouteName, oParameters, bNoEntryInBrowserHistory);
    },

    forEachMetadataProperty : function(fnFilter, fnAbort) {
        var oMetadata = this.getODataMetadata();

        var bAbort = false;
        var i, j, k;
        var oSchema, oEntityType, oProperty;

        for (i = 0; i < oMetadata.dataServices.schema.length && !bAbort; i++) {
            oSchema = oMetadata.dataServices.schema[i];

            for (j = 0; j < oSchema.entityType.length && !bAbort; j++) {
                oEntityType = oSchema.entityType[j];

                if ("LogEventsType,NormalizedLogType,IndicatorsWithUserPseudonymsType".indexOf(oEntityType.name) >= 0) {
                    for (k = 0; k < oEntityType.property.length && !bAbort; k++) {
                        oProperty = oEntityType.property[k];

                        fnFilter.call(this, oProperty);

                        if (fnAbort) {
                            bAbort = fnAbort.call(this);
                        }
                    }
                }
            }
        }
    },

    getFilterBar : function() {
        return this.getView().byId("vsdFilterBar");
    },

    showFilterBar : function(visible) {
        this.getFilterBar().setVisible(visible);
    },

    getFilterBarText : function() {
        return (this.getFilterBar().getVisible() ? this.getView().byId("vsdFilterLabel").getText() : "");
    },

    setFilterBarText : function(text) {
        this.getView().byId("vsdFilterLabel").setText(text);
    },

    getFilterInputIdsOfFilterBar : function() {
        return this.controllerHelper.getFilterInputIdsOfFilterBar();
    },

    getFilterBarSelectionAsObject : function() {
        var oSelectionAsObject = {};

        this.getFilterInputIdsOfFilterBar().forEach(function(sFilterInputId) {
            var oFilterInput = this.getView().byId(sFilterInputId);
            var sValue = oFilterInput.getValue();
            var i = 0, j = 0, aTokens = [];
            if (sValue && sValue.length > 0) {
                for (i = 0; i < oFilterInput.getCustomData().length; i++) {
                    if (oFilterInput.getCustomData()[i].getKey() === "urlParamName") {
                        if (oFilterInput.getTokens) {
                            // the getTokens logic is needed to enable search
                            // for multiple values even if you "press enter" to
                            // enter a substring value token to the filter
                            aTokens = oFilterInput.getTokens();
                            for (j = 0; j < aTokens.length; j++) {
                                if (j === 0) {
                                    oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()] = aTokens[j].getKey();
                                } else {
                                    oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()] = oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()] + ",," + aTokens[j].getKey();
                                }
                            }
                        }
                        if (oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()] && oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()].length > 0) {
                            oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()] = oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()] + ",," + sValue;
                        } else {
                            oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()] = sValue;
                        }
                    }
                }
            } else if (oFilterInput.getTokens) {
                for (i = 0; i < oFilterInput.getCustomData().length; i++) {
                    if (oFilterInput.getCustomData()[i].getKey() === "urlParamName") {
                        aTokens = oFilterInput.getTokens();
                        for (j = 0; j < aTokens.length; j++) {
                            if (j === 0) {
                                oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()] = aTokens[j].getKey();
                            } else {
                                oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()] = oSelectionAsObject[oFilterInput.getCustomData()[i].getValue()] + ",," + aTokens[j].getKey();
                            }
                        }
                    }
                }

            }
        }, this);

        return oSelectionAsObject;
    },

    applyFiltersToFilterBar : function(aFilters) {
        var aFilterInputIds = this.getFilterInputIdsOfFilterBar();

        var mFilterInputToFilterValue = {};
        var mFilterInputToI18NKey = {};
        var aVisibleFilterGroupItemIds = [];
        function addText(sCurrentFilterInputId, oCustomData) {
            if (oCustomData.getKey() === "i18nText") {
                mFilterInputToI18NKey[sCurrentFilterInputId] = oCustomData.getValue();
            } else if (oCustomData.getKey() === "filterItem") {
                aVisibleFilterGroupItemIds.push(oCustomData.getValue());
            }
        }
        aFilters.forEach(function(oFilter) {
            var aSubFilters = [];
            if (oFilter.aFilters === undefined) {
                aSubFilters.push(oFilter);
            } else {
                aSubFilters = oFilter.aFilters;
            }
            aSubFilters.forEach(function(oFilter) {
                var sPath = oFilter.etdRawPathAndValue ? oFilter.etdRawPathAndValue.path : oFilter.sPath;

                if (!sPath) {
                    return;
                }

                var oCurrentFilterInput;
                var sCurrentFilterInputId;
                var bFilterInputUsable;
                var i, j;

                for (i = 0; i < aFilterInputIds.length; i++) {
                    sCurrentFilterInputId = aFilterInputIds[i];
                    oCurrentFilterInput = this.byId(sCurrentFilterInputId);
                    bFilterInputUsable = false;

                    var addTextFilterId = addText.bind(undefined, sCurrentFilterInputId);
                    if (oCurrentFilterInput) {
                        for (j = 0; j < oCurrentFilterInput.getCustomData().length; j++) {
                            if (oCurrentFilterInput.getCustomData()[j].getKey() === "urlParamName") {
                                if (oCurrentFilterInput.getCustomData()[j].getValue() === sPath) {
                                    var aFilterValueIds = mFilterInputToFilterValue[sCurrentFilterInputId];
                                    if (!aFilterValueIds) {
                                        aFilterValueIds = [];
                                        mFilterInputToFilterValue[sCurrentFilterInputId] = aFilterValueIds;
                                    }

                                    if (oFilter.oValue1) {
                                        aFilterValueIds.push(oFilter.oValue1);
                                    } else /* role independent search: */
                                    {
                                        aFilterValueIds.push(oFilter.aFilters[0].oValue1);
                                    }

                                    bFilterInputUsable = true;
                                    break;

                                }
                            }
                        }

                        if (bFilterInputUsable) {
                            oCurrentFilterInput.getCustomData().forEach(addTextFilterId);
                        }
                    }
                }
            }, this);
        }, this);

        // initial visibility of advanced area
        if (!this.filterBarInitialized) {
            aVisibleFilterGroupItemIds.forEach(function(sFilterGroupItemId) {
                this.byId(sFilterGroupItemId).setVisibleInAdvancedArea(true);
            }, this);

            if (aVisibleFilterGroupItemIds.length > 0) {
                this.byId("filterBar").setExpandAdvancedArea(true);
            }

            this.filterBarInitialized = true;
        }

        Object.keys(mFilterInputToFilterValue).forEach(function(sFilterInputId) {
            var oCurrentFilterInput = this.byId(sFilterInputId);

            var sField;
            oCurrentFilterInput.getCustomData().some(function(oField) {
                if (oField.mProperties.key === "urlParamName") {
                    sField = oField.mProperties.value;
                    return true;
                }
            });

            if (oCurrentFilterInput.setSelectedKeys) {
                oCurrentFilterInput.setSelectedKeys(mFilterInputToFilterValue[sFilterInputId]);
            } else if (oCurrentFilterInput.setTokens) {
                var aNewTokens = [];
                mFilterInputToFilterValue[sFilterInputId].forEach(function(value) {
                    // Value needs to be set this way because of e.g.
                    // Transaction Name "{SRALCONFIG"
                    var oToken = new sap.m.Token();
                    var normalizedValue = value;
                    /* eliminate 'tolower' from value, don't want it in token */
                    if (value.search("tolower") !== -1) {
                        normalizedValue = value.slice(9, value.length - 2);
                    }
                    oToken.setKey(normalizedValue);
                    oToken.setText(normalizedValue);
                    aNewTokens.push(oToken);
                });
                oCurrentFilterInput.setValue("");
                oCurrentFilterInput.destroyTokens();
                oCurrentFilterInput.setTokens(aNewTokens);
            }
        }, this);

        var sText = this.getText("FilterBarPrefix").concat(" ");

        Object.keys(mFilterInputToFilterValue).forEach(function(sFilterInputId, nIndex) {
            if (nIndex > 0) {
                sText += ", ";
            }

            var sFilterString = "";
            var oFilterInput = this.byId(sFilterInputId);
            if (oFilterInput.getSelectedItems) {
                oFilterInput.getSelectedItems().forEach(function(oSelectedItem, nIndex) {
                    if (nIndex > 0) {
                        sFilterString += ", ";
                    }
                    sFilterString += oSelectedItem.getText();
                });
            } else if (oFilterInput.getTokens) {
                oFilterInput.getTokens().forEach(function(oToken, nIndex) {
                    if (nIndex > 0) {
                        sFilterString += ", ";
                    }
                    sFilterString += oToken.getText();
                });
            } else {
                sFilterString = this.byId(sFilterInputId).getValue();
            }

            sText += mFilterInputToI18NKey[sFilterInputId] + " (" + sFilterString + ")";
        }, this);

        this.setFilterBarText(sText);
        this.showFilterBar(Object.keys(mFilterInputToFilterValue).length > 0);
    },

    buildSorterOf : function(oParams) {
        var oSorter;

        var orderBy = oParams.orderBy;
        var orderDesc = true;

        if ("orderDesc" in oParams) {
            orderDesc = (oParams.orderDesc === "true");
        }

        var bSorterCorrect = false;

        this.forEachMetadataProperty(function(oProperty) {
            if (oProperty.name === orderBy) {
                bSorterCorrect = true;
            }
        }, function() {
            return bSorterCorrect;
        });

        if (bSorterCorrect) {
            orderBy = oParams.orderBy;
        } else {
            orderBy = "Timestamp";
            orderDesc = true;
        }
        oSorter = new sap.ui.model.Sorter(orderBy, orderDesc);

        this.getSemanticEventsTable().getColumns().forEach(function(oColumn) {
            if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                if (oColumn.getSortProperty() === orderBy) {
                    oColumn.setSorted(true);
                    oColumn.setSortOrder(orderDesc ? sap.secmon.ui.m.commons.controls.SortOrder.Descending : sap.secmon.ui.m.commons.controls.SortOrder.Ascending);
                } else {
                    oColumn.setSorted(false);
                }
            }
        });

        return oSorter;
    },

    buildFiltersOf : function(oParams) {
        var aFilters = [];
        /* check for role-independent search: */
        var genUserReq = "UserPseudonym" in oParams;
        var genSystemReq = "SystemId" in oParams;
        var operator = sap.ui.model.FilterOperator.Contains;

        var propName;

        var aRoleColumns = [];

        function createFilter(fOperator, propName, aColumns) {
            var aSingleFilters = [];
            var singleFilter, aSubFilters = [], path, value, toLowerPath, toLowerValue;
            value = decodeURIComponent(oParams[propName]);
            var aValues = value.split(",,");
            var oFilter;
            function addFilter(sColumn) {
                toLowerPath = 'tolower(' + sColumn + ')';
                singleFilter = new sap.ui.model.Filter(toLowerPath, fOperator, toLowerValue);
                aSingleFilters.push(singleFilter);
            }
            for (var i = 0; i < aValues.length; i++) {
                aSingleFilters = [];
                path = propName;

                value = decodeURIComponent(aValues[i]);
                toLowerValue = value;
                if (value.search("tolower") === -1) {
                    toLowerValue = "tolower('" + value + "')";
                }
                if (aColumns) {
                    aColumns.forEach(addFilter);
                    /* 'false' = 'or': */
                    oFilter = new sap.ui.model.Filter(aSingleFilters, false);
                } else {
                    toLowerPath = 'tolower(' + propName + ')';
                    oFilter = new sap.ui.model.Filter({
                        path : toLowerPath,
                        operator : fOperator,
                        value1 : toLowerValue
                    });
                }
                oFilter.etdRawPathAndValue = {
                    path : path,
                    value : value
                };
                aSubFilters.push(oFilter);
            }
            oFilter = new sap.ui.model.Filter(aSubFilters, false);
            aFilters.push(oFilter);
        }

        if (genUserReq) {
            propName = "UserPseudonym";
            aRoleColumns.push("UserPseudonymActing");
            aRoleColumns.push("UserPseudonymInitiating");
            aRoleColumns.push("UserPseudonymTargeting");
            aRoleColumns.push("UserPseudonymTargeted");

            createFilter(operator, propName, aRoleColumns);
        }

        if (genSystemReq) {
            propName = "SystemId";
            aRoleColumns = [];
            aRoleColumns.push("SystemIdActor");
            aRoleColumns.push("SystemIdInitiator");
            aRoleColumns.push("SystemIdIntermediary");
            aRoleColumns.push("SystemIdReporter");
            aRoleColumns.push("SystemIdTarget");

            createFilter(operator, propName, aRoleColumns);
        }

        this.forEachMetadataProperty(function(oProperty) {
            operator = sap.ui.model.FilterOperator.EQ;
            if (oProperty.type === 'Edm.String') {
                operator = sap.ui.model.FilterOperator.Contains;
            }
            propName = (oProperty.name in oParams) ? oProperty.name : undefined;

            if (propName) {
                createFilter(operator, propName);
            }
        });

        return aFilters;
    },

    getODataMetadata : function() {
        if (!this.oODataMetadata) {
            this.oODataMetadata = this.getComponent().getModel().getServiceMetadata();
        }

        return this.oODataMetadata;
    },

    onApplyTimeFilter : function() {
        this.dateTimeFilter = this._retrieveDateTimeFilter(true);

        if (this.dateTimeFilter) {
            this.lastActiveDateTimeSelection = this.getDateTimeHandler().getSelectionAsObject();
            this.getDateTimeHandler().reset();
            this.getDateTimeHandler().selectFromObject(this.lastActiveDateTimeSelection);

            this.getDateTimeSelectionDialog().close();
        }
    },

    onCloseTimeFilterDialog : function() {
        if (this.lastActiveDateTimeSelection) {
            this.getDateTimeHandler().reset();
            this.getDateTimeHandler().selectFromObject(this.lastActiveDateTimeSelection);
        }
        this.getDateTimeSelectionDialog().close();
    },

    onShowDateTimeDialog : function() {
        this.lastActiveDateTimeSelection = this.getDateTimeHandler().getSelectionAsObject();
        this.getDateTimeSelectionDialog().open();
    },

    _getDateTimeTextFromTimeRange : function(aTimeRange, bForFilterBar) {
        var sFormat;
        var sNewTitle;

        if (!bForFilterBar || !this.getDateTimeHandler().isRelative()) {
            if (aTimeRange.length === 2) {
                sFormat = this.getCommonText("ConsTimeRangeFT_LBL");
                sNewTitle = sap.secmon.ui.commons.Formatter.timeRangeFormatterEx(this.UTC, sFormat, aTimeRange[0], aTimeRange[1]);
            } else {
                sFormat = this.getCommonText("ConsTimeRangeFR_LBL");
                sNewTitle = this.i18nText(sFormat, sap.secmon.ui.commons.Formatter.dateFormatterEx(this.UTC, aTimeRange[0]));
            }
        } else {
            switch (this.getDateTimeHandler().getRelativeTimeUnit()) {
            case "minutes":
                sFormat = this.getCommonText("TimeRange_LastM_LBL");
                break;
            case "hours":
                sFormat = this.getCommonText("TimeRange_LastH_LBL");
                break;
            case "days":
                sFormat = this.getCommonText("TimeRange_LastD_LBL");
                break;
            }

            if (sFormat) {
                sNewTitle = this.i18nText(sFormat, this.getDateTimeHandler().getRelativeTimeInput());
            }
        }

        return sNewTitle;
    },

    getDateTimeSelectionDialog : function() {
        if (!this.dateTimeDialog) {
            this.dateTimeDialog = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionDialog", this);
            this.getView().addDependent(this.dateTimeDialog);
        }
        // toggle compact style
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.dateTimeDialog);

        return this.dateTimeDialog;
    },

    getDateTimeHandler : function() {
        if (!this.dateTimeHandler) {
            this.dateTimeHandler = new sap.secmon.ui.m.commons.dateTimeSelection.DateTimeSelectionHelper(this.getView());
        }

        return this.dateTimeHandler;
    },

    getCurrentDateTimeFilter : function(bActive) {
        if (this.dateTimeDirty === undefined || this.dateTimeDirty === true) {
            this.dateTimeFilter = this._retrieveDateTimeFilter(bActive);
            this.dateTimeDirty = false;
        }
        return this.dateTimeFilter;
    },

    _retrieveDateTimeFilter : function(bActive) {
        var aTimeRange = this.getDateTimeHandler().getTimeRangeUnderConsideration();
        if (aTimeRange) {
            var oFilter;

            var sNewTitle = this._getDateTimeTextFromTimeRange(aTimeRange, true);

            if (aTimeRange.length === 2) {
                oFilter = new sap.ui.model.Filter({
                    path : "Timestamp",
                    operator : sap.ui.model.FilterOperator.BT,
                    value1 : aTimeRange[0],
                    value2 : aTimeRange[1]
                });
            } else {
                oFilter = new sap.ui.model.Filter({
                    path : "Timestamp",
                    operator : sap.ui.model.FilterOperator.BT,
                    value1 : aTimeRange[0],
                    value2 : new Date()
                });
            }

            this.getView().byId("dateTimeFilterInput").setValue(sNewTitle);

            return {
                filters : [ oFilter ]
            };
        } else {
            if (bActive) {
                sap.m.MessageBox.alert(this.getCommonText("InvalidRange_MSG"), {
                    styleClass : !sap.ui.Device.phone ? "sapUiSizeCompact" : "",
                    title : this.getCommonText("Error_TIT")
                });
            } else {
                this.getView().byId("dateTimeFilterInput").setValue("");
            }

            return null;
        }
    },

    handleSort : function(oEvent) {
        this.showDetail(false);

        var oParameters = oEvent.getParameters();
        var oSortedColumn = oParameters.column;
        var sortOrder = oParameters.sortOrder;

        var sSortProperty = oSortedColumn.getSortProperty();
        var bSortDesc = (sortOrder === sap.secmon.ui.m.commons.controls.SortOrder.Descending);

        this.getSemanticEventsTable().getColumns().forEach(function(oColumn) {
            if (oColumn !== oSortedColumn) {
                if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                    oColumn.setSorted(false);
                }
            }
        });
        oSortedColumn.setSorted(true);
        oSortedColumn.setSortOrder(sortOrder);

        var oSorter = new sap.ui.model.Sorter(sSortProperty, bSortDesc);
        var oScroller = this.getTableScrollContainer()._oScroller;
        var x = oScroller ? oScroller._scrollX : undefined;
        var y = oScroller ? oScroller._scrollY : undefined;

        this.applyFiltersAndSorter({
            sorter : oSorter
        }).then(function() {
            if (x !== undefined && y !== undefined) {
                oScroller.scrollTo(x, y);
            }
        });
    },

    onItemSuggest : function(oEvent) {
        sap.secmon.ui.m.semanticEventFS.view.SuggestionHelper.handleSuggest.call(this, oEvent);
    },

    handleAddToCaseFile : function(oEvent) {
        if (!this._oCaseFilesDialog) {
            this._oCaseFilesDialog = sap.ui.xmlfragment("CaseFilesDialog", "sap.secmon.ui.sherlock.view.CaseFilesDialog", this);
            this.getView().addDependent(this._oCaseFilesDialog);
            this._oCaseFilesDialog.getContent()[0].oController._setRefreshMode("onLogEvents");
            // toggle compact style
            jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oCaseFilesDialog);
        }
        this._oCaseFilesDialog.open();
    },

    onCloseCaseFile : function() {
        this._oCaseFilesDialog.close();
    },

    onAddAndShow : function(oEvent, bReturnToLogEvents) {
        var C_CF_DML_PATH = "/sap/secmon/services/malimon/malimonDML.xsjs";
        var aSelectedItems = this._oCaseFilesDialog.getContent()[0].getModel("CaseFileList").getProperty("/selectedItems");
        aSelectedItems.forEach(function(oItem) {
            var oCaseFileData = this._formatCaseFileData(oItem);
            sap.secmon.ui.browse.utils.postJSon(C_CF_DML_PATH, JSON.stringify(oCaseFileData)).then(function(response) {
                if (!bReturnToLogEvents) {
                    var href = sap.secmon.ui.m.commons.NavigationService.getLaunchpadUrl() + "#CaseFile-show&/CaseFile/" + response.caseFileId;
                    window.open(href, '_blank');
                }
            });
        }.bind(this));
        if (bReturnToLogEvents) {
            this._oCaseFilesDialog.close();
        }
    },

    onAddAndReturn : function(oEvent) {
        this.onAddAndShow(oEvent, true);
    },

    _formatCaseFileData : function(oEvent) {
        var aSelectedEvents = this.getView().byId("semanticEventsTable").getSelectedItems();
        var oCaseFileData = {
            caseFileId : sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(oEvent.Id),
            comments : oEvent.Comments || [],
            createdAt : oEvent.CreatedAt,
            createdBy : oEvent.CreatedBy,
            details : this._formatDetailsObjects(aSelectedEvents),
            details2del : [],
            name : oEvent.Name,
            namespace : oEvent.Namespace,
            operation : "update"
        };
        return oCaseFileData;
    },

    _formatDetailsObjects : function(oEvents) {
        return oEvents.map(function(oEvent) {
            var oEventData = oEvent.getBindingContext().getObject();
            return {
                comments : [],
                description : oEventData.EventSemantic,
                objectId : oEventData.Id,
                objectTimestamp : oEventData.Timestamp,
                objectType : "EVENT"
            };
        });
    },

    _setRefreshMode : function(oMode) {
        this.mode = oMode;
        var oUIModelData = this.getView().getModel("UIModel").getData();
        switch (this.mode) {
        case 'none':
        case 'onSherlog':
            oUIModelData.backButtonVisible = false;
            oUIModelData.deleteButtonVisible = false;
            oUIModelData.addButtonVisible = true;
            oUIModelData.columnItemsType = "Inactive";
            break;
        case 'onLogEvents':
            oUIModelData.backButtonVisible = false;
            oUIModelData.deleteButtonVisible = false;
            oUIModelData.addButtonVisible = true;
            oUIModelData.columnItemsType = "Inactive";
            break;
        }
        this.getView().getModel("UIModel").setData(oUIModelData);
    },

    handleSuggestionItemSelected : function(oEvent) {
        sap.secmon.ui.m.semanticEventFS.view.SuggestionHelper.handleSuggestionItemSelected.call(this, oEvent);
    },
    handleAddToInvestigationPressed : function(oEvent) {
        var oTable = this.getSemanticEventsTable();
        var oModel = oTable.getModel();
        var aSelectedObjects = oTable.getSelectedContextPaths().map(function(sPath) {
            return {
                ObjectType : 'EVENT',
                ObjectId : oModel.getProperty(sPath).Id
            };
        });
        if (!aSelectedObjects || aSelectedObjects.length === 0) {
            return;
        }

        this.oInvestigationAddendum.showGeneralInvestigationAddendumDialog(aSelectedObjects, this.getView(), function() {
        }, this.oCommons.getXCSRFToken);
    },
    onClear : function() {
        var oNewQueryParameters = {};

        this.getSemanticEventsTable().getColumns().forEach(function(oColumn) {
            if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn && oColumn.getSorted() === true) {
                oNewQueryParameters.orderBy = oColumn.getSortProperty();
                oNewQueryParameters.orderDesc = (oColumn.getSortOrder() === sap.secmon.ui.m.commons.controls.SortOrder.Descending);
            }
        });
        this.showDetail(false);

        this.dateTimeDirty = true;
        var oSelectionAsObject = this.getDefaultSelectionTimeRange();
        Object.keys(oSelectionAsObject).forEach(function(key) {
            oSelectionAsObject[key] = encodeURIComponent(oSelectionAsObject[key]);
        });
        oNewQueryParameters = $.extend(true, oNewQueryParameters, oSelectionAsObject);

        // The router has a "feature" not to dispatch to event handlers
        // if
        // neither route nor query parameters have changed.
        // In order to force navigation, we add a parameter with new
        // value each
        // time.
        oNewQueryParameters.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

        this.navTo(this.getRouteName(), {
            query : oNewQueryParameters
        }, true);
    },
    onAnomalyClicked : function(oEvent) {
        var context = oEvent.getSource().getBindingContext();
        var id = null;
        if (context) {
            id = context.getModel().getProperty(context.getPath() + "/CorrelationId");
            if (id) {
                sap.secmon.ui.m.commons.NavigationService.openAnomalyDetail(id);
            }
        }
    },

    onSearch : function(oEvent) {
        // Force the date time filters to be read from the date time
        // control, no
        // cached data allowed.
        this.dateTimeDirty = true;
        var dateTimeFilter = this.getCurrentDateTimeFilter(true);

        if (dateTimeFilter) {
            var oSelectionAsObject = this.getDateTimeHandler().getSelectionAsObject();
            Object.keys(oSelectionAsObject).forEach(function(key) {
                oSelectionAsObject[key] = encodeURIComponent(oSelectionAsObject[key]);
            });
            var oSelectionFromFilterBar = this.getFilterBarSelectionAsObject();
            Object.keys(oSelectionFromFilterBar).forEach(function(sKey) {
                oSelectionFromFilterBar[sKey] = encodeURIComponent(oSelectionFromFilterBar[sKey]);
            });
            oSelectionAsObject = $.extend(true, oSelectionAsObject, oSelectionFromFilterBar);

            this.getSemanticEventsTable().getColumns().forEach(function(oColumn) {
                if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn && oColumn.getSorted() === true) {
                    oSelectionAsObject.orderBy = oColumn.getSortProperty();
                    oSelectionAsObject.orderDesc = (oColumn.getSortOrder() === sap.secmon.ui.m.commons.controls.SortOrder.Descending);
                }
            });
            this.showDetail(false);

            // Attach timestamp to force refresh of UI
            oSelectionAsObject.lastNav = this.oCommons.formatDateToYyyymmddhhmmssUTC(new Date());

            this.oQueryParameters = oSelectionAsObject;
            this.getRouter().navTo(this.ROUTES.MAIN, {
                query : oSelectionAsObject
            }, true);

        }
    },

    onP13nDialogPress : function(oEvent) {

        // The controller is transient. After the dialog closes it is discarded
        // to prevent any caches. It should retrieve visible columns on each
        // open dialog call.
        var oP13nDialogController = new sap.ui.comp.personalization.Controller({
            table : this.getSemanticEventsTable(),
            resetToInitialTableState : true
        });
        // keep personalization settings and expand/collapse buttons in
        // sync
        oP13nDialogController.attachAfterP13nModelDataChange(this.syncExpandCollapseButtons, this);

        // hide sorting and grouping of p13n dialog
        if (oP13nDialogController._oSettingCurrent) {
            if (oP13nDialogController._oSettingCurrent.sort) {
                oP13nDialogController._oSettingCurrent.sort.visible = false;
            }
            if (oP13nDialogController._oSettingCurrent.group) {
                oP13nDialogController._oSettingCurrent.group.visible = false;
            }
        }
        oP13nDialogController.openDialog();
    },

    getSemanticEventsTable : function() {
        return this.getView().byId("semanticEventsTable");
    },

    getTableScrollContainer : function() {
        return this.getView().byId("tableScrollContainer");
    },

    onNavBack : function() {
        window.history.go(-1);
    },

    onAfterRendering : function() {
        if (!this.handleSapDown) {
            this.handleSapDown = function(e) {
                this.ctrlKey = e.ctrlKey || e.metaKey;
            }.bind(this);

            this.getSemanticEventsTable().attachBrowserEvent("click", this.handleSapDown);
        }

        // 'enter'-event on a filter input triggers a search when the
        // current
        // input is empty (no value for suggestion is available)
        if (!this.filterInputItemsEnhanced) {
            var aFilterInputItems = this.getFilterInputIdsOfFilterBar().map(function(sId) {
                return this.getView().byId(sId);
            }.bind(this));

            sap.secmon.ui.m.util.OnSapEnterEnhancer.enhance(aFilterInputItems, function(sVal) {
                this.onSearch();
            }, this);
            this.filterInputItemsEnhanced = true;
        }
    },

    handleSelect : function(oControlEvent) {
        var oParameters = oControlEvent.getParameters();
        var oSelectedObject = oParameters.listItem.getBindingContext().getObject();
        var bSelected = !!oParameters.listItem, details;
        function unsetBinding() {
            details.setBusy(false);
            details.getModel().detachRequestCompleted(unsetBinding, this);

        }
        if (this.lastSelectedObject && oSelectedObject.Id === this.lastSelectedObject.Id && this.ctrlKey) {
            bSelected = false;
        }
        this.lastSelectedObject = oSelectedObject;

        this.showDetail(bSelected);
        if (bSelected) {
            details = this.getSplitter().getContentAreas()[1];

            // Initial state of the OriginalLog panel should be collapsed, clear up the text
            var oOriginalData = details.getContent()[7];
            oOriginalData.setExpanded(false);
            oOriginalData.getContent()[0].setText("");
            // cancel the backend call & remove busy indicator
            if (this.promise4OriginalData) {
                this.promise4OriginalData.abort();
            }
            oOriginalData.setBusy(false);

            if (this.isRelIndicatorsLinkSelected) {
                details.bindElement(oParameters.listItem.getBindingContext().getPath());
            } else {
                details.bindElement("/" + oParameters.listItem.getBindingContext().getPath(), {
                    expand : "UserPseudonyms,UserPseudonyms/Sentences"
                });
            }

            if (!details.getBindingContext()) {

                details.setBusy(true);
                details.getModel().attachRequestCompleted(unsetBinding, this);

            } else {
                details.setBusy(false);
            }

        } else {
            oControlEvent.getSource().removeSelections();
        }

        this.getComponent().getModel("currentSemanticEvent").setData(bSelected ? oSelectedObject : null);

        var nextSelectedEvent = this.oCommons.base64ToHex(oSelectedObject.Id);
        if (nextSelectedEvent !== this.oQueryParameters.selectedEvent && bSelected === true) {
            // see #onRouteMatched(), only the URL-hash should be
            // adjusted
            this.doNotHandleRouteMatching = true;
            this.oQueryParameters.selectedEvent = nextSelectedEvent;
            this.navTo(this.getRouteName(), {
                query : this.oQueryParameters
            }, true);
        } else if (nextSelectedEvent === this.oQueryParameters.selectedEvent && bSelected === false) {
            delete this.oQueryParameters.selectedEvent;
            this.doNotHandleRouteMatching = true;
            this.navTo(this.getRouteName(), {
                query : this.oQueryParameters
            }, true);
        }

    },

    onExpandServiceColumns : function(oEvent) {
        var model = this.getView().getModel("uiModel");
        var data = model.getData();
        data.serviceExpanded = true;
        data.serviceCollapsed = false;
        model.setData(data);
        this.collapseServiceColumns(false);
    },

    onCollapseServiceColumns : function(oEvent) {
        var model = this.getView().getModel("uiModel");
        var data = model.getData();
        data.serviceExpanded = false;
        data.serviceCollapsed = true;
        model.setData(data);
        this.collapseServiceColumns(true);
    },

    onExpandSystemColumns : function(oEvent) {
        var model = this.getView().getModel("uiModel");
        var data = model.getData();
        data.systemExpanded = true;
        data.systemCollapsed = false;
        model.setData(data);
        this.collapseSystemColumns(false);
    },

    onCollapseSystemColumns : function(oEvent) {
        var model = this.getView().getModel("uiModel");
        var data = model.getData();
        data.systemExpanded = false;
        data.systemCollapsed = true;
        model.setData(data);
        this.collapseSystemColumns(true);
    },

    onExpandUserColumns : function(oEvent) {
        var model = this.getView().getModel("uiModel");
        var data = model.getData();
        data.userExpanded = true;
        data.userCollapsed = false;
        model.setData(data);
        this.collapseUserColumns(false);
    },

    onCollapseUserColumns : function(oEvent) {
        var model = this.getView().getModel("uiModel");
        var data = model.getData();
        data.userExpanded = false;
        data.userCollapsed = true;
        model.setData(data);
        this.collapseUserColumns(true);
    },

    collapseServiceColumns : function(bCollapsed) {
        this.getView().byId("Service").setVisible(bCollapsed);
        this.getView().byId("ServiceTransactionName").setVisible(!bCollapsed);
        this.getView().byId("ServiceProgramName").setVisible(!bCollapsed);
    },

    collapseUserColumns : function(bCollapsed) {
        this.getView().byId("User").setVisible(bCollapsed);
        this.getView().byId("UserPseudonymInitiating").setVisible(!bCollapsed);
        this.getView().byId("UserPseudonymActing").setVisible(!bCollapsed);
        this.getView().byId("UserPseudonymTargeting").setVisible(!bCollapsed);
        this.getView().byId("UserPseudonymTargeted").setVisible(!bCollapsed);
    },

    collapseSystemColumns : function(bCollapsed) {
        this.getView().byId("System").setVisible(bCollapsed);
        this.getView().byId("SystemIdActor").setVisible(!bCollapsed);
        this.getView().byId("SystemTypeActor").setVisible(!bCollapsed);
        this.getView().byId("SystemIdInitiator").setVisible(!bCollapsed);
        this.getView().byId("SystemTypeInitiator").setVisible(!bCollapsed);
        this.getView().byId("SystemIdIntermediary").setVisible(!bCollapsed);
        this.getView().byId("SystemTypeIntermediary").setVisible(!bCollapsed);
        this.getView().byId("SystemIdReporter").setVisible(!bCollapsed);
        this.getView().byId("SystemTypeReporter").setVisible(!bCollapsed);
        this.getView().byId("SystemIdTarget").setVisible(!bCollapsed);
        this.getView().byId("SystemTypeTarget").setVisible(!bCollapsed);
    },

    /**
     * synchronize Expand/Collapse buttons with visibility settings of personalization controller
     */
    syncExpandCollapseButtons : function() {
        var view = this.getView();
        var uiModel = view.getModel("uiModel");
        var uiModelData = uiModel.getData();

        var userVisible = view.byId("User").getVisible();
        var userInitiatingVisible = view.byId("UserPseudonymInitiating").getVisible();
        var userActingVisible = view.byId("UserPseudonymActing").getVisible();
        var userTargetingVisible = view.byId("UserPseudonymTargeting").getVisible();
        var userTargetedVisible = view.byId("UserPseudonymTargeted").getVisible();
        var userExpanded = (userInitiatingVisible === true && userActingVisible === true && userTargetingVisible === true && userTargetedVisible === true && userVisible === false);
        var userCollapsed = (userInitiatingVisible === false && userActingVisible === false && userTargetingVisible === false && userTargetedVisible === false && userVisible === true);
        if (userExpanded === true && userCollapsed === false) {
            uiModelData.userExpanded = true;
            uiModelData.userCollapsed = false;
        } else if (userExpanded === false && userCollapsed === true) {
            uiModelData.userExpanded = false;
            uiModelData.userCollapsed = true;
        } else {
            // Mixed: Neither fully expanded nor fully
            // collapsed
            uiModelData.userExpanded = false;
            uiModelData.userCollapsed = false;
        }

        var systemVisible = view.byId("System").getVisible();
        var systemIdActorVisible = view.byId("SystemIdActor").getVisible();
        var systemTypeActorVisible = view.byId("SystemTypeActor").getVisible();
        var systemIdInitiatorVisible = view.byId("SystemIdInitiator").getVisible();
        var systemTypeInitiatorVisible = view.byId("SystemTypeInitiator").getVisible();
        var systemIdIntermediaryVisible = view.byId("SystemIdIntermediary").getVisible();
        var systemTypeIntermediaryVisible = view.byId("SystemTypeIntermediary").getVisible();
        var systemIdReporterVisible = view.byId("SystemIdReporter").getVisible();
        var systemTypeReporterVisible = view.byId("SystemTypeReporter").getVisible();
        var systemIdTargetVisible = view.byId("SystemIdTarget").getVisible();
        var systemTypeTargetVisible = view.byId("SystemTypeTarget").getVisible();
        var systemExpanded =
                (systemIdActorVisible === true && systemTypeActorVisible === true && systemIdInitiatorVisible === true && systemTypeInitiatorVisible === true && systemIdIntermediaryVisible === true &&
                        systemTypeIntermediaryVisible === true && systemIdReporterVisible === true && systemTypeReporterVisible === true && systemIdTargetVisible === true &&
                        systemTypeTargetVisible === true && systemVisible === false);
        var systemCollapsed =
                (systemIdActorVisible === false && systemTypeActorVisible === false && systemIdInitiatorVisible === false && systemTypeInitiatorVisible === false &&
                        systemIdIntermediaryVisible === false && systemTypeIntermediaryVisible === false && systemIdReporterVisible === false && systemTypeReporterVisible === false &&
                        systemIdTargetVisible === false && systemTypeTargetVisible === false && systemVisible === true);
        if (systemExpanded === true && systemCollapsed === false) {
            uiModelData.systemExpanded = true;
            uiModelData.systemCollapsed = false;
        } else if (systemExpanded === false && systemCollapsed === true) {
            uiModelData.systemExpanded = false;
            uiModelData.systemCollapsed = true;
        } else {
            // Mixed: Neither fully expanded nor fully
            // collapsed
            uiModelData.systemExpanded = false;
            uiModelData.systemCollapsed = false;
        }

        var serviceVisible = view.byId("Service").getVisible();
        var serviceTransactionVisible = view.byId("ServiceTransactionName").getVisible();
        var serviceProgramVisible = view.byId("ServiceProgramName").getVisible();
        var serviceExpanded = (serviceTransactionVisible === true && serviceProgramVisible === true && serviceVisible === false);
        var serviceCollapsed = (serviceTransactionVisible === false && serviceProgramVisible === false && serviceVisible === true);
        if (serviceExpanded === true && serviceCollapsed === false) {
            uiModelData.serviceExpanded = true;
            uiModelData.serviceCollapsed = false;
        } else if (serviceExpanded === false && serviceCollapsed === true) {
            uiModelData.serviceExpanded = false;
            uiModelData.serviceCollapsed = true;
        } else {
            // Mixed: Neither fully expanded nor fully
            // collapsed
            uiModelData.serviceExpanded = false;
            uiModelData.serviceCollapsed = false;
        }

        // deal with reload data if more fields/attributes are requested
        // since they could be not included in the $select in odata
        uiModelData.selectedFields = [ "Id" ];

        if (userVisible) {
            uiModelData.selectedFields.push("UserPseudonymInitiating");
            uiModelData.selectedFields.push("UserPseudonymActing");
            uiModelData.selectedFields.push("UserPseudonymTargeting");
            uiModelData.selectedFields.push("UserPseudonymTargeted");
        }
        if (systemVisible) {
            uiModelData.selectedFields.push("SystemIdActor");
            uiModelData.selectedFields.push("SystemIdInitiator");
            uiModelData.selectedFields.push("SystemIdIntermediary");
            uiModelData.selectedFields.push("SystemIdReporter");
            uiModelData.selectedFields.push("SystemIdTarget");
            uiModelData.selectedFields.push("SystemTypeActor");
            uiModelData.selectedFields.push("SystemTypeInitiator");
            uiModelData.selectedFields.push("SystemTypeIntermediary");
            uiModelData.selectedFields.push("SystemTypeReporter");
            uiModelData.selectedFields.push("SystemTypeTarget");
        }
        if (serviceVisible) {
            uiModelData.selectedFields.push("ServiceTransactionName");
            uiModelData.selectedFields.push("ServiceProgramName");
        }

        this.getSemanticEventsTable().getColumns().forEach(function(oColumn) {
            // console.log(oColumn.getHeader().getText() + ": " + oColumn.getVisible());
            if (oColumn.getVisible() && oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                uiModelData.selectedFields.push(oColumn.getSortProperty());
            }
        });

        uiModel.setData(uiModelData);

        // resend backend service
        this.applyFiltersAndSorter({});
    },

    showDetail : function(bVisible) {

        var that = this;
        var oSplitter = this.getSplitter();

        if (bVisible) {
            if (oSplitter.getContentAreas().length === 1) {
                this.logDetail = sap.ui.xmlfragment(this.getView().getId(), "sap.secmon.ui.m.commons.semanticEvents.LogDetail", this);
                oSplitter.addContentArea(this.logDetail);
                this.getTableScrollContainer().getLayoutData().setSize("60%");
            }
            var logDetailHelper = new sap.secmon.ui.m.commons.semanticEvents.LogDetailHelper();
            this.promise4OriginalData = logDetailHelper.rebindData(this.logDetail, that.lastSelectedObject);
        } else {
            if (oSplitter.getContentAreas().length > 1) {
                oSplitter.removeContentArea(1);
            }
            this.getTableScrollContainer().getLayoutData().setSize("100%");
        }
    },

    getSplitter : function() {
        return this.getView().byId("splitter");
    },

    /**
     * Trigger bookmarking of current semantic event filter selection. The bookmark points to the semantic event FS URL with current selection parameters.
     * 
     * @param oEvent
     */
    handleBookmarkDialogButtonPressed : function() {
        var oParameters = this.getDateTimeHandler().getSelectionAsObject();
        Object.keys(oParameters).forEach(function(key) {
            oParameters[key] = encodeURIComponent(oParameters[key]);
        });
        var oSelectionFromFilterBar = this.getFilterBarSelectionAsObject();
        Object.keys(oSelectionFromFilterBar).forEach(function(sKey) {
            oSelectionFromFilterBar[sKey] = encodeURIComponent(oSelectionFromFilterBar[sKey]);
        });
        oParameters = $.extend(true, oParameters, oSelectionFromFilterBar);

        this.getSemanticEventsTable().getColumns().forEach(function(oColumn) {
            if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn && oColumn.getSorted() === true) {
                oParameters.orderBy = oColumn.getSortProperty();
                oParameters.orderDesc = (oColumn.getSortOrder() === sap.secmon.ui.m.commons.controls.SortOrder.Descending);
            }
        });

        var sTitle = this.getText("MBookmark_SemanticEvXLBL");
        this.oBookmarkCreator.showBookmarkCreationDialog(this.getView(), sTitle, oParameters, 'SemanticEvent');
    },

    /**
     * Open a popup to send an email containing a URL. The URL points to the semantic event FS with current selection parameters.
     * 
     * @param oEvent
     */
    handleEmailButtonPressed : function(oEvent) {
        var sFilterDescr = this.getFilterBarText();
        // The document URL might not reflect the parameters from view settings.
        // We need to explicitly set the URL parameters.
        var oParameters = this.getDateTimeHandler().getSelectionAsObject();
        Object.keys(oParameters).forEach(function(key) {
            oParameters[key] = encodeURIComponent(oParameters[key]);
        });
        var oSelectionFromFilterBar = this.getFilterBarSelectionAsObject();
        Object.keys(oSelectionFromFilterBar).forEach(function(sKey) {
            oSelectionFromFilterBar[sKey] = encodeURIComponent(oSelectionFromFilterBar[sKey]);
        });
        oParameters = $.extend(true, oParameters, oSelectionFromFilterBar);

        var sURL = sap.secmon.ui.m.commons.TileURLUtils.createURLWithParams(oParameters);
        var sBody = this.getText("Email_BodyXMsg") + "\n" + sURL + "\n" + sFilterDescr;
        var sSubject = this.getText("Email_SubjectMsg");
        sap.m.URLHelper.triggerEmail('', sSubject, sBody);
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/476e6f81c8b448dc88c330325238f2e7.html");
    }

});
