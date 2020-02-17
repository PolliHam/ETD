var ADependencies = [ "sap/secmon/ui/commons/CommonFunctions" ];

sap.ui.define(ADependencies, function(CommonFunctions) {
    "use strict";

    /**
     * This utility contains a functions to apply filter/sort settings to a table.
     */
    sap.secmon.ui.commons.FilterSortUtil = {

        /**
         * set new filter and sort settings to a table
         * 
         * @param oTable
         *            an instance of sap.m.ListBase
         * @param aFilters
         *            mandatory parameter: An array of sap.ui.model.Filter instances. If an empty array, null, or undefined is input then the existing filters are removed.
         * @param oSorter
         *            optional parameter: An instance of sap.ui.model.Sorter. If the parameter is not supplied, null, or undefined, the parameter is ignored. The existing sorter is retained. If the
         *            underlying model is an XML model or JSON model, the sorter may have a field fnCompare with a compare function. In case of an OData model the compare function is ignored, sorting
         *            is always done server-side.
         */
        applyFiltersAndSorterToTable : function(oTable, aFilters, oSorter, bNoTimeRefresh, timestampPath) {

            var oModel = oTable.getModel();
            var oBinding = oTable.getBinding("items");
            var oBindingInfo = oTable.getBindingInfo("items");
            // Table binding does not accept an empty filter array.
            // For removing filters, undefined is required.
            if (aFilters instanceof Array && aFilters.length === 0) {
                aFilters = undefined;
            }
            if (aFilters === null) {
                aFilters = undefined;
            }

            if (!oBinding) {
                // On initialization, it is possible that the binding does not exist
                // yet.
                // So no harm in creating a new binding
                var oTemplate = oBindingInfo.template || oBindingInfo.factory;
                if (oTemplate !== null && oTemplate !== undefined) {
                    oTable.bindItems(oBindingInfo.path, oTemplate, oSorter, aFilters);
                    return;
                }
            }

            if (bNoTimeRefresh === true && aFilters !== undefined) {
                var oldTimeFilter = {};
                aFilters.some(function(filter) {
                    if (filter.sPath === timestampPath && filter.sOperator === "BT") {
                        oBinding.aFilters.some(function(filter2) {
                            if (filter2.sPath === timestampPath && filter2.sOperator === "BT") {
                                oldTimeFilter = filter2;
                                return true;
                            }
                        });
                        filter = oldTimeFilter;
                        return true;
                    }
                });
            }

            // sorting and filtering is done asynchronously server-side
            if (oModel instanceof sap.ui.model.odata.ODataModel) {

                var oCommons = new CommonFunctions();
                var aOldSorters = oBinding.aSorters;
                var aSorters = oSorter ? [ oSorter ] : [];
                var bSortChanged = (oSorter && !oCommons.deepEqual(aOldSorters, aSorters));

                if (oSorter) {
                    if (this._isString(oSorter.sPath, oModel, oBinding) === true) {
                        oSorter = this._getCaseInsensitiveSorter(oSorter, true);
                    }
                }

                // needed to enable sorting via multiple columns with the same
                // sortOrder
                var aSorter = oSorter.sPath.split(",");
                if (aSorter.length > 1) {
                    oSorter.sPath = "";
                    var sortOrder = " asc";
                    if (oSorter.bDescending === true) {
                        sortOrder = " desc";
                    }
                    var length = aSorter.length;
                    aSorter.forEach(function(sSortString, index) {
                        if (length - 1 === index) {
                            oSorter.sPath = oSorter.sPath + sSortString;
                        } else {
                            oSorter.sPath = oSorter.sPath + sSortString + sortOrder + ",";
                        }
                    });
                }

                // Always filter so that a click on "go" in the filterbar creates a round trip
                oBinding.filter(aFilters);
                // These 2 statements will trigger 2 ODATA requests
                // (However, the first one will be aborted immediately)
                if (oSorter && bSortChanged) {
                    oBinding.sort(oSorter);
                }

            } else {
                // sorting and filtering is done synchronously client-side
                if (oSorter) {
                    // We don't have the metadata to decide if the sort field is a
                    // string.
                    // We try it anyway, the compare function is robust enough.
                    oSorter = this._getCaseInsensitiveSorter(oSorter, false);
                    oBinding.sort(oSorter);
                }

                oBinding.filter(aFilters);
            }
        },

        /**
         * Get a sorter which allows to sort insensitive to capitalization.
         * 
         * @param oSorter
         *            the original sap.ui.model.Sorter object
         * @param bServerSideSort
         *            whether sorting occurs server-side or client-side
         * @return a new sap.ui.model.Sorter object
         */
        _getCaseInsensitiveSorter : function(oSorter, bServerSideSort) {
            if (bServerSideSort === true) {
                // For server-side sorting, a new ODATA request is sent.
                // We inject the ODATA function toupper.
                var newPath = "toupper(" + oSorter.sPath + ")";
                return new sap.ui.model.Sorter(newPath, oSorter.bDescending);
            } else {
                // For client-side sorting, we use a custom sorter.
                var customSorter = new sap.ui.model.Sorter(oSorter.sPath, oSorter.bDescending);
                customSorter.fnCompare = function(value1, value2) {
                    if (!value1 && !value2) {
                        return 0;
                    } else if (!value1) {
                        return 0;
                    } else if (!value2) {
                        return 0;
                    } else if (value1.toLocaleLowerCase && value2.toLocaleLowerCase) {
                        if (value1.toLocaleLowerCase() < value2.toLocaleLowerCase()) {
                            return -1;
                        } else if (value1.toLocaleLowerCase() === value2.toLocaleLowerCase()) {
                            return 0;
                        } else if (value1.toLocaleLowerCase() > value2.toLocaleLowerCase()) {
                            return 1;
                        }
                    } else {
                        // not a String
                        if (value1 < value2) {
                            return -1;
                        } else if (value1.toString() === value2.toString()) {
                            return 0;
                        } else if (value1 > value2) {
                            return 1;
                        }
                    }
                };
                return customSorter;
            }
        },

        /**
         * check if the field is a string, the info is provided from the metadata on the ODATA model
         * 
         * @param sFieldName
         *            field name (attribute) of model
         * @param oModel
         *            the ODATA model
         * @param oItemBinding
         *            the binding to "items"
         * @return true if the field is of String type
         */
        _isString : function(sFieldName, oModel, oItemBinding) {
            var oMeta = oModel.getServiceMetadata();

            if (!oMeta) {
                return false;
            }
            for (var j = 0; j < oMeta.dataServices.schema[0].entityType.length; j++) {
                var entityType = oMeta.dataServices.schema[0].entityType[j];
                if (entityType !== oItemBinding.oEntityType) {
                    continue;
                }
                for (var i = 0; i < entityType.property.length; i++) {
                    var property = entityType.property[i];
                    if (sFieldName === property.name) {
                        return (property.type === 'Edm.String');
                    }
                }
            }
            return false;
        }

    };

    return sap.secmon.ui.commons.FilterSortUtil;
});
