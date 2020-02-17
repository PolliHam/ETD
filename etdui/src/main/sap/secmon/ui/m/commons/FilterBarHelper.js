jQuery.sap.declare("sap.secmon.ui.m.commons.FilterBarHelper");
jQuery.sap.require("sap.secmon.ui.commons.FilterSortUtil");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.SortOrder");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.SortableColumn");
jQuery.sap.require("sap.secmon.ui.m.commons.UrlParameterMappings");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/ClickableElementStyle.css");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/FilterBarWithSameSizedItems.css");

sap.secmon.ui.m.commons.FilterBarHelper = (function() {
    var models;
    return {

        // aModels is needed to avoid that the Filtered by text is partly empty
        initialize : function(sTableName, UrlParameterMappingConstant, fnNavigation, aFilterInputIds, aModels) {
            this.FilterInputIds = aFilterInputIds;
            this.TableName = sTableName;
            this.UrlParameterMapping = UrlParameterMappingConstant;
            this.fnNavigation = fnNavigation;
            models = aModels || [];

        },

        onSearch : function() {
            this.fnNavigation.call(this);
        },

        onReset : function() {
            sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersToFilterBar.call(this, []);
            this.fnNavigation.call(this);
        },

        handleSort : function(oEvent) {
            if (this.beforeSort) {
                this.beforeSort();
            }
            var oParameters = oEvent.getParameters();
            var oSortedColumn = oParameters.column;
            var sortOrder = oParameters.sortOrder;

            var sSortProperty = oSortedColumn.getSortProperty();
            var bSortDesc = (sortOrder === sap.secmon.ui.m.commons.controls.SortOrder.Descending);

            sap.secmon.ui.m.commons.FilterBarHelper.getTable.call(this, true).getColumns().forEach(function(oColumn) {
                if (oColumn !== oSortedColumn) {
                    if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                        oColumn.setSorted(false);
                    }
                }
            });
            oSortedColumn.setSorted(true);
            oSortedColumn.setSortOrder(sortOrder);

            var oSorter = new sap.ui.model.Sorter(sSortProperty, bSortDesc);
            sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersAndSorter.call(this, {
                sorter : oSorter
            }, true);

            // for some reasons this is needed to prevent the table from scrolling down a bit
            var page = this.byId("page");
            if (page !== undefined) {
                page.scrollTo(0, 1);
            }
        },

        applySorting : function(sId, bDescending) {
            sap.secmon.ui.m.commons.FilterBarHelper.getTable.call(this, true).getColumns().forEach(function(oColumn) {
                if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                    if (oColumn.getSortProperty() === sId) {
                        oColumn.setSorted(true);
                        oColumn.setSortOrder(bDescending ? sap.secmon.ui.m.commons.controls.SortOrder.Descending : sap.secmon.ui.m.commons.controls.SortOrder.Ascending);
                    } else {
                        oColumn.setSorted(false);
                    }
                }
            });
        },

        applyFiltersToFilterBar : function(aFilters, bNoTextUpdate, bNoFilterText) {
            if ($.isArray(aFilters)) {
                var aFilterInputIds = sap.secmon.ui.m.commons.FilterBarHelper.getFilterInputIdsOfFilterBar.call(this);
                var mFilterInputToFilters = {};
                var mFilterInputToI18NKey = {};
                var aVisibleFilterGroupItemIds = [];

                // build a mapping of filter input to i18n-Label to build the filter
                // string
                // build a mapping of filter input to its filter values
                aFilters.forEach(function(oFilter) {
                    var sPath = oFilter.sPath;
                    if (!sPath) {
                        return;
                    }

                    var oCurrentFilterInput;
                    var sCurrentFilterInputId;
                    var bFilterInputUsable;
                    var i, j;

                    // if the error "Cannot read property length of undefined is thrown here, make sure you have set the FilterInputIds
                    for (i = 0; i < aFilterInputIds.length; i++) {
                        sCurrentFilterInputId = aFilterInputIds[i];
                        oCurrentFilterInput = this.byId(sCurrentFilterInputId);
                        bFilterInputUsable = false;

                        if (oCurrentFilterInput) {
                            for (j = 0; j < oCurrentFilterInput.getCustomData().length; j++) {
                                if (oCurrentFilterInput.getCustomData()[j].getKey() === "urlParamName") {
                                    if (oCurrentFilterInput.getCustomData()[j].getValue() === sPath) {
                                        var aFilterValueIds = mFilterInputToFilters[sCurrentFilterInputId];
                                        if (!aFilterValueIds) {
                                            aFilterValueIds = [];
                                            mFilterInputToFilters[sCurrentFilterInputId] = aFilterValueIds;
                                        }
                                        aFilterValueIds.push(oFilter.oValue1);
                                        bFilterInputUsable = true;
                                        break;
                                    }
                                }
                            }

                            if (bFilterInputUsable) {
                                oCurrentFilterInput.getCustomData().forEach(function(oCustomData) {
                                    if (oCustomData.getKey() === "i18nText") {
                                        mFilterInputToI18NKey[sCurrentFilterInputId] = oCustomData.getValue();
                                    } else if (oCustomData.getKey() === "filterItem") {
                                        aVisibleFilterGroupItemIds.push(oCustomData.getValue());
                                    }
                                });
                            }

                        }
                    }
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

                // map the filters to tokens of corresponding filter input
                // aFilterInputIds.forEach(function(sFilterInputId) {
                //     var oCurrentFilterInput = this.byId(sFilterInputId);

                //     if (oCurrentFilterInput.clearSelection) {
                //         oCurrentFilterInput.clearSelection();
                //     } else if (oCurrentFilterInput.removeAllTokens) {
                //         oCurrentFilterInput.removeAllTokens();
                //     }
                // }, this);
                Object.keys(mFilterInputToFilters).forEach(function(sFilterInputId) {
                    var oCurrentFilterInput = this.byId(sFilterInputId);

                    if (oCurrentFilterInput.setSelectedKeys) {// it's a MultiComboBox
                        oCurrentFilterInput.setSelectedKeys(mFilterInputToFilters[sFilterInputId]);
                    } else if (oCurrentFilterInput.setTokens) { // it's a MultiInput

                        var aNewTokens = [];

                        // TODO: find a generic approach.

                        // This is very special handling hard-coded for the PatternSuggestionHelper.
                        // It allows to display pattern name.
                        // It relies on several assumptions:
                        // If the input is a MultiInput and a model "Patterns" is available,
                        // then the MultiInput is implicitly used for pattern selection.

                        // Implementation-wise, it assumes:
                        // There is a model "Patterns". The model has attributes "WorkspacePatterns/Id" and "WorkspacePatterns/Name".
                        // The model is available if in the component.js -> backendConfig -> loadPatternDefinitions is set to true
                        var patternsModel = this.getComponent().getModel("Patterns");
                        if (patternsModel && sFilterInputId === "patternFilterInput") {
                            var aWorkspacePatterns = patternsModel.getData().WorkspacePatterns;

                            aWorkspacePatterns.forEach(function(oWorkspacePattern) {
                                var i;
                                var sPatternId;
                                for (i = 0; i < mFilterInputToFilters[sFilterInputId].length; i++) {
                                    sPatternId = mFilterInputToFilters[sFilterInputId][i];

                                    if (this.oCommons.base64ToHex(oWorkspacePattern.Id) === sPatternId) {
                                        aNewTokens.push(new sap.m.Token({
                                            key : sPatternId,
                                            text : oWorkspacePattern.Name
                                        }));
                                        break;
                                    }
                                }
                            }, this);
                        } else {
                            // Let's support the simple case:
                            // If a MultiInput is used and no "Patterns" model is available, then no name is used.
                            // The key is displayed as text in UI.
                            for (var i = 0; i < mFilterInputToFilters[sFilterInputId].length; i++) {
                                var key = mFilterInputToFilters[sFilterInputId][i];
                                aNewTokens.push(new sap.m.Token({
                                    key : key,
                                    text : key
                                }));
                            }

                        }
                        oCurrentFilterInput.setValue("");
                        oCurrentFilterInput.destroyTokens();
                        oCurrentFilterInput.setTokens(aNewTokens);
                    }
                }, this);

                // build filter string
                //
                if (bNoTextUpdate !== true) {

                    var sText = this.getCommonText("FilterBarPrefix").concat(" ");
                    var bAttachEvent = false;
                    Object.keys(mFilterInputToFilters).forEach(function(sFilterInputId, nIndex) {
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
                        }

                        sText += mFilterInputToI18NKey[sFilterInputId] + " (" + sFilterString + ")";
                        if (sFilterString === "") {
                            bAttachEvent = true;
                        }
                    }, this);

                    if (bAttachEvent === true) {
                        var filters = aFilters, that = this;
                        models.forEach(function(oModel) {
                            oModel.attachEventOnce("requestCompleted", function() {
                                sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersToFilterBar.call(that, filters, false, false);
                            }, that);
                        });
                    }

                    sap.secmon.ui.m.commons.FilterBarHelper.setFilterBarText.call(this, sText);
                }

                if (bNoFilterText !== true) {
                    sap.secmon.ui.m.commons.FilterBarHelper.showFilterBar.call(this, aFilters.length > 0);
                } else {
                    sap.secmon.ui.m.commons.FilterBarHelper.showFilterBar.call(this, false);
                }

            } else {
                sap.secmon.ui.m.commons.FilterBarHelper.showFilterBar.call(this, false);
            }
        },

        applyFiltersAndSorter : function(oFiltersAndSorter, bNoTimeRefresh) {
            var aFilters = oFiltersAndSorter.filters || sap.secmon.ui.m.commons.FilterBarHelper.getFilters.call(this) || [];
            var oSorter = oFiltersAndSorter.sorter;

            sap.secmon.ui.commons.FilterSortUtil.applyFiltersAndSorterToTable(sap.secmon.ui.m.commons.FilterBarHelper.getTable.call(this), aFilters, oSorter, bNoTimeRefresh, this.DEFAULT_ORDER_BY);

            sap.secmon.ui.m.commons.FilterBarHelper.setFilters.call(this, aFilters);
            this.fnNavigation.call(this);
        },

        getSelectedFilterItemsFromFilterBar : function() {
            var aSelectedFilterItems = [];

            var aFilterInputIds = sap.secmon.ui.m.commons.FilterBarHelper.getFilterInputIdsOfFilterBar.call(this);

            // build a mapping of filter input to i18n-Label to build the filter
            // string
            // build a mapping of filter input to its filter values
            aFilterInputIds.forEach(function(sFilterInputId) {
                var oCurrentFilterInput = this.byId(sFilterInputId);

                for (var i = 0; i < oCurrentFilterInput.getCustomData().length; i++) {
                    if (oCurrentFilterInput.getCustomData()[i].getKey() === "urlParamName") {
                        var path = oCurrentFilterInput.getCustomData()[i].getValue();

                        if (oCurrentFilterInput.getTokens) {
                            oCurrentFilterInput.getTokens().forEach(function(oToken) {
                                aSelectedFilterItems.push({
                                    path : path,
                                    filterValue : oToken.getKey()
                                });
                            });
                        } else if (oCurrentFilterInput.getSelectedKeys) {
                            oCurrentFilterInput.getSelectedKeys().forEach(function(sKey) {
                                aSelectedFilterItems.push({
                                    path : path,
                                    filterValue : sKey
                                });
                            });
                        }
                    }
                }
            }, this);

            return aSelectedFilterItems;
        },

        applySelectedFilterItemsToFilterBar : function(aSelectedFilterItems, bNoTextUpdate, bNoFilterText) {
            bNoTextUpdate = bNoTextUpdate || true;
            bNoFilterText = bNoFilterText || false;
            var aFilters = aSelectedFilterItems.map(function(oSelectedFilterItem) {
                return {
                    sPath : oSelectedFilterItem.path,
                    oValue1 : oSelectedFilterItem.filterValue
                };
            });

            sap.secmon.ui.m.commons.FilterBarHelper.applyFiltersToFilterBar.call(this, aFilters, bNoTextUpdate, bNoFilterText);
        },

        extendQueryParameterFromTableSorting : function(oParameters) {
            var oSorting = sap.secmon.ui.m.commons.FilterBarHelper.retrieveSorting.call(this);

            if (oSorting) {
                oParameters.orderBy = oSorting.id;
                oParameters.orderDesc = oSorting.descending;
            }
        },

        retrieveSorting : function() {
            var aColumns = sap.secmon.ui.m.commons.FilterBarHelper.getTable.call(this, true).getColumns();

            for (var i = 0; i < aColumns.length; i++) {
                if (aColumns[i] instanceof sap.secmon.ui.m.commons.controls.SortableColumn && aColumns[i].getSorted()) {
                    return {
                        id : sap.secmon.ui.m.commons.FilterBarHelper.newUrlParameterMappings.call(this).convertFromDBFieldName(aColumns[i].getSortProperty()),
                        descending : (aColumns[i].getSortOrder() === sap.secmon.ui.m.commons.controls.SortOrder.Descending)
                    };
                }
            }
        },

        newUrlParameterMappings : function() {
            return new sap.secmon.ui.m.commons.UrlParameterMappings(this.UrlParameterMapping);
        },

        extendQueryParameterFromFilterBar : function(oNewQueryParameters, aTokenNames) {
            var oQueryParametersFromFilterBar = sap.secmon.ui.m.commons.FilterBarHelper.extractQueryObjectFromFilterBar.call(this, aTokenNames);
            Object.keys(oQueryParametersFromFilterBar).forEach(function(sKey) {
                var aConvertedArray = oQueryParametersFromFilterBar[sKey].map(function(sKey) {
                    return encodeURIComponent(sKey);
                }).join(",");
                oNewQueryParameters[sKey] = aConvertedArray;
            });
        },

        extractQueryObjectFromFilterBar : function(aTokenNames) {
            // construct a mapping of filter input id to url param name
            if (!this.filterInputToUrParam) {
                this.filterInputToUrParam = {};

                var oParamMapper = sap.secmon.ui.m.commons.FilterBarHelper.newUrlParameterMappings.call(this);

                sap.secmon.ui.m.commons.FilterBarHelper.getFilterInputIdsOfFilterBar.call(this).forEach(function(sId) {
                    var aCustomData = this.getView().byId(sId).getCustomData();
                    var i;

                    for (i = 0; i < aCustomData.length; i++) {
                        if (aCustomData[i].getKey() === "urlParamName") {
                            this.filterInputToUrParam[sId] = oParamMapper.convertFromDBFieldName(aCustomData[i].getValue(), true);
                            break;
                        }
                    }
                }, this);
            }

            var oNewQueryObject = {};
            this.aTokenNames = aTokenNames;
            var bIsToken = false;
            Object.keys(this.filterInputToUrParam).forEach(function(sFilterInput) {
                var oFilterInput = this.byId(sFilterInput);
                bIsToken = false;
                if (this.aTokenNames !== undefined) {
                    this.aTokenNames.some(function(sTokenName) {
                        if (sFilterInput === sTokenName) {
                            bIsToken = true;
                            return true;
                        }
                    });
                }

                if (bIsToken === true) {
                    oFilterInput.getTokens().forEach(function(oToken) {
                        if (!oNewQueryObject[this.filterInputToUrParam[sFilterInput]]) {
                            oNewQueryObject[this.filterInputToUrParam[sFilterInput]] = [];
                        }
                        oNewQueryObject[this.filterInputToUrParam[sFilterInput]].push(oToken.getKey());
                    }, this);
                } else {
                    oFilterInput.getSelectedKeys().forEach(function(sKey) {
                        if (!oNewQueryObject[this.filterInputToUrParam[sFilterInput]]) {
                            oNewQueryObject[this.filterInputToUrParam[sFilterInput]] = [];
                        }
                        oNewQueryObject[this.filterInputToUrParam[sFilterInput]].push(sKey);
                    }, this);
                }

            }, this);

            return oNewQueryObject;
        },

        clearFilterInputToUrParam : function(){
            this.filterInputToUrParam = null;
        },

        setFilters : function(aFilters) {
            this.Filters = aFilters;
        },

        getFilters : function() {
            return this.Filters;
        },

        setFilterBarText: function (sText) {
            var oView = this.getView();
            if (oView.byId("vsdFilterLabel")) { oView.byId("vsdFilterLabel").setText(sText); }
            if (oView.getModel("UIModel")) { oView.getModel("UIModel").setProperty("/infoToolBarText", sText); }
        },

        getFilterBar : function() {
            return this.getView().byId("vsdFilterBar");
        },

        showFilterBar: function (bVisible) {
            var oView = this.getView();
            var oFilterBar = sap.secmon.ui.m.commons.FilterBarHelper.getFilterBar.call(this);
            if (oFilterBar) { oFilterBar.setVisible(bVisible); }
            if (oView.getModel("UIModel")) { oView.getModel("UIModel").setProperty("/visibleInfoToolBar", bVisible); }
        },

        getFilterInputIdsOfFilterBar : function(aFilterInputIds) {
            return this.FilterInputIds;
        },

        // isHeader should be true if we deal with two tables
        // one is for fixed header
        // second is for items
        getTable : function(isHeader) {
            if(isHeader){
                var table = this.getView().byId(sap.secmon.ui.m.commons.FilterBarHelper.getTableNameHeader.call(this));
                if(table !== undefined){
                    return table;
                }
            }
            return this.getView().byId(sap.secmon.ui.m.commons.FilterBarHelper.getTableName.call(this));
        },

        getTableName : function() {
            return this.TableName;
        },

        // header table that is fixed (not scrollable) should have suffix Header
        getTableNameHeader : function() {
            return this.TableName + "Header";
        }
    };
}());