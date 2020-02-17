jQuery.sap.declare("sap.secmon.ui.m.commons.SuggestionHelper");

/**
 * Helper for the event handling of events "suggest" and "suggestionItemSelected" of sap.m.MultiInput. It accepts a suggestValue, and sends a search request to an OData service.
 * 
 * @param baseUrl
 *            a URL of an ODATA service, it is used to send a search request in JSON format. E.g. "/sap/secmon/services/ui/m/AnomalyPatternSearch.xsodata/AnomalyPatternSearch"
 */
sap.secmon.ui.m.commons.SuggestionHelper = function(baseUrl, bSearch) {

    function _regexFromTextToHighlight(sTextToHighlight) {
        var sTextToHighlightQuoted = (sTextToHighlight + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!>\|\:])/g, "\\$1");
        return new RegExp("(" + sTextToHighlightQuoted + ")", 'gi');
    }

    function _highlight(sText, sTextToHighlight) {
        return sText.replace(_regexFromTextToHighlight(sTextToHighlight), "<b>$1</b>");
    }

    function _canHighlight(sText, sTextToHighlight) {
        return _regexFromTextToHighlight(sTextToHighlight).test(sText);
    }

    /**
     * Event handler for event "suggest". the event source is expected to have custom data "urlParamName" with the name of the field to filter.
     * 
     */
    this.handleSuggest = function(oEvent) {
        var oControl = this.byId(oEvent.getSource().getId());
        var sField;
        oControl.getCustomData().some(function(oField) {
            if (oField.mProperties.key === "urlParamName") {
                sField = oField.mProperties.value;
                return true;
            }
        });

        var oSourceControl = oEvent.getSource();
        var sSuggestValue = oEvent.getParameter("suggestValue").toLowerCase();
        var urlParams = "$filter=indexof(tolower(" + encodeURIComponent(sField) + "),'" + encodeURIComponent(sSuggestValue) + "') gt -1";

        var sUrl = baseUrl + "?$top=100&$format=json&$select=" + encodeURIComponent(sField) + "&ts=" + Date.now() + "&" + urlParams;

        var aValues = $.ajax({
            type : "GET",
            url : sUrl
        });

        $.when(aValues).then($.proxy(function(aValuesResult) {
            // use a dummy cell; if the user selects a row
            // the first item which has the
            // a binding property with the name text (like
            // Label) will be used to set
            // the current selection; the dummy cell is used
            // to ensure that the current pattern
            // is displayed in the input-field (although a
            // HTML-item was used)
            var sText;
            oSourceControl.destroySuggestionRows();
            aValuesResult.d.results.forEach(function(entry) {

                var value = entry[sField];
                var valueEncoded = encodeURIComponent(value);
                var oDummyNameCell = new sap.m.Label({
                    text : value
                });

                var oNameCell;
                if (_canHighlight(value, sSuggestValue)) {
                    sText = "<span>" + _highlight(value, sSuggestValue) + "</span>";
                    oNameCell = new sap.ui.core.HTML({
                        sanitizeContent : true
                    });
                    // Value needs to be set this way because of e.g.
                    // Transaction Name "{SRALCONFIG"
                    oNameCell.setContent(sText);
                } else {
                    oNameCell = new sap.m.Label();
                    // Value needs to be set this way because of e.g.
                    // Transaction Name "{SRALCONFIG"
                    oNameCell.setText(value);
                }

                var oColumnListItem = new sap.m.ColumnListItem({
                    type : "Active",
                    vAlign : "Middle",
                    cells : [ oDummyNameCell, oNameCell ]
                });

                var oCustomData = new sap.ui.core.CustomData({
                    key : sField
                });
                // Value needs to be set this way because of e.g.
                // Transaction Name "{SRALCONFIG"
                oCustomData.setValue({
                    Id : valueEncoded,
                    Name : value
                });
                oColumnListItem.addCustomData(oCustomData);
                oSourceControl.addSuggestionRow(oColumnListItem);
            }, this);

        }, this));
    };

    /**
     * Event handler for event "suggestionItemSelected". The event source is expected to have custom data "urlParamName" with the fieldname that is filtered.
     */
    this.handleSuggestionItemSelected = function(oEvent) {
        var oControl = oEvent.getSource();
        var sField;
        oControl.getCustomData().some(function(oField) {
            if (oField.mProperties.key === "urlParamName") {
                sField = oField.mProperties.value;
                return true;
            }
        });
        var oSelectedRow = oEvent.getParameter("selectedRow");
        var aCustomData = oSelectedRow.getCustomData();
        var i;
        var aTokens = oControl.getTokens();
        for (i = 0; i < aCustomData.length; i++) {
            if (aCustomData[i].getKey() === sField) {
                var oToken = new sap.m.Token();
                oToken.setText(aCustomData[i].getValue().Name);
                oToken.setKey(aCustomData[i].getValue().Name);
                aTokens.push(oToken);

                break;
            }
        }
        oControl.setValue("");
        oControl.setTokens(aTokens);
    };

};
