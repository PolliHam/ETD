sap.ui.define([
	"sap/ui/test/Opa5",
	"test/apps/alertsfs/pages/Common",
	"sap/ui/test/matchers/AggregationLengthEquals"
	// 'sap/ui/test/actions/Press'
], function (Opa5, Common, AggregationLengthEquals, Press) {
	"use strict";

	var sViewName = "Alerts";

	Opa5.createPageObjects({
		onTheAlertsPage: {
			baseClass: Common,
			actions: {
				iPressPatternSelectDialog: function () {
					return this.waitFor({
						id          : "patternFilterInput",
						viewName    : sViewName,
						// action: new Press(),
						success     : function (oControl) {
							oControl.fireValueHelpRequest();
						},
						errorMessage: "Pattern Filter Input cannot be opened"
					});
				}
			}
		}
	});
});
