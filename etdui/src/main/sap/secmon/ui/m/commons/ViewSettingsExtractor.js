jQuery.sap.declare("sap.secmon.ui.m.commons.ViewSettingsExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.UrlParameterMappings");
/**
 * This object extracts a query object from the ViewSettingsDialog.
 */
sap.secmon.ui.m.commons.ViewSettingsExtractor = function(sServiceName, sDefaultOrderBy, bDefaultOrderDesc) {
    var URL_PARAMETER_MAPPINGS = new sap.secmon.ui.m.commons.UrlParameterMappings(sServiceName);

    /**
     * extracts a query object from the "confirm" event. The event is thrown when the user confirms to change filter/sort settings in the view settings dialog.
     * 
     * @param oEvent
     *            the "confirm" event
     * 
     * @return a query object of the form: {orderBy : 'param1', orderDesc : true|false, param1 : value1, param2 : value2}. Caution: The parameter values are URL encoded. Multi-valued parameters are
     *         encoded into a comma-separated string.
     */
    this.extractQueryObjectFromEvent = _extractQueryObjectFromEvent;
    function _extractQueryObjectFromEvent(oEvent) {

        var mParams = oEvent.getParameters();

        // construct query object
        var oNewQueryParameters = {};

        if (mParams.sortItem) {
            var aSupportedSortDbFields = URL_PARAMETER_MAPPINGS.getSupportedDbFieldValues(false);
            var dbField = mParams.sortItem.getKey();
            if (aSupportedSortDbFields.indexOf(dbField) !== -1) {
                oNewQueryParameters.orderBy = URL_PARAMETER_MAPPINGS.convertFromDBFieldName(dbField, false);
                oNewQueryParameters.orderDesc = mParams.sortDescending;
            }
        }
        // It is possible that a default ordering exists but it is not displayed
        // in view settings dialog (i.e. "Number")
        if (!oNewQueryParameters.orderBy) {
            oNewQueryParameters.orderBy = sDefaultOrderBy;
            oNewQueryParameters.orderDesc = bDefaultOrderDesc;
        }

        var aSupportedFilterDbFields = URL_PARAMETER_MAPPINGS.getSupportedDbFieldValues(true);
        mParams.filterItems.forEach(function(oItem) {
            var path = oItem.getParent().getKey();
            // Caution:
            // Navigation uses encodeURI internally. If the parameters contains
            // characters like
            // ; , / ? : @ & = + $ these need to be explicitly encoded with
            // encodeURIComponent.
            // Effectively, the hash is encoded twice.
            var filterValue = encodeURIComponent(oItem.getKey());
            if (aSupportedFilterDbFields.indexOf(path) !== -1) {
                var sQueryKey = URL_PARAMETER_MAPPINGS.convertFromDBFieldName(path, true);

                if (sQueryKey) {
                    // Caution:
                    // Routing/navigation does not like multi-valued URL
                    // parameters,
                    // it throws an error if it encounters
                    // 'param1=A&param1=B&param1=C'.
                    // Therefore, we encode the values into a comma-separated
                    // string:
                    // {param1:'A,B,C}
                    if (!oNewQueryParameters[sQueryKey]) {
                        oNewQueryParameters[sQueryKey] = filterValue;
                    } else {
                        oNewQueryParameters[sQueryKey] = oNewQueryParameters[sQueryKey] + "," + filterValue;
                    }
                }
            }
        });
        return oNewQueryParameters;
    }

    /**
     * retrieve parameters for use with the bookmarking service. The returned parameter object contains filter parameters and sort parameters).
     * 
     * @param oViewSettingsDialog
     *            an object of type sapm.ViewSettingsDialog. attributes: orderBy, orderDesc
     * @return a parameter object in the same format as the component startup parameters. Example: {status:[VERY_HIGH, HIGH], orderBy:status, orderDesc=true}. Allowed attributes are: status, severity,
     *         patternName, number, orderBy, orderDesc. Allowed values for attribute "orderBy": status, severity, patternName, number. Caution: The parameter values are URL encoded.
     * 
     */
    this.extractQueryObjectFromDialog = _extractQueryObjectFromDialog;
    function _extractQueryObjectFromDialog(oViewSettingsDialog, bUseArray, bExtraEncode) {

        var aFilterItems = oViewSettingsDialog.getFilterItems();
        var oParameters = {};
        var parameterName;
        var key;
        var aSupportedFilterFields = URL_PARAMETER_MAPPINGS.getSupportedDbFieldValues(true);
        for (var j = 0; j < aFilterItems.length; j++) {
            key = aFilterItems[j].getKey();
            if (aSupportedFilterFields.indexOf(key) !== -1) {
                parameterName = URL_PARAMETER_MAPPINGS.convertFromDBFieldName(key, true);

                // Later: This function returns a query object with multi-values
                // ({param1=[A,B,C])
                // On the other hand, function extractQueryObjectFromEvent
                // encodes multi-values into a comma-separated string like
                // {param1:'A,B,C'}
                // This is because routing/navigation throws an error if it
                // encounters
                // multi-valued URL parameters like
                // 'param1=A&param1=B&param1=C'.
                // Find out if we can harmonize that!
                // Also compare with
                // sap.secmon.ui.m.commons.RoutingParameterHelper
                // and sap.secmon.ui.m.commons.TileURLUtils.
                // Be careful because filter parameters for application must be
                // identical to filter parameters for count service.

                // Caution:
                // Navigation uses encodeURI internally. If the parameters
                // contains
                // characters like
                // ; , / ? : @ & = + $ these need to be explicitly encoded with
                // encodeURIComponent.
                // Effectively, the hash is encoded twice. Therefore, the query
                // object has URL encoded parameter values.
                var values = aFilterItems[j].getItems();
                for (var k = 0; k < values.length; k++) {
                    if (values[k].getSelected()) {
                        var filterValue = encodeURIComponent(values[k].getKey());

                        if (bExtraEncode) {
                            filterValue = encodeURIComponent(filterValue);
                        }
                        if (!oParameters[parameterName]) {
                            if (bUseArray) {
                                oParameters[parameterName] = [ filterValue ];
                            } else {
                                oParameters[parameterName] = filterValue;
                            }
                        } else {
                            if (bUseArray) {
                                oParameters[parameterName].push(filterValue);
                            } else {
                                oParameters[parameterName] = oParameters[parameterName] + "," + filterValue;
                            }
                        }
                    }
                }
            }
        }

        var bSortDesc = oViewSettingsDialog.getSortDescending();
        if (bSortDesc !== undefined) {
            oParameters.orderDesc = bSortDesc;
        } else {
            oParameters.orderDesc = bDefaultOrderDesc;
        }
        var aSortItems = oViewSettingsDialog.getSortItems();
        var aSupportedSortFields = URL_PARAMETER_MAPPINGS.getSupportedDbFieldValues(false);
        for (var l = 0; aSortItems && l < aSortItems.length; l++) {
            key = aSortItems[l].getKey();
            if (aSortItems[l].getSelected() === true) {
                if (aSupportedSortFields.indexOf(key) !== -1) {
                    oParameters.orderBy = URL_PARAMETER_MAPPINGS.convertFromDBFieldName(key, false);
                    break;
                }
            }
        }
        // It is possible that a default ordering exists but it is not displayed
        // in view settings dialog (i.e. "Number")
        if (!oParameters.orderBy) {
            oParameters.orderBy = sDefaultOrderBy;
        }

        return oParameters;
    }

};