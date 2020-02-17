jQuery.sap.declare("sap.secmon.ui.m.commons.SelectionUtils");

sap.secmon.ui.m.commons.SelectionUtils = function() {

    var oCommons = new sap.secmon.ui.commons.CommonFunctions();

    return {
        getSelectedContexts : function(oTable) {
            var aContexts;

            // mobile table
            if (oTable.getSelectedContexts) {
                aContexts = oTable.getSelectedContexts();
            } else if (oTable.getSelectedIndices) { // desktop table
                aContexts = [];
                var indexes = oTable.getSelectedIndices();

                indexes.forEach(function(nIndex) {
                    aContexts.push(oTable.getContextByIndex(nIndex));
                }, this);
            }
            if (!aContexts) {
                return null;
            }
            return aContexts;
        },

        getSelectedContext : function(oTable) {
            var aContexts = sap.secmon.ui.m.commons.SelectionUtils.getSelectedContexts(oTable);
            if (!aContexts || aContexts.length === 0) {
                return null;
            }
            return aContexts[0];
        },

        getIdPropertyOfSelectedContextAndDecode : function(oTable, sPropertyName) {
            var oContext = sap.secmon.ui.m.commons.SelectionUtils.getSelectedContext(oTable);
            if (!oContext) {
                return null;
            }
            var sProperty = oContext.getProperty(sPropertyName);
            return oCommons.base64ToHex(sProperty);
        },

        getIdPropertiesOfSelectedContextsAndDecode : function(oTable, sPropertyName) {
            var aValues = [];

            // mobile table
            if (oTable.getSelectedContexts) {
                var aContexts = oTable.getSelectedContexts();
                aContexts.forEach(function(oContext) {
                    var sPropertyValue = oCommons.base64ToHex(oContext.getProperty(sPropertyName));
                    aValues.push(sPropertyValue);
                });
            } else if (oTable.getSelectedIndices) { // desktop table
                var indexes = oTable.getSelectedIndices();

                indexes.forEach(function(nIndex) {
                    var sPropertyValue = oCommons.base64ToHex(oTable.getContextByIndex(nIndex).getProperty(sPropertyName));
                    aValues.push(sPropertyValue);
                }, this);
            }

            return aValues;
        },

        /*-
         * Select items in a sap.m.ListBase (eg. Table, List).
         *   sIdPropertyName : name of the property containing the row identifier (base 64 encoded), e.g. "AlertId"
         *   aRowIds : array identifying the rows to select. The ids are supplied as HEX strings.
         */
        selectItems : function(aRowIds, oList, sIdPropertyName) {
            var oIdsToSelectMap = {};
            aRowIds.forEach(function(alertId) {
                oIdsToSelectMap[alertId] = true;
            });
            // select rows

            var aItems;
            var oContext;
            var id;
            var i;

            // mobile list (table)
            if (oList.getItems) {
                aItems = oList.getItems();
                for (i = 0; i < aItems.length; i++) {
                    oContext = aItems[i].getBindingContext();
                    id = oCommons.base64ToHex(oContext.getProperty(sIdPropertyName));
                    if (oIdsToSelectMap[id]) {
                        oList.setSelectedItem(aItems[i]);
                    }
                }
            } else if (oList.getRows) { // desktop table
                aItems = oList.getRows();
                for (i = 0; i < aItems.length; i++) {
                    oContext = oList.getContextByIndex(aItems[i].getIndex());
                    if (oContext) {
                        id = oCommons.base64ToHex(oContext.getProperty(sIdPropertyName));
                        if (oIdsToSelectMap[id]) {
                            oList.addSelectionInterval(i, i);
                        }
                    }
                }
            }
        },

    };

}();
