jQuery.sap.declare("sap.secmon.ui.m.commons.MappedViewSettingsHelper");
jQuery.sap.require("sap.secmon.ui.m.commons.UrlParameterMappings");
jQuery.sap.require("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.commons.FilterSortUtil");
/**
 * the view settings helper is used for restoring view settings-'settings' from the current url-parameters and applying the corresponding filtering and sorting to the supplied binding. the view
 * settings dialog consists of bindings which data might have not been loaded yet. This helper object is able to apply the view settings-'settings' as soon the data is available.
 * 
 * This view settings helper uses a mapping between URL parameter fields and DB fields (the view settings use DB fields directly).
 */
sap.secmon.ui.m.commons.MappedViewSettingsHelper = (function() {
    /**
     * this internal function is for applying the query parameters to the view settings dialog if nothing is set in the view settings dialog (page was called directly)
     * 
     * @param oViewSettingsDialog
     *            view settings dialog
     * @param aViewSettingsValues
     *            array of parameters
     * @return a deferred object which can be used to react on a result
     */
    var _applyQueryParametersToViewSettingsDialog = function(oViewSettingsDialog, aViewSettingsValues) {
        var oDeferredResult = $.Deferred();

        /**
         * internal function to apply the specified view settings values to the view settings dialog. if a binding with no items exist it will be returned.
         * 
         * @returns {Array} of bindings where the items have not been fetched
         */
        function fnApplyQueryParametersToViewSettingsDialog() {
            var aDelayedBindings = [];
            var aFilterItems = oViewSettingsDialog.getFilterItems();
            var aSortItems = oViewSettingsDialog.getSortItems();

            // variable to remember the handled items
            // mSortItemsOfInterest is a map of name to truthy values
            // which have been sorted
            var mSortItemsOfInterest = {};
            // mFilterItemsOfInterest is a map of a filtered items to its
            // subitems which
            // are filtered
            var mFilterItemsOfInterest = {};

            var i, j, k, aFilteredSubItems;

            // reset all filter
            for (i = 0; i < aFilterItems.length; i++) {
                aFilteredSubItems = aFilterItems[i].getItems();
                for (j = 0; j < aFilteredSubItems.length; j++) {
                    aFilteredSubItems[j].setSelected(false);
                }
            }

            for (i = 0; i < aViewSettingsValues.length; i++) {
                // handle sorting
                for (j = 0; j < aSortItems.length; j++) {
                    if (aViewSettingsValues[i].orderBy && aSortItems[j].getKey() === aViewSettingsValues[i].orderBy) {
                        aSortItems[j].setSelected(true);
                        oViewSettingsDialog.setSortDescending("true" === aViewSettingsValues[i].orderDesc);
                        oViewSettingsDialog.setSelectedSortItem(aSortItems[j]);

                        mSortItemsOfInterest[aSortItems[j].getKey()] = true;
                    } else {
                        if (!mSortItemsOfInterest[aSortItems[j].getKey()]) {
                            aSortItems[j].setSelected(false);
                        }
                    }
                }

                // handle filtering
                for (j = 0; j < aFilterItems.length; j++) {
                    var sCurrentFilterKey = aFilterItems[j].getKey();

                    if (aViewSettingsValues[i].name) {
                        aFilteredSubItems = aFilterItems[j].getItems();

                        // if the binding does not contain child elements
                        // then this binding is
                        // seen as an delayed binding which data is not
                        // available yet
                        if (aFilteredSubItems.length === 0) {
                            var oBinding = aFilterItems[j].getBinding("items");
                            if (oBinding) {
                                aDelayedBindings.push(oBinding);
                            }
                            continue;
                        }

                        if (sCurrentFilterKey === aViewSettingsValues[i].name) {
                            if (!mFilterItemsOfInterest[sCurrentFilterKey]) {
                                mFilterItemsOfInterest[sCurrentFilterKey] = {};
                            }

                            for (k = 0; k < aFilteredSubItems.length; k++) {
                                if (aFilteredSubItems[k].getKey() === aViewSettingsValues[i].value) {
                                    aFilteredSubItems[k].setSelected(true);
                                    mFilterItemsOfInterest[sCurrentFilterKey][aFilteredSubItems[k].getKey()] = true;
                                }
                            }
                        } else {
                            if (!mFilterItemsOfInterest[sCurrentFilterKey]) {
                                for (k = 0; k < aFilteredSubItems.length; k++) {
                                    aFilteredSubItems[k].setSelected(false);
                                }
                            }
                        }

                    }
                }
            }

            return aDelayedBindings;
        }

        var aDelayedBindings = fnApplyQueryParametersToViewSettingsDialog();

        // if there are bindings which data is not available yet than set
        // the values if
        // the required data is available
        if (aDelayedBindings.length > 0) {
            var aPromises = [];

            aDelayedBindings.forEach(function(oDelayedBinding) {
                var oDeferred = $.Deferred();
                aPromises.push(oDeferred);

                var fnPromise = function() {
                    oDeferred.resolve();

                    oDelayedBinding.detachChange(fnPromise);
                };
                oDelayedBinding.attachChange(fnPromise);
            });

            $.when.apply($, aPromises).done(function() {
                fnApplyQueryParametersToViewSettingsDialog();
                oDeferredResult.resolve();
            });
        } else {
            oDeferredResult.resolve();
        }

        return oDeferredResult.promise();
    };

    return {
        /**
         * this function constructs an array of filter-items and determines the sorting from the url parameters and applies them to the provided table binding. the function sets the corresponding
         * values in the supplied view settings dialog.
         * 
         * @param oViewSettingsDialog
         *            view settings dialog
         * @param serviceName
         *            a service name from the ServiceConstants
         * @param oQueryObject
         *            query object from the URL. Caution: The query object contains values encoded with encodeURIComponent.
         * @param sDefaultOrderBy
         *            default field for ordering. This is used if the query object does not have an attribute 'orderBy'
         * @param sDefaultOrderDesc
         *            default field for orderDescending. This is used if the query object does not have an attribute 'orderDesc'
         * @return deferred object
         */
        applyUrlParametersToBindingAndViewSettings : function(oViewSettingsDialog, serviceName, oQueryObject, sDefaultOrderBy, bDefaultOrderDesc) {
            var urlParameterMappings, aOrderableAttributes, prop;
            var aViewSettingsValues = [];
            function addViewSettings(sValue) {
                aViewSettingsValues.push({
                    name : urlParameterMappings.convertToDBFieldName(prop, true),
                    // Caution:
                    // Navigation uses encodeURI internally. If the
                    // parameters contains
                    // characters like
                    // ; , / ? : @ & = + $ these need to be explicitly
                    // encoded with
                    // encodeURIComponent.
                    // Effectively, the hash is encoded twice.
                    // As a consequence, the query object contains URL
                    // encoded parameter values.
                    value : decodeURIComponent(sValue)
                });
            }
            urlParameterMappings = new sap.secmon.ui.m.commons.UrlParameterMappings(serviceName);
            aOrderableAttributes = urlParameterMappings.getSupportedOrderByValues();
            var aFilterableAttributes = urlParameterMappings.getSupportedUrlParamNames();
            var queryExtractor = new sap.secmon.ui.m.commons.QueryExtractor(serviceName, sDefaultOrderBy, bDefaultOrderDesc);            

            // prepare aViewSettingsValues.
            // The values are expected to be strings.
            if (oQueryObject.orderBy && aOrderableAttributes.indexOf(oQueryObject.orderBy) !== -1) {
                aViewSettingsValues.push({
                    orderBy : urlParameterMappings.convertToDBFieldName(oQueryObject.orderBy, false),
                    orderDesc : '' + oQueryObject.orderDesc
                });
            } else {
                aViewSettingsValues.push({
                    orderBy : urlParameterMappings.convertToDBFieldName(sDefaultOrderBy, false),
                    orderDesc : '' + bDefaultOrderDesc
                });
            }

            for (prop in oQueryObject) {
                if (aFilterableAttributes.indexOf(prop) !== -1 && oQueryObject.hasOwnProperty(prop)) {
                    var aValues = oQueryObject[prop].split(",");
                    aValues.forEach(addViewSettings);
                }
            }

            var oSorter = queryExtractor.extractSorter(oQueryObject);
            var aFilters = queryExtractor.extractFilters(oQueryObject);

            var promise = $.Deferred();
            _applyQueryParametersToViewSettingsDialog(oViewSettingsDialog, aViewSettingsValues).done(function() {
                promise.resolve(aFilters, oSorter);
            });

            return promise;
        }
    };
}());
