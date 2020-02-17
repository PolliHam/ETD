jQuery.sap.declare("sap.secmon.ui.m.commons.QueryExtractor");
jQuery.sap.require("sap.secmon.ui.m.commons.UrlParameterMappings");
jQuery.sap.require("sap.secmon.ui.m.commons.ServiceConstants");

/**
 * This function is responsible for extraction of sap.ui.model.Filter objects or sap.ui.model.Sorter objects from a query object. The filter objects can be applied to fields of a DB table/view.
 * 
 * @param sServiceName
 *            A service constant defined in ServiceConstants.
 * @param sDefaultOrderBy
 *            the default order field. It is used if none is supplied in the query object.
 * @param bDefaultOrderDesc
 *            the default order: if true the sort order is descending.
 */

sap.secmon.ui.m.commons.QueryExtractor =
        function(sServiceName, sDefaultOrderBy, bDefaultOrderDesc) {
            var URL_PARAM_MAPPINGS = new sap.secmon.ui.m.commons.UrlParameterMappings(sServiceName);

            /**
             * extracts filters from a query object
             * 
             * @param oQueryParameters
             *            a JS literal of the form {param1: value1, param2: value} Caution: The parameter values are encoded with encodeURIComponent
             * @return an array of sap.ui.model.Filter objects. The values are NOT encoded!
             */
            this.extractFilters = _extractFilters;
            function _extractFilters(oQueryParameters, oOperator) {
                var aFilters = [];
                function processFilter(property, operatorValue) {
                    var prop = property, operator = operatorValue;

                    return function(sValue) {

                        aFilters.push(new sap.ui.model.Filter({

                            path : URL_PARAM_MAPPINGS.convertToDBFieldName(prop, true),
                            operator : operator,
                            // Caution:
                            // Router.navTo internally uses encodeURI instead of
                            // encodeURIComponent. Therefore, if we have special
                            // characters like
                            // ; , / ? : @ & = + $
                            // we need to additionally call encodeURIComponent or
                            // decodeURIComponent, respectively.
                            // Effectively, the hash is encoded twice.
                            value1 : decodeURIComponent(sValue)
                        }));

                    };
                }
                var operator;
                var aFilterableAttributes = URL_PARAM_MAPPINGS.getSupportedUrlParamNames();

                // the parameter "ageInHours" is a calculated field, it does not
                // directly map on a DB field.
                if (sServiceName === sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE || sServiceName === sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE ||
                        sServiceName === sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE) {
                    aFilterableAttributes = aFilterableAttributes.concat([ 'ageInHours' ]);
                }

                for ( var prop in oQueryParameters) {

                    // special handling for a few parameters:
                    if ((sServiceName === sap.secmon.ui.m.commons.ServiceConstants.ALERTS_SERVICE || sServiceName === sap.secmon.ui.m.commons.ServiceConstants.INVESTIGATIONS_SERVICE) &&
                            prop === 'ageInHours') {
                        aFilters.push(_createDateTimeFilter(oQueryParameters.ageInHours, 'creationDate'));
                        continue;
                    }
                    if (sServiceName === sap.secmon.ui.m.commons.ServiceConstants.PATTERNEXECUTIONRESULTS_SERVICE && prop === 'ageInHours') {
                        aFilters.push(_createDateTimeFilter(oQueryParameters.ageInHours, 'executionTimestamp'));
                        continue;
                    }

                    // default handling
                    if (aFilterableAttributes.indexOf(prop) !== -1 && oQueryParameters.hasOwnProperty(prop)) {

                        var aValues = oQueryParameters[prop].split(",");
                        operator = (oOperator && oOperator[prop]) || sap.ui.model.FilterOperator.EQ;
                        var processFunction = processFilter(prop, operator);
                        aValues.forEach(processFunction);

                    }
                }
                return aFilters;

            }

            /**
             * Extract a sap.ui.model.Sorter object from a query object. The query object is expected to have attributes "orderBy" and "orderDesc". If they are not available, the default sorter is
             * returned.
             * 
             * @param oQueryParameters
             *            a JS literal of the form {orderBy: param1, orderDesc: true|false}
             * @return a sap.ui.model.Sorter object
             */
            this.extractSorter = _extractSorter;
            function _extractSorter(oQueryParameters) {
                var aOrderableAttributes = URL_PARAM_MAPPINGS.getSupportedOrderByValues();
                var sortFieldOnDB;
                var bSortDesc;
                if (oQueryParameters.orderBy && aOrderableAttributes.indexOf(oQueryParameters.orderBy) !== -1) {
                    sortFieldOnDB = URL_PARAM_MAPPINGS.convertToDBFieldName(oQueryParameters.orderBy, false);
                    bSortDesc = ("true" === oQueryParameters.orderDesc || true === oQueryParameters.orderDesc);
                } else {
                    sortFieldOnDB = URL_PARAM_MAPPINGS.convertToDBFieldName(sDefaultOrderBy, false);
                    bSortDesc = (bDefaultOrderDesc === true || bDefaultOrderDesc === "true");
                }
                return new sap.ui.model.Sorter(sortFieldOnDB, bSortDesc);
            }

            /**
             * calculate a filter for the last few hours
             * 
             * @param ageInHours
             *            number of hours
             * @param sParamName
             *            the parameter name in question
             * @return an object of type sap.ui.model.Filter
             */
            function _createDateTimeFilter(ageInHours, sParamName) {
                var from = new Date();
                from.setHours(from.getHours() - (+ageInHours));
                return new sap.ui.model.Filter({
                    path : URL_PARAM_MAPPINGS.convertToDBFieldName(sParamName, true),
                    operator : sap.ui.model.FilterOperator.GE,
                    value1 : from
                });
            }
        };