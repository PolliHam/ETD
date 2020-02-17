sap.ui.define([
    "sap/ui/test/Opa5",
    "test/apps/Patterns/pages/Common",
    "sap/ui/test/matchers/AggregationLengthEquals"
], function (Opa5, Common, AggregationLengthEquals) {
    "use strict";

    var sViewName = "Patterns";

    Opa5.createPageObjects({
        onThePatternsSelectDialog: {
            baseClass: Common,
            actions: {
                iEnterTextInSearch: function () {
                    return this.waitFor({
                        id: "idPatternSelectDialog",
                        viewName: sViewName,
                        success: function (oControl) {
                            oControl._searchField.setValue("logon with too");
                            oControl._searchField.fireSearch();
                        },
                        errorMessage: "Pattern Filter Input cannot be opened"
                    });
                },
                iSelectedTwoItemsAndPressedOk: function () {
                    return this.waitFor({
                        id: "idPatternSelectDialog",
                        viewName: sViewName,
                        success: function (oControl) {
                            oControl.getAggregation("items")[0].setSelected(true);
                            oControl.getAggregation("items")[1].setSelected(true);
                            oControl._oOkButton.firePress();
                        },
                        errorMessage: "Pattern Filter Input cannot be opened"
                    });
                }
            },

            assertions: {
                iShouldSeeSearchResult: function () {
                    return this.waitFor({
                        id: "idPatternSelectDialog",
                        viewName: sViewName,
                        matchers: new AggregationLengthEquals({
                            name: "items",
                            length: 2
                        }),
                        success: function (oControl) {
                            assert.ok(oControl, "We found 2 patterns");
                        },
                        errorMessage: "PatternSelectDialog does not have all entries."
                    });
                }
            }
        }
    });
});
