jQuery.sap.declare("sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper");

sap.secmon.ui.m.commons.patternSuggestion.PatternSuggestionHelper =
        (function() {

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

            return {
                handleSuggest : function(oEvent) {
                    var patterns, anomalyPatterns;
                    var oSourceControl = oEvent.getSource();
                    var sSuggestValue = oEvent.getParameter("suggestValue");
                    var sUrl = this.QUBE_SEARCH_SERVICE_URL + encodeURIComponent(sSuggestValue + "*") + "&ts=" + Date.now();
                    var sAnomalyPatternUrl =
                            "/sap/secmon/services/ui/m/AnomalyPatternSearch.xsodata/AnomalyPatternSearch?$format=json&search=" + encodeURIComponent(sSuggestValue + "*") + "&ts=" + Date.now();

                    function patternExistsInModel(sId) {
                        var oData = this.getComponent().getModel("Patterns").getData();
                        var returnValue = false;
                        oData.WorkspacePatterns.forEach(function(pattern) {
                            if (pattern.Id === sId) {
                                returnValue = true;
                                return;
                            }
                        });
                        return returnValue;

                    }
                    // patterns from qube
                    patterns = $.ajax({
                        type : "GET",
                        url : sUrl
                    });

                    // anomaly patterns
                    anomalyPatterns = $.ajax({
                        type : "GET",
                        url : sAnomalyPatternUrl
                    });

                    $.when(patterns, anomalyPatterns).then(
                            $.proxy(function(patternResult, anomalyPatternResult) {

                                if (patternResult[0].d && patternResult[0].d.results && $.isArray(patternResult[0].d.results)) {
                                    var oCommons = this.oCommons;
                                    var enumsModel = this.getView().getModel("enums");
                                    oSourceControl.destroySuggestionRows();
                                    var results;
                                    if (anomalyPatternResult[0].d && anomalyPatternResult[0].d.results && $.isArray(anomalyPatternResult[0].d.results)) {
                                        results = patternResult[0].d.results.concat(anomalyPatternResult[0].d.results);
                                        // sort according to search ranking
                                        results.sort(function(a, b) {
                                            return parseFloat(b["@com.sap.vocabularies.Search.v1.Ranking"]) - parseFloat(a["@com.sap.vocabularies.Search.v1.Ranking"]);
                                        });
                                    }

                                    results.forEach($.proxy(function(oEntry) {
                                        if (oEntry.Type === "Pattern" || oEntry.Type === "Anomaly") {
                                            // FL patterns: take only public pattern from model
                                            if (oEntry.Type === "Pattern" && !patternExistsInModel.call(this, oEntry.Id)) {
                                                return;
                                            }
                                            var sText;
                                            // use a dummy cell; if the user selects a row
                                            // the first item which has the
                                            // a binding property with the name text (like
                                            // Label) will be used to set
                                            // the current selection; the dummy cell is used
                                            // to ensure that the current pattern
                                            // is displayed in the input-field (although a
                                            // HTML-item was used)

                                            var type = (oEntry.Type === "Pattern") ? 'FLAB' : 'ANOMALY';
                                            var oEnumService = new sap.secmon.ui.commons.EnumService();
                                            var patternType = oEnumService.getEnumValue(enumsModel, "/sap.secmon.services.ui.m.alerts/Pattern/Type/", type);
                                            var nameAndNamespace = patternType + " " + oEntry.Name + " (" + oEntry.Namespace + ")";
                                            var oDummyPatternNameCell = new sap.m.Label({
                                                text : nameAndNamespace
                                            });

                                            var oPatternNameCell;

                                            if (_canHighlight(oEntry.Name, sSuggestValue)) {
                                                sText = "<span>" + _highlight(oEntry.Name, sSuggestValue) + " (" + oEntry.Namespace + ")" + "</span>";
                                                oPatternNameCell = new sap.ui.core.HTML({
                                                    content : sText,
                                                    sanitizeContent : true
                                                });
                                            } else {
                                                oPatternNameCell = new sap.m.Label({
                                                    text : nameAndNamespace
                                                });
                                            }

                                            var oPatternTypeCell =
                                                    new sap.m.Label({
                                                        text : oEntry.Type === "Anomaly" ? this.getComponent().getModel("i18nCommon").getProperty("Yes_FLD") : this.getComponent().getModel(
                                                                "i18nCommon").getProperty("No_FLD")
                                                    });

                                            var oColumnListItem = new sap.m.ColumnListItem({
                                                type : "Active",
                                                vAlign : "Middle",
                                                cells : [ oDummyPatternNameCell, oPatternNameCell, oPatternTypeCell ]
                                            });
                                            oColumnListItem.addCustomData(new sap.ui.core.CustomData({
                                                key : "Pattern",
                                                value : {
                                                    Id : oCommons.base64ToHex(oEntry.Id),
                                                    Name : oEntry.Name
                                                }
                                            }));
                                            oSourceControl.addSuggestionRow(oColumnListItem);
                                        }
                                    }, this));
                                }
                            }, this));

                },

                handleSuggestionItemSelected : function(oEvent) {
                    var oSelectedRow = oEvent.getParameter("selectedRow");
                    var aCustomData = oSelectedRow.getCustomData();
                    var multiInput = oEvent.getSource();
                    var i;
                    var aTokens = multiInput.getTokens();
                    for (i = 0; i < aCustomData.length; i++) {
                        if (aCustomData[i].getKey() === "Pattern") {

                            aTokens.push(new sap.m.Token({
                                text : aCustomData[i].getValue().Name,
                                key : aCustomData[i].getValue().Id
                            }));

                            break;
                        }
                    }
                    multiInput.setValue("");
                    multiInput.setTokens(aTokens);
                }

            };

        }());
