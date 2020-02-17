jQuery.sap.declare("sap.secmon.ui.m.semanticEventFS.view.SuggestionHelper");

sap.secmon.ui.m.semanticEventFS.view.SuggestionHelper = (function() {

    function _regexFromTextToHighlight(sTextToHighlight) {
        var sTextToHighlightQuoted = (sTextToHighlight + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!<>\|\:])/g, "\\$1");
        return new RegExp("(" + sTextToHighlightQuoted + ")", 'gi');
    }

    function _highlight(sText, sTextToHighlight) {
        return sText.replace(_regexFromTextToHighlight(sTextToHighlight), "<b>$1</b>");
    }

    function _canHighlight(sText, sTextToHighlight) {
        return _regexFromTextToHighlight(sTextToHighlight).test(sText);
    }

    return {
        handleSuggest : function(oEvent) {
            var oControl = this.byId(oEvent.getSource().getId());
            var sField;
            oControl.getCustomData().some(function(oField) {
                if (oField.mProperties.key === "urlParamName") {
                    sField = oField.mProperties.value;
                    return true;
                }
            });

            var oSourceControl = oEvent.getSource();
            var sSuggestValue = oEvent.getParameter("suggestValue");

            var aValues = $.ajax({
                type : "GET",
                url : "/sap/secmon/services/ui/m/semanticEvents/EventColumnSuggestionHelper.xsjs?columnName=" + sField + "&columnValue=" + sSuggestValue
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
                aValuesResult.forEach(function(entry) {

                    var encodedEntry = encodeURIComponent(entry);
                    var oDummyNameCell = new sap.m.Label({
                        text : encodedEntry
                    });

                    var oNameCell;
                    if (_canHighlight(entry, sSuggestValue)) {
                        sText = "<span>" + _highlight(entry, sSuggestValue) + "</span>";
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
                        oNameCell.setText(entry);
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
                        Id : entry,
                        Name : entry
                    });
                    oColumnListItem.addCustomData(oCustomData);
                    oSourceControl.addSuggestionRow(oColumnListItem);
                }, this);

            }, this));
        },

        handleSuggestionItemSelected : function(oEvent) {
            var oControl = this.byId(oEvent.getSource().getId());
            var sField;
            oControl.getCustomData().some(function(oField) {
                if (oField.mProperties.key === "urlParamName") {
                    sField = oField.mProperties.value;
                    return true;
                }
            });
            var oSelectedRow = oEvent.getParameter("selectedRow");
            var aCustomData = oSelectedRow.getCustomData();
            var multiInput = oEvent.getSource();
            var i;
            var aTokens = multiInput.getTokens();
            for (i = 0; i < aCustomData.length; i++) {
                if (aCustomData[i].getKey() === sField) {
                    var oToken = new sap.m.Token();
                    oToken.setText(aCustomData[i].getValue().Name);
                    oToken.setKey(aCustomData[i].getValue().Name);
                    aTokens.push(oToken);

                    break;
                }
            }
            multiInput.setValue("");
            multiInput.setTokens(aTokens);
        },

    };

}());
