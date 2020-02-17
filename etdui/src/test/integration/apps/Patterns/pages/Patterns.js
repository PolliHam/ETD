sap.ui.define([
    "sap/ui/test/Opa5",
    "test/apps/Patterns/pages/Common",
    "sap/ui/test/matchers/AggregationLengthEquals"
    // 'sap/ui/test/actions/Press'
], function (Opa5, Common, AggregationLengthEquals, Press) {
    "use strict";

    var sViewName = "Patterns";

    Opa5.createPageObjects({
        onThePatternsPage: {
            baseClass: Common,
            actions: {
                iPressPatternSelectDialog: function () {
                    return this.waitFor({
                        id: "patternFilterInput",
                        viewName: sViewName,
                        // action: new Press(),
                        success: function (oControl) {
                            oControl.fireValueHelpRequest();
                        },
                        errorMessage: "Pattern Filter Input cannot be opened"
                    });
                },
                iPressGo: function () {
                    return this.waitFor({
                        id: "filterBar",
                        viewName: sViewName,
                        // action: new Press(),
                        success: function (oControl) {
                            oControl._oSearchButton.firePress();
                        },
                        errorMessage: "Pattern Filter Input cannot be opened"
                    });
                }
            },

            assertions: {
                iShouldSeePage: function () {
                    return this.waitFor({
                        id: "page",
                        viewName: sViewName,
                        success: function (oControl) {
                            assert.ok(oControl, "Patterns page opened");
                        }
                    });
                },
                iShouldSeeList: function () {
                    return this.waitFor({
                        id: "patternsTable",
                        viewName: sViewName,
                        success: function (oControl) {
                            assert.ok(oControl, "Patterns Table exists");
                            assert.equal(oControl.getColumns().length, 10, "There are 10 columns");
                            assert.equal(oControl.getAggregation("items").length, 1, "There are 1 lines from mock data");
                        }
                    });
                },
                iShouldSeeFilterBar: function () {
                    return this.waitFor({
                        id: "filterBar",
                        viewName: sViewName,
                        success: function (oControl) {
                            assert.ok(oControl, "Patterns Filter Bar exists");
                            assert.equal(oControl.getFilterBarExpanded(), true, "Filter Bar is expanded");
                            assert.equal(oControl.getAggregation("filterItems").length, 7, "There are 7 filters available");
                            assert.equal(oControl.getShowRestoreButton(), false, "Restore button is not available");
                        }
                    });
                },
                iShouldSeePatternSelectDialog: function () {
                    return this.waitFor({
                        id: "idPatternSelectDialog",
                        viewName: sViewName,
                        success: function (oControl) {
                            assert.ok(oControl, "Dialog has been opened");
                        }
                    });
                },
                iShouldSeeTwoItemsInMultiInput: function () {
                    return this.waitFor({
                        id: "patternFilterInput",
                        viewName: sViewName,
                        matchers: new AggregationLengthEquals({
                            name: "tokens",
                            length: 2
                        }),
                        success: function (oControl) {
                            assert.ok(oControl, "Patterns can be selected");
                        }
                    });
                },
                iShouldSeeSearchResult: function () {
                    return this.waitFor({
                        id: "patternsTable",
                        viewName: sViewName,
                        success: function (oControl) {
                            assert.equal(oControl.getAggregation("items").length, 0, "No items with such filter criteria");
                        }
                    });
                }
            }
        }
    });
});
