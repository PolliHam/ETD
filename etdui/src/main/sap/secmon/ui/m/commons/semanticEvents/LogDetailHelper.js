jQuery.sap.declare("sap.secmon.ui.m.commons.semanticEvents.LogDetailHelper");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.browse.utils");
jQuery.sap.require("sap.secmon.ui.browse.Constants");

sap.secmon.ui.m.commons.semanticEvents.LogDetailHelper = function() {

    this.rebindData = function(logDetail, lastSelectedObject) {

        // Panel shows the OriginalData -> its content is a UI5 TextView
        var oOriginalData = logDetail.getContent()[7];
        oOriginalData.setExpanded(false);
        oOriginalData.getContent()[0].setText("");
        oOriginalData.attachEventOnce("expand", function(oEvent) {
            // Do nothing if it is not expanding
            if (!oEvent.getParameter("expand")) {
                return;
            }
            // Set up filters for loading the original data
            var aFilters = [];
            aFilters.push(new sap.ui.model.Filter({
                path : 'Id',
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : lastSelectedObject.Id
            }));

            // The real resolution of timestamp is in second
            // ISO string for Timestamp includes T between date and time
            var sTs = lastSelectedObject.Timestamp.replace(" ", "T");
            var oQuery = {
                context : "Log",
                dataSets : [],
                // now : oSelectedObject.Timestamp.replace(" ", "T"), // ISO String: "2018-04-11T12:18:19.000000Z",
                operation : "getData",
                original : true,
                period : {
                    operator : "BETWEEN",
                    // We round it up to .00 to .59
                    searchTerms : [ sTs.replace(/\.\d.*Z$/, ".000Z"), sTs.replace(/\.\d.*Z$/, ".999Z") ]
                },
                verbose : false,
            };

            var sKey = '@HEADER_TABLE_KEY_FIELD_KEY'; // Key for ID is: @HEADER_TABLE_KEY_FIELD_KEY
            var aDataSets = [ {
                name : "Path1.Subset1",
                context : "Log",
                dependsOn : [],
                filters : [ {
                    key : sKey,
                    valueRange : {
                        operator : "=",
                        searchTerms : [ lastSelectedObject.Id ]
                    }
                } ]
            } ];

            oQuery.dataSets = aDataSets;
            oQuery.startDatasets = [ {
                name : aDataSets[0].name
            } ];

            oOriginalData.setBusy(true);
            return sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery), true).done(function(response, textStatus, XMLHttpRequest) {
                // Let Original Data field show the data
                oOriginalData.getContent()[0].setText(response[0] ? response[0].ShortMessage : "");
            }).fail(function(jqXHR, textStatus, errorThrown) {
                var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                oOriginalData.getContent()[0].setText(messageText);
            }).always(function() {
                oOriginalData.setBusy(false);
            });
        });
    };
};